import { redirect } from "next/navigation";

import { getUserAdminRole, meetsMinRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

import { SettingsAdmin } from "./settings-admin";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const role = await getUserAdminRole(supabase, user.id);
  if (!meetsMinRole(role, "apostle")) redirect("/admin/dashboard");

  const { data: allRoles } = await supabase
    .from("user_roles")
    .select("user_id, role, granted_at, granted_by")
    .in("role", ["staff", "executive", "apostle"])
    .order("granted_at", { ascending: false });

  const staffUserIds = [
    ...new Set((allRoles ?? []).map((r) => r.user_id)),
  ];

  const { data: profiles } = staffUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", staffUserIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  const roleMap = new Map<string, string[]>();
  (allRoles ?? []).forEach((r) => {
    const list = roleMap.get(r.user_id) ?? [];
    list.push(r.role);
    roleMap.set(r.user_id, list);
  });

  const staffUsers = staffUserIds.map((id) => ({
    id,
    display_name: profileMap.get(id) ?? null,
    roles: roleMap.get(id) ?? [],
  }));

  const activityLog = (allRoles ?? []).map((r) => ({
    user_id: r.user_id,
    role: r.role,
    granted_at: r.granted_at,
    granted_by_name: r.granted_by
      ? profileMap.get(r.granted_by) ?? null
      : null,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Admin settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage admin access and view role change history. Apostle access only.
        </p>
      </div>
      <SettingsAdmin staffUsers={staffUsers} activityLog={activityLog} />
    </div>
  );
}
