"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const APOSTLE_ROLE = "apostle";

async function requireApostle(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isApostle = roles?.some((r) => r.role === APOSTLE_ROLE);
  return { user, isApostle: !!isApostle };
}

export async function promoteToRole(userId: string, role: string) {
  const supabase = await createClient();
  const { user, isApostle } = await requireApostle(supabase);

  if (!isApostle) {
    return { ok: false, error: "Only the Apostle can manage admin access." };
  }

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role, granted_by: user!.id });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function revokeRole(userId: string, role: string) {
  const supabase = await createClient();
  const { isApostle } = await requireApostle(supabase);

  if (!isApostle) {
    return { ok: false, error: "Only the Apostle can manage admin access." };
  }

  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}
