"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { ok: false as const, error: "Title and body required." };

  const { error } = await supabase.from("bulletin_posts").insert({
    author_id: user.id,
    title,
    body,
    is_announcement: true,
    is_pinned: true,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/bulletin");
  return { ok: true as const };
}

export async function togglePin(postId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bulletin_posts")
    .update({ is_pinned: !isPinned })
    .eq("id", postId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/bulletin");
  return { ok: true as const };
}

export async function deleteBulletinPost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bulletin_posts").delete().eq("id", postId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/bulletin");
  return { ok: true as const };
}
