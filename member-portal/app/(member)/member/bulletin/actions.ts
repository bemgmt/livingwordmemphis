"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBulletinPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body)
    return { ok: false as const, error: "Title and body are required." };

  const { error } = await supabase.from("bulletin_posts").insert({
    author_id: user.id,
    title,
    body,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/bulletin");
  return { ok: true as const };
}

export async function createBulletinComment(postId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  if (!body.trim())
    return { ok: false as const, error: "Comment cannot be empty." };

  const { error } = await supabase.from("bulletin_comments").insert({
    post_id: postId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/bulletin");
  return { ok: true as const };
}

export async function deleteBulletinPost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bulletin_posts")
    .delete()
    .eq("id", postId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/bulletin");
  return { ok: true as const };
}
