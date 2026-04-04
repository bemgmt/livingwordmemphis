import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: memberCount },
    { count: prayerCount },
    { count: bulletinCount },
    { count: forumTopicCount },
    { count: pendingRequestCount },
    { data: recentPrayers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("prayer_requests").select("*", { count: "exact", head: true }),
    supabase.from("bulletin_posts").select("*", { count: "exact", head: true }),
    supabase.from("forum_topics").select("*", { count: "exact", head: true }),
    supabase
      .from("group_join_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("prayer_requests")
      .select("id, created_at, visibility, title")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Members", value: memberCount, href: "/admin/members" },
    { label: "Prayer requests", value: prayerCount, href: "/admin/prayer" },
    { label: "Bulletin posts", value: bulletinCount, href: "/admin/bulletin" },
    { label: "Forum topics", value: forumTopicCount, href: "/admin/forum" },
    { label: "Pending join requests", value: pendingRequestCount, href: "/admin/groups" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational overview of the Living Word Memphis portal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{s.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums text-foreground">
                  {s.value ?? "—"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Content (Sanity CMS)
          </CardTitle>
          <CardDescription>
            Manage sermons, events, announcements, forum topics, approved Bibles,
            and study assistant knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/admin/studio">Open content studio</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent prayer requests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-border text-sm">
            {(recentPrayers ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap justify-between gap-2 py-3 first:pt-0"
              >
                <span className="text-muted-foreground">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString()
                    : "—"}
                </span>
                <span className="font-medium text-foreground">
                  {p.title || "(no title)"}
                </span>
                <span className="text-muted-foreground">{p.visibility}</span>
              </li>
            ))}
            {!recentPrayers?.length && (
              <li className="py-4 text-muted-foreground">No requests yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
