import { randomUUID } from "node:crypto";

import { userCanManageYouthContent } from "@/lib/auth/youth";
import { createClient } from "@/lib/supabase/server";
import {
  safeCurriculumFilename,
  validateCurriculumFile,
  YOUTH_CURRICULUM_BUCKET,
} from "@/lib/youth-curriculum";

export const runtime = "nodejs";

type UploadRequest = {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
};

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Sign in to upload curriculum.", 401);

  if (!(await userCanManageYouthContent(supabase, user.id))) {
    return jsonError("Only church staff may upload curriculum.", 403);
  }

  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return jsonError("Invalid upload request.", 400);
  }

  if (
    typeof body.filename !== "string" ||
    typeof body.contentType !== "string" ||
    typeof body.size !== "number"
  ) {
    return jsonError("Filename, file type, and size are required.", 400);
  }

  const validation = validateCurriculumFile({
    filename: body.filename,
    contentType: body.contentType,
    size: body.size,
  });
  if (!validation.ok) return jsonError(validation.error, 400);

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const filename = safeCurriculumFilename(body.filename);
  const storagePath = `uploads/${year}/${month}/${randomUUID()}-${filename}`;

  const { data, error } = await supabase.storage
    .from(YOUTH_CURRICULUM_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("Unable to create youth curriculum upload URL", error);
    return jsonError("The secure upload could not be started.", 500);
  }

  return Response.json(
    {
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      contentType: validation.contentType,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
