"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateReportStatus(
  reportId: string,
  status: "reviewed" | "removed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("content_reports")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true as const };
}

export async function removeReportedContent(
  reportId: string,
  contentType: string,
  contentId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tableMap: Record<string, string> = {
    bulletin_post: "bulletin_posts",
    bulletin_comment: "bulletin_comments",
    forum_topic: "forum_topics",
    forum_reply: "forum_replies",
  };

  const table = tableMap[contentType];
  if (table) {
    await supabase.from(table).delete().eq("id", contentId);
  }

  const { error } = await supabase
    .from("content_reports")
    .update({
      status: "removed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true as const };
}
