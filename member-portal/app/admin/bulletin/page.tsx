import { createClient } from "@/lib/supabase/server";

import { BulletinAdmin } from "./bulletin-admin";

export default async function AdminBulletinPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("bulletin_posts")
    .select("id, author_id, title, body, is_pinned, is_announcement, created_at")
    .order("created_at", { ascending: false });

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: profiles } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [] };

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  const postsWithAuthors = (posts ?? []).map((p) => ({
    ...p,
    author_name: nameMap.get(p.author_id) ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Bulletin board
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate posts, pin important items, and create announcements.
        </p>
      </div>
      <BulletinAdmin posts={postsWithAuthors} />
    </div>
  );
}
