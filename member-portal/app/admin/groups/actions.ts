"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const group_type = String(formData.get("group_type") ?? "ministry");
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!name) return { ok: false as const, error: "Name is required." };

  const { error } = await supabase
    .from("groups")
    .insert({ name, slug, description: description || null, group_type });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/groups");
  return { ok: true as const };
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/groups");
  return { ok: true as const };
}

export async function handleJoinRequest(
  requestId: string,
  groupId: string,
  userId: string,
  action: "approved" | "denied",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error: updateError } = await supabase
    .from("group_join_requests")
    .update({
      status: action,
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq("id", requestId);

  if (updateError) return { ok: false as const, error: updateError.message };

  if (action === "approved") {
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId, role: "member" });
    if (memberError)
      return { ok: false as const, error: memberError.message };
  }

  revalidatePath("/admin/groups");
  return { ok: true as const };
}

export async function removeGroupMember(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/groups");
  return { ok: true as const };
}
