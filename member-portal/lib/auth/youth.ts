import type { SupabaseClient } from "@supabase/supabase-js";

export const YOUTH_ACCESS_ROLES = [
  "youth_ministry",
  "youth_minister",
  "staff",
  "executive",
  "apostle",
] as const;

export const YOUTH_CONTENT_MANAGER_ROLES = [
  "staff",
  "executive",
  "apostle",
] as const;

export const YOUTH_CURRICULUM_DELETE_ROLES = [
  "youth_minister",
  ...YOUTH_CONTENT_MANAGER_ROLES,
] as const;

async function fetchUserRoles(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data?.length) return [];
  return data.map((entry) => entry.role as string);
}

function hasOneOf(roles: string[], allowedRoles: readonly string[]) {
  const allowed = new Set(allowedRoles);
  return roles.some((role) => allowed.has(role));
}

export function rolesGrantYouthAccess(roles: Iterable<string>) {
  return hasOneOf(Array.from(roles), YOUTH_ACCESS_ROLES);
}

export async function userHasYouthAccess(
  supabase: SupabaseClient,
  userId: string,
) {
  return rolesGrantYouthAccess(await fetchUserRoles(supabase, userId));
}

export async function userCanManageYouthContent(
  supabase: SupabaseClient,
  userId: string,
) {
  return hasOneOf(
    await fetchUserRoles(supabase, userId),
    YOUTH_CONTENT_MANAGER_ROLES,
  );
}

export async function userCanDeleteYouthContent(
  supabase: SupabaseClient,
  userId: string,
) {
  return hasOneOf(
    await fetchUserRoles(supabase, userId),
    YOUTH_CURRICULUM_DELETE_ROLES,
  );
}
