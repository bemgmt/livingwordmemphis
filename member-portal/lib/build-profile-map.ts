import type { SupabaseClient } from "@supabase/supabase-js";

export async function buildProfileMap(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (!unique.length) return {};

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  const map: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    map[p.id] = p.display_name ?? "Member";
  });
  return map;
}
