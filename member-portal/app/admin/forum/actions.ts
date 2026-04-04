"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleLockTopic(topicId: string, isLocked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_topics")
    .update({ is_locked: !isLocked })
    .eq("id", topicId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/forum");
  return { ok: true as const };
}

export async function togglePinTopic(topicId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_topics")
    .update({ is_pinned: !isPinned })
    .eq("id", topicId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/forum");
  return { ok: true as const };
}

export async function deleteForumTopic(topicId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("forum_topics").delete().eq("id", topicId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/forum");
  return { ok: true as const };
}

export async function deleteForumReply(replyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/forum");
  return { ok: true as const };
}
