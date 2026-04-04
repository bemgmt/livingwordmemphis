import { createClient } from "@/lib/supabase/server";

import { GroupsAdmin } from "./groups-admin";

export default async function AdminGroupsPage() {
  const supabase = await createClient();

  const [{ data: groups }, { data: joinRequests }, { data: groupMembers }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id, name, slug, description, group_type, is_active, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("group_join_requests")
        .select("id, group_id, user_id, status, message, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("group_members")
        .select("group_id, user_id, role, joined_at"),
    ]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name");

  const profileMap = new Map<string, string>();
  (profiles ?? []).forEach((p) => {
    profileMap.set(p.id, p.display_name ?? "(no name)");
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Groups &amp; committees
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage groups, and review membership requests.
        </p>
      </div>
      <GroupsAdmin
        groups={groups ?? []}
        joinRequests={joinRequests ?? []}
        groupMembers={groupMembers ?? []}
        profileMap={Object.fromEntries(profileMap)}
      />
    </div>
  );
}
