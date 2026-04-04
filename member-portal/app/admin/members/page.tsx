import { createClient } from "@/lib/supabase/server";

import { MembersAdmin } from "./members-admin";

export default async function AdminMembersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, phone, avatar_url, created_at")
    .order("created_at", { ascending: false });

  const { data: allRoles } = await supabase
    .from("user_roles")
    .select("user_id, role");

  const roleMap = new Map<string, string[]>();
  (allRoles ?? []).forEach((r) => {
    const list = roleMap.get(r.user_id) ?? [];
    list.push(r.role);
    roleMap.set(r.user_id, list);
  });

  const members = (profiles ?? []).map((p) => ({
    ...p,
    roles: roleMap.get(p.id) ?? ["member"],
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Members
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all member accounts and roles.
        </p>
      </div>
      <MembersAdmin members={members} />
    </div>
  );
}
