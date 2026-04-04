import { requireAuth } from "@/lib/supabase/auth-helpers";

import { BulletinBoard } from "./bulletin-board";

export default async function MemberBulletinPage() {
  const { supabase, user } = await requireAuth();

  const { data: posts } = await supabase
    .from("bulletin_posts")
    .select("id, author_id, title, body, is_pinned, is_announcement, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
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
          Bulletin board
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share news, encouragements, and updates with the church family.
        </p>
      </div>
      <BulletinBoard
        posts={posts ?? []}
        profileMap={profileMap}
        currentUserId={user.id}
      />
    </div>
  );
}
