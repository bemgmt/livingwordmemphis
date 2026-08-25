"use server";

import { revalidatePath } from "next/cache";

import { userCanDeleteYouthContent } from "@/lib/auth/youth";
import { sanityWriteClient } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { YOUTH_CURRICULUM_BUCKET } from "@/lib/youth-curriculum";

const MAX_BULK_DELETE = 500;
const STORAGE_DELETE_BATCH_SIZE = 100;
const SANITY_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

type CurriculumDocument = {
  _id: string;
  protectedFile?: {
    storagePath?: string | null;
  } | null;
};

export type BulkDeleteResult =
  | { ok: true; deleted: number; storageFilesDeleted: number }
  | { ok: false; error: string };

function normalizedDocumentIds(value: unknown) {
  if (!Array.isArray(value)) return null;

  const ids = Array.from(
    new Set(value.filter((id): id is string => typeof id === "string")),
  );

  if (
    ids.length === 0 ||
    ids.length > MAX_BULK_DELETE ||
    ids.some(
      (id) =>
        !SANITY_ID_PATTERN.test(id) ||
        id.startsWith("drafts.") ||
        id.length > 200,
    )
  ) {
    return null;
  }

  return ids;
}

export async function deleteYouthCurriculum(
  requestedDocumentIds: unknown,
): Promise<BulkDeleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sign in to delete curriculum." };

  if (!(await userCanDeleteYouthContent(supabase, user.id))) {
    return {
      ok: false,
      error: "Only an administrator or youth minister may delete curriculum.",
    };
  }

  const documentIds = normalizedDocumentIds(requestedDocumentIds);
  if (!documentIds) {
    return {
      ok: false,
      error: `Select between 1 and ${MAX_BULK_DELETE} curriculum items.`,
    };
  }

  if (!process.env.LWM_SANITY_TOKEN) {
    console.error("LWM_SANITY_TOKEN is required for curriculum deletion.");
    return { ok: false, error: "Curriculum deletion is not configured." };
  }

  const draftIds = documentIds.map((id) => `drafts.${id}`);
  let documents: CurriculumDocument[];

  try {
    documents = await sanityWriteClient.fetch<CurriculumDocument[]>(
      `*[
        _type == "youthMinistryDocument" &&
        (_id in $documentIds || _id in $draftIds)
      ] {
        _id,
        protectedFile { storagePath }
      }`,
      { documentIds, draftIds },
    );
  } catch (error) {
    console.error("Unable to load curriculum selected for deletion", error);
    return {
      ok: false,
      error: "The selected curriculum could not be verified.",
    };
  }

  const publishedIds = new Set(
    documents.map((document) => document._id.replace(/^drafts\./, "")),
  );
  if (documentIds.some((id) => !publishedIds.has(id))) {
    return {
      ok: false,
      error:
        "One or more selected curriculum items no longer exist. Refresh and try again.",
    };
  }

  const storagePaths = Array.from(
    new Set(
      documents.flatMap((document) =>
        document.protectedFile?.storagePath
          ? [document.protectedFile.storagePath]
          : [],
      ),
    ),
  );

  for (
    let index = 0;
    index < storagePaths.length;
    index += STORAGE_DELETE_BATCH_SIZE
  ) {
    const paths = storagePaths.slice(index, index + STORAGE_DELETE_BATCH_SIZE);
    const { error } = await supabase.storage
      .from(YOUTH_CURRICULUM_BUCKET)
      .remove(paths);

    if (error) {
      console.error("Unable to delete protected curriculum files", error);
      return {
        ok: false,
        error:
          "The protected files could not be deleted. No curriculum records were removed.",
      };
    }
  }

  try {
    let transaction = sanityWriteClient.transaction();
    for (const document of documents) {
      transaction = transaction.delete(document._id);
    }
    await transaction.commit();
  } catch (error) {
    console.error("Unable to delete curriculum records from Sanity", error);
    return {
      ok: false,
      error:
        "The files were removed, but the curriculum list could not be updated. Try the deletion again.",
    };
  }

  revalidatePath("/member/youth");
  revalidatePath("/member/youth/manage");

  return {
    ok: true,
    deleted: documentIds.length,
    storageFilesDeleted: storagePaths.length,
  };
}
