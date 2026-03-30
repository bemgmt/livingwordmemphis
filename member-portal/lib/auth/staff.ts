import type { SupabaseClient } from "@supabase/supabase-js";

const STAFF_ROLES = ["staff", "executive", "apostle"] as const;

export type AppRole = (typeof STAFF_ROLES)[number] | "member" | "ministry_leader";

export async function userHasStaffAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data?.length) return false;

  const allowed = new Set<string>(STAFF_ROLES);
  return data.some((row) => allowed.has(row.role as string));
}
