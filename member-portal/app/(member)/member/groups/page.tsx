import { requireAuth } from "@/lib/supabase/auth-helpers";

import { GroupsBrowser } from "./groups-browser";

export default async function MemberGroupsPage() {
  const { supabase, user } = await requireAuth();

  const [{ data: groups }, { data: myMemberships }, { data: myRequests }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id, name, slug, description, group_type, is_active")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user.id),
      supabase
        .from("group_join_requests")
        .select("group_id, status")
        .eq("user_id", user.id),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Groups &amp; committees
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse church groups and request to join.
        </p>
      </div>
      <GroupsBrowser
        groups={groups ?? []}
        myMemberships={myMemberships ?? []}
        myRequests={myRequests ?? []}
      />
    </div>
  );
}
