import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, CreditCard, Heart, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/member/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, preferred_bible_version")
    .eq("id", user.id)
    .maybeSingle();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const { count: prayerCount } = await supabase
    .from("prayer_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: givingCount } = await supabase
    .from("personal_giving_notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: recentPrayers } = await supabase
    .from("prayer_requests")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

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
          </CardContent>
        </Card>

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
