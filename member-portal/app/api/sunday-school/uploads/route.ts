import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sundaySchoolSession } from "@/lib/auth/sunday-school";
import { sanityWriteClient } from "@/lib/sanity/client";
import { SUNDAY_SCHOOL_BUCKET, validateLesson } from "@/lib/sunday-school";
import { readSchoolTicket, signSchoolTicket } from "@/lib/sunday-school-ticket";
import { safeCurriculumFilename, validateCurriculumFile } from "@/lib/youth-curriculum";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  const session = await sundaySchoolSession();
  if (!session) return failure("Sign in to upload curriculum.", 401);
  if (!session.canUpload) return failure("A Sunday school teacher or administrator role is required.", 403);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return failure("Invalid request origin.", 403);
  if (!process.env.LWM_SANITY_TOKEN || !process.env.SUPABASE_SERVICE_ROLE_KEY) return failure("Curriculum uploads are not configured. Please contact an administrator.", 503);
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 20000) return failure("Upload details are too large.", 400);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) return failure("Invalid upload request.", 400);
  } catch { return failure("Invalid upload request.", 400); }

  if (body.step === "prepare") {
    let lesson;
    try { lesson = validateLesson(body); } catch (error) { return failure((error as Error).message, 400); }
    if (typeof body.filename !== "string" || body.filename.length > 240 || typeof body.contentType !== "string" || typeof body.size !== "number" || !Number.isSafeInteger(body.size)) return failure("Filename, file type and file size are required.", 400);
    const validation = validateCurriculumFile({ filename: body.filename, contentType: body.contentType, size: body.size });
    if (!validation.ok) return failure(validation.error, 400);
    const id = randomUUID();
    const storagePath = `${session.user.id}/${lesson.month}/${lesson.classGroup}/${lesson.lessonDate}/${id}-${safeCurriculumFilename(body.filename)}`;
    const { data, error } = await session.supabase.storage.from(SUNDAY_SCHOOL_BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) return failure("The upload could not be started. Please try again.", 503);
    const ticket = signSchoolTicket({ ...lesson, id, userId: session.user.id, storagePath, filename: body.filename, contentType: validation.contentType, size: body.size, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
    return Response.json({ storagePath, token: data.token, ticket, contentType: validation.contentType }, { headers });
  }

  if (body.step === "publish") {
    let upload;
    try { upload = readSchoolTicket(body.ticket, session.user.id); } catch (error) { return failure((error as Error).message, 400); }
    // Do not publish metadata until Storage confirms that the entire object exists.
    const { data: file, error } = await session.supabase.storage.from(SUNDAY_SCHOOL_BUCKET).info(upload.storagePath);
    if (error || !file) return failure("The file is not available yet. Retry publishing after the upload finishes.", 409);
    if (Number(file.size) !== upload.size || file.contentType !== upload.contentType) return failure("The uploaded file does not match the selected file. Start a new upload.", 400);
    const documentId = `sundaySchoolLesson.${upload.id}`;
    try {
      await sanityWriteClient.createIfNotExists({
        _id: documentId, _type: "sundaySchoolLesson", title: upload.title,
        month: upload.month, classGroup: upload.classGroup, lessonDate: upload.lessonDate,
        description: upload.description, uploadedBy: session.user.id,
        protectedFile: { _type: "object", storagePath: upload.storagePath, originalFilename: upload.filename, contentType: upload.contentType, size: upload.size },
      });
    } catch {
      return failure("Your file is uploaded, but the curriculum list could not be updated. Retry publishing below.", 503);
    }
    revalidatePath("/member/sunday-school");
    return Response.json({ id: documentId }, { headers });
  }
  return failure("Invalid upload step.", 400);
}
