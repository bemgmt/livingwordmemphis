import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/supabase/auth-helpers";

import { TopicDetail } from "./topic-detail";

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { supabase, user } = await requireAuth();

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, sermon_id, title, body, author_id, is_locked, is_pinned, created_at")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) notFound();

  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, author_id, body, created_at")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  const userIds = [
    topic.author_id,
    ...(replies ?? []).map((r) => r.author_id),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", [...new Set(userIds)]);

  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    profileMap[p.id] = p.display_name ?? "Member";
  });

  return (
    <TopicDetail
      topic={topic}
      replies={replies ?? []}
      profileMap={profileMap}
      currentUserId={user.id}
    />
  );
}
