"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EXECUTIVE_ROLES = new Set(["executive", "apostle"]);

async function requireExecutiveOrApostle(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const hasAccess = roles?.some((r) => EXECUTIVE_ROLES.has(r.role as string));
  return { user, hasAccess: !!hasAccess };
}

export async function updateMemberRole(
  userId: string,
  role: string,
  action: "add" | "remove",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  if (action === "add") {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role, granted_by: user.id });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMember(userId: string) {
  const supabase = await createClient();
  const { hasAccess } = await requireExecutiveOrApostle(supabase);

  if (!hasAccess) {
    return { ok: false, error: "Only executive or apostle roles can remove members." };
  }

  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function updateMemberProfile(
  userId: string,
  data: { display_name?: string; phone?: string },
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/members");
  return { ok: true };
}
