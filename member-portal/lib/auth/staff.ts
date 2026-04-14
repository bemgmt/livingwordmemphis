import type { SupabaseClient } from "@supabase/supabase-js";

const STAFF_ROLES = ["staff", "executive", "apostle"] as const;

export type AdminRole = "staff" | "executive" | "apostle";
export type AppRole = AdminRole | "member" | "ministry_leader";

const ROLE_RANK: Record<AdminRole, number> = {
  staff: 1,
  executive: 2,
  apostle: 3,
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  staff: "Leadership",
  executive: "Executive Team",
  apostle: "Apostle",
};

async function fetchUserRoles(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error || !data?.length) return [];
  return data.map((r) => r.role as string);
}

export async function userHasStaffAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const roles = await fetchUserRoles(supabase, userId);
  const allowed = new Set<string>(STAFF_ROLES);
  return roles.some((r) => allowed.has(r));
}

/** Returns the user's highest admin role, or null if they have none. */
export async function getUserAdminRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminRole | null> {
  const roles = await fetchUserRoles(supabase, userId);
  let best: AdminRole | null = null;
  let bestRank = 0;
  for (const r of roles) {
    const rank = ROLE_RANK[r as AdminRole];
    if (rank && rank > bestRank) {
      best = r as AdminRole;
      bestRank = rank;
    }
  }
  return best;
}

export function meetsMinRole(
  userRole: AdminRole | null,
  minRole: AdminRole,
): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}
