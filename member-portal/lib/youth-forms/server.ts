import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserAdminRole, meetsMinRole } from "@/lib/auth/staff";

export const ARCHIVE_BUCKET = "youth-signed-forms";
export function archiveService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Youth registration is not configured yet. Please contact the church.");
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function formSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at || !user.email) throw new Error("Please sign in with a verified email address to continue.");
  return { supabase, user };
}
export async function archiveAdmin() {
  const session = await formSession();
  if (!meetsMinRole(await getUserAdminRole(session.supabase, session.user.id), "executive")) throw new Error("Archive administrator access is required.");
  return session;
}
export function assertId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid record.");
}
