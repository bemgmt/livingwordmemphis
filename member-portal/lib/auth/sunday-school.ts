import { createClient } from "@/lib/supabase/server";
import { rolesCanUploadSundaySchool } from "@/lib/sunday-school";

export async function sundaySchoolSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return { supabase, user, canUpload: !error && rolesCanUploadSundaySchool((data ?? []).map(r => r.role)) };
}
