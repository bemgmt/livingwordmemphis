import { createHmac, timingSafeEqual } from "node:crypto";
import type { LessonInput } from "./sunday-school";

export type SchoolUploadTicket = LessonInput & {
  id: string; userId: string; storagePath: string; filename: string;
  contentType: string; size: number; expiresAt: number;
};
function key() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Uploads are not configured. Please contact an administrator.");
  return secret;
}
export function signSchoolTicket(value: SchoolUploadTicket) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", key()).update(`sunday-school:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}
export function readSchoolTicket(ticket: unknown, userId: string): SchoolUploadTicket {
  if (typeof ticket !== "string" || ticket.length > 16000) throw new Error("Invalid upload session.");
  const [payload, signature, extra] = ticket.split(".");
  if (!payload || !signature || extra) throw new Error("Invalid upload session.");
  const expected = createHmac("sha256", key()).update(`sunday-school:${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("Invalid upload session.");
  const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SchoolUploadTicket;
  if (value.userId !== userId || value.expiresAt < Date.now()) throw new Error("This upload session expired. Please start a new upload.");
  return value;
}
