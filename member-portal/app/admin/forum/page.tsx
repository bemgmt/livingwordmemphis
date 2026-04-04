import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { ForumAdmin } from "./forum-admin";

export default async function AdminForumPage() {
  const supabase = await createClient();

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, sermon_id, title, body, author_id, is_locked, is_pinned, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-foreground">
            Forum moderation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage sermon discussion topics. Create new prompts in the{" "}
            <Link
              href="/admin/studio"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Content Studio
            </Link>
            .
          </p>
        </div>
      </div>
      <ForumAdmin topics={topics ?? []} />
    </div>
  );
}
