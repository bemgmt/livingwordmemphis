import { requireAuth } from "@/lib/supabase/auth-helpers";
import { buildProfileMap } from "@/lib/build-profile-map";
import { Pagination } from "@/components/pagination";

import { BulletinBoard } from "./bulletin-board";

const PAGE_SIZE = 20;

export default async function MemberBulletinPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { supabase, user } = await requireAuth();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: posts, count } = await supabase
    .from("bulletin_posts")
    .select(
      "id, author_id, title, body, is_pinned, is_announcement, created_at",
      { count: "exact" },
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const postIds = (posts ?? []).map((p) => p.id);

  const { data: comments } = postIds.length
    ? await supabase
        .from("bulletin_comments")
        .select("id, post_id, author_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const allAuthorIds = [
    ...new Set([
      ...(posts ?? []).map((p) => p.author_id),
      ...(comments ?? []).map((c) => c.author_id),
    ]),
  ];

  const profileMap = await buildProfileMap(supabase, allAuthorIds);

  const commentsByPost: Record<
    string,
    { id: string; author_id: string; body: string; created_at: string }[]
  > = {};
  (comments ?? []).forEach((c) => {
    if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
    commentsByPost[c.post_id].push(c);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Bulletin board
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share news, encouragements, and updates with the church family.
        </p>
      </div>
      <BulletinBoard
        posts={posts ?? []}
        commentsByPost={commentsByPost}
        profileMap={profileMap}
        currentUserId={user.id}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalCount={count ?? 0} />
    </div>
  );
}
