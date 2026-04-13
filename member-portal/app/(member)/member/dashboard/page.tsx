import Link from "next/link";
import {
  BookOpen,
  CalendarPlus,
  CreditCard,
  Heart,
  UserRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export default async function MemberDashboard() {
  const { supabase, user } = await requireAuth();

  const [
    { data: profile },
    { data: roles },
    { count: prayerCount },
    { count: givingCount },
    { data: recentPrayers },
    { data: readingPositions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, preferred_bible_version")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("prayer_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("personal_giving_notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("prayer_requests")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_reading_positions")
      .select(
        "chapter, updated_at, book:bible_books!inner(name), translation:bible_translations!inner(abbreviation)",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const roleLabels = roles?.map((r) => r.role).join(", ") || "member";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {profile?.display_name ?? user?.email}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/member/prayer" className="block">
          <Card className="h-full transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prayer requests
              </CardTitle>
              <Heart className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {prayerCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Submitted by you</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/giving" className="block">
          <Card className="h-full transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Giving notes
              </CardTitle>
              <CreditCard
                className="size-4 text-muted-foreground"
                aria-hidden
              />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {givingCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Private reminders saved
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile snapshot
            </CardTitle>
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Bible version</span>
              <span className="text-right text-foreground">
                {profile?.preferred_bible_version || "— not set —"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Roles</span>
              <span className="text-right text-foreground">{roleLabels}</span>
            </div>
            <Link
              href="/member/profile"
              className="inline-block pt-2 text-sm font-medium text-primary hover:underline"
            >
              Edit profile
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl font-medium">
              <CalendarPlus className="size-5" aria-hidden />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/member/prayer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <Heart className="size-4 shrink-0" aria-hidden />
              Submit a prayer request
            </Link>
            <Link
              href="/member/giving"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <CreditCard className="size-4 shrink-0" aria-hidden />
              Personal giving note
            </Link>
            <Link
              href="/member/bible"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <BookOpen className="size-4 shrink-0" aria-hidden />
              Read the Bible
            </Link>
          </CardContent>
        </Card>

        {readingPositions && readingPositions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-xl font-medium">
                <BookOpen className="size-5" aria-hidden />
                Continue reading
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const raw = readingPositions[0] as unknown as {
                  chapter: number;
                  updated_at: string;
                  book: { name: string };
                  translation: { abbreviation: string };
                };
                return (
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {raw.book.name} {raw.chapter}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        ({raw.translation.abbreviation})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last read{" "}
                      {new Date(raw.updated_at).toLocaleDateString()}
                    </p>
                    <Link
                      href="/member/bible"
                      className="inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Continue reading →
                    </Link>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl font-medium">
              Recent prayer requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPrayers?.length ? (
              <ul className="space-y-3 text-sm">
                {recentPrayers.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-medium text-foreground">
                      {p.title?.trim() || "Prayer request"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No requests yet.{" "}
                <Link href="/member/prayer" className="text-primary hover:underline">
                  Submit one
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
