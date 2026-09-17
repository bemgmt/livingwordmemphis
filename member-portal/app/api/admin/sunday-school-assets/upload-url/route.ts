import { randomUUID } from "node:crypto";

import { sundaySchoolSession } from "@/lib/auth/sunday-school";
import { SUNDAY_SCHOOL_BUCKET } from "@/lib/sunday-school";
import { safeCurriculumFilename, validateCurriculumFile } from "@/lib/youth-curriculum";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

// Studio uses the same file chooser as Youth Curriculum. Sanity's Publish action
// saves lesson metadata; this endpoint only authorizes the private file upload.
export async function POST(request: Request) {
  const session = await sundaySchoolSession();
  if (!session) return failure("Sign in to the member portal to upload curriculum.", 401);
  if (!session.canUpload) return failure("A Sunday school teacher or administrator role is required.", 403);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    return failure("Invalid request origin.", 403);
  }

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 20000) return failure("Upload details are too large.", 400);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) return failure("Invalid upload request.", 400);
  } catch {
    return failure("Invalid upload request.", 400);
  }
  if (typeof body.filename !== "string" || body.filename.length > 240 || typeof body.contentType !== "string" || typeof body.size !== "number" || !Number.isSafeInteger(body.size)) {
    return failure("Filename, file type, and file size are required.", 400);
  }
  const validation = validateCurriculumFile({ filename: body.filename, contentType: body.contentType, size: body.size });
  if (!validation.ok) return failure(validation.error, 400);

  const month = new Date().toISOString().slice(0, 7);
  const storagePath = `${session.user.id}/studio/${month}/${randomUUID()}-${safeCurriculumFilename(body.filename)}`;
  const { data, error } = await session.supabase.storage.from(SUNDAY_SCHOOL_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data) {
    console.error("Unable to create Sunday school Studio upload URL", error?.message);
    return failure("The secure upload could not be started. Please try again.", 503);
  }
  return Response.json({ storagePath, signedUrl: data.signedUrl, contentType: validation.contentType }, { headers });
}
