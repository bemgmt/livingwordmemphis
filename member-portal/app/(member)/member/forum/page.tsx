import Link from "next/link";
import { requireAuth } from "@/lib/supabase/auth-helpers";

import { ForumTopicList } from "./forum-topic-list";

export default async function MemberForumPage() {
  const { supabase, user } = await requireAuth();

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, sermon_id, title, body, author_id, is_locked, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const authorIds = [...new Set((topics ?? []).map((t) => t.author_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", authorIds.length > 0 ? authorIds : ["none"]);

  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    profileMap[p.id] = p.display_name ?? "Member";
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Sermon forum
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discuss sermons and grow together in understanding.
        </p>
      </div>
      <ForumTopicList
        topics={topics ?? []}
        profileMap={profileMap}
        currentUserId={user.id}
      />
    </div>
  );
}
