import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { userCanDeleteYouthContent } from "@/lib/auth/youth";
import { sanityWriteClient } from "@/lib/sanity/client";
import { requireAuth } from "@/lib/supabase/auth-helpers";

import { CurriculumManager, type ManageableCurriculumDocument } from "./curriculum-manager";

const documentsQuery = `*[_type == "youthMinistryDocument" && !(_id in path("drafts.**"))]
  | order(series asc, week asc, title asc) {
    _id,
    title,
    series,
    week,
    resourceType,
    protectedFile { originalFilename, storagePath }
  }`;

export default async function ManageYouthCurriculumPage() {
  const { supabase, user } = await requireAuth();

  if (!(await userCanDeleteYouthContent(supabase, user.id))) {
    redirect("/member/access-denied?area=youth-curriculum-management");
  }

  const documents =
    await sanityWriteClient.fetch<ManageableCurriculumDocument[]>(
      documentsQuery,
    );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-4">
        <Link
          href="/member/youth"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to youth curriculum
        </Link>
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-medium text-foreground">
            <Trash2 className="size-7 text-destructive" aria-hidden />
            Manage youth curriculum
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Select incorrectly uploaded curriculum and remove it in one action.
            Deleting an item removes both its Sanity record and protected file.
          </p>
        </div>
      </div>

      <CurriculumManager documents={documents} />
    </div>
  );
}
