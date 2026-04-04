"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateMemberRole(
  userId: string,
  role: string,
  action: "add" | "remove",
) {
  const supabase = await createClient();

  if (action === "add") {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });
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
