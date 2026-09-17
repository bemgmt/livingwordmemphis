import "server-only";
import { createHash } from "node:crypto";
import { archiveService, ARCHIVE_BUCKET } from "./server";
import { renderSignedForm } from "./pdf";
import type { Submission } from "./schema";

// Idempotent: one immutable object per signed submission. A failed DB finalize
// retries against the already uploaded bytes, never overwriting the PDF.
export async function archiveSubmission(submission: Submission) {
  if (submission.status === "completed") return;
  const service = archiveService();
  const storage = service.storage.from(ARCHIVE_BUCKET);
  const objectPath = `${submission.guardian_id}/${submission.child_id}/${submission.id}.pdf`;
  let { data: existing } = await storage.download(objectPath);
  if (!existing) {
    const bytes = await renderSignedForm(submission);
    const { error } = await storage.upload(objectPath, bytes, { contentType: "application/pdf", upsert: false, cacheControl: "0" });
    // A concurrent retry may have won the upload. Always hash the stored bytes.
    const result = await storage.download(objectPath);
    existing = result.data;
    if (!existing) throw new Error(error ? "Your signature is saved, but the PDF archive is unavailable. Please retry archiving." : "Unable to verify the archived PDF. Please retry archiving.");
  }
  const checksum = createHash("sha256").update(Buffer.from(await existing.arrayBuffer())).digest("hex");
  const { error } = await service.from("youth_form_submissions").update({ status: "completed", storage_path: objectPath, pdf_sha256: checksum, archived_at: new Date().toISOString() }).eq("id", submission.id).eq("status", "pending");
  if (error) throw new Error("Your signature is saved. Please retry archiving to finish saving the PDF.");
}
