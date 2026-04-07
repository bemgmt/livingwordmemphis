import { requireAuth } from "@/lib/supabase/auth-helpers";
import { buildProfileMap } from "@/lib/build-profile-map";
import { Pagination } from "@/components/pagination";

import { ForumTopicList } from "./forum-topic-list";

const PAGE_SIZE = 20;

export default async function MemberForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { supabase } = await requireAuth();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: topics, count } = await supabase
    .from("forum_topics")
    .select(
      "id, sermon_id, title, body, author_id, is_locked, is_pinned, created_at",
      { count: "exact" },
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const authorIds = (topics ?? []).map((t) => t.author_id);
  const profileMap = await buildProfileMap(supabase, authorIds);

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
      <ForumTopicList topics={topics ?? []} profileMap={profileMap} />
      <Pagination page={page} pageSize={PAGE_SIZE} totalCount={count ?? 0} />
    </div>
  );
}
