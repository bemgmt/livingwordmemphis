import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { ARCHIVE_BUCKET, assertId } from "@/lib/youth-forms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  try { assertId(submissionId); } catch { return Response.json({ error: "Not found." }, { status: 404, headers }); }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return Response.json({ error: "Sign in required." }, { status: 401, headers });
  // Use the user's client and RLS for both the record and object. No service key.
  const { data: submission, error } = await supabase.from("youth_form_submissions").select("status,storage_path,pdf_sha256").eq("id", submissionId).single();
  if (error || !submission) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (submission.status !== "completed") return Response.json({ error: "PDF archiving is pending." }, { status: 409, headers });
  const { data, error: storageError } = await supabase.storage.from(ARCHIVE_BUCKET).download(submission.storage_path);
  if (storageError || !data) return Response.json({ error: "Archive temporarily unavailable." }, { status: 503, headers });
  const bytes = await data.arrayBuffer();
  if (createHash("sha256").update(Buffer.from(bytes)).digest("hex") !== submission.pdf_sha256) return Response.json({ error: "Archive verification failed. Please contact the church." }, { status: 503, headers });
  return new Response(bytes, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Living-Word-Memphis-Nursery-${submissionId}.pdf"` } });
}
