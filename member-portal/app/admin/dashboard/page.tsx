import Link from "next/link";
import {
  Users,
  Heart,
  MessageSquare,
  MessagesSquare,
  FolderOpen,
  DollarSign,
  CalendarCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { MemberGrowthChart, GivingChart } from "@/components/admin/analytics-chart";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { RoleGate } from "@/components/admin/executive-only";
import { getUserAdminRole, meetsMinRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function buildMonthlyBuckets(
  rows: { created_at: string }[],
  months: number,
): { month: string; count: number }[] {
  const now = new Date();
  const buckets: Map<string, number> = new Map();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthLabel(d), 0);
  }

  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = monthLabel(d);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets, ([month, count]) => ({ month, count }));
}

function buildGivingBuckets(
  rows: { note_created_at: string; amount_usd: number }[],
  months: number,
): { month: string; count: number }[] {
  const now = new Date();
  const buckets: Map<string, number> = new Map();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthLabel(d), 0);
  }

  for (const row of rows) {
    const d = new Date(row.note_created_at);
    const key = monthLabel(d);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(row.amount_usd));
    }
  }

  return Array.from(buckets, ([month, count]) => ({ month, count }));
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user ? await getUserAdminRole(supabase, user.id) : null;
  const isExecutive = meetsMinRole(role, "executive");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const thisMonthISO = thisMonth.toISOString();

  const [
    { count: memberCount },
    { count: newMembersThisMonth },
    { count: prayerCount },
    { count: bulletinCount },
    { count: forumTopicCount },
    { count: pendingRequestCount },
    { count: reportCount },
    { count: rsvpCount },
    { data: recentPrayers },
    { data: recentBulletin },
    { data: recentForum },
    { data: memberGrowthRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthISO),
    supabase
      .from("prayer_requests")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("bulletin_posts")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("forum_topics")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("group_join_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("content_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("prayer_requests")
      .select("id, created_at, title")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bulletin_posts")
      .select("id, created_at, title")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("forum_topics")
      .select("id, created_at, title")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgoISO)
      .order("created_at", { ascending: true }),
  ]);

  let givingRows: { note_created_at: string; amount_usd: number }[] = [];
  let givingTotal: number | null = null;
  if (isExecutive) {
    const { data } = await supabase
      .from("personal_giving_notes")
      .select("note_created_at, amount_usd")
      .gte("note_created_at", sixMonthsAgoISO)
      .order("note_created_at", { ascending: true });
    givingRows = (data ?? []).map((r) => ({
      note_created_at: r.note_created_at,
      amount_usd: Number(r.amount_usd),
    }));
    givingTotal = givingRows.reduce((sum, r) => sum + r.amount_usd, 0);
  }

  const memberGrowthData = buildMonthlyBuckets(memberGrowthRows ?? [], 6);
  const givingChartData = buildGivingBuckets(givingRows, 6);

  const activityItems = [
    ...(recentPrayers ?? []).map((p) => ({
      id: p.id,
      type: "prayer" as const,
      title: p.title,
      created_at: p.created_at,
    })),
    ...(recentBulletin ?? []).map((b) => ({
      id: b.id,
      type: "bulletin" as const,
      title: b.title,
      created_at: b.created_at,
    })),
    ...(recentForum ?? []).map((f) => ({
      id: f.id,
      type: "forum" as const,
      title: f.title,
      created_at: f.created_at,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ).slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational overview of the Living Word Memphis portal.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total members"
          value={memberCount}
          href="/admin/members"
          icon={Users}
          trend={{
            value: newMembersThisMonth ?? 0,
            label: "this month",
          }}
        />
        <StatCard
          label="Prayer requests"
          value={prayerCount}
          href="/admin/prayer"
          icon={Heart}
        />
        <StatCard
          label="Bulletin posts"
          value={bulletinCount}
          href="/admin/bulletin"
          icon={MessageSquare}
        />
        <StatCard
          label="Forum topics"
          value={forumTopicCount}
          href="/admin/forum"
          icon={MessagesSquare}
        />
        <StatCard
          label="Pending join requests"
          value={pendingRequestCount}
          href="/admin/groups"
          icon={FolderOpen}
        />
        <StatCard
          label="Open reports"
          value={reportCount}
          href="/admin/reports"
          icon={MessageSquare}
        />
        <StatCard
          label="Event RSVPs"
          value={rsvpCount}
          href="/admin/events"
          icon={CalendarCheck}
        />
        <RoleGate minRole="executive">
          <StatCard
            label="Reported giving (6mo)"
            value={givingTotal !== null ? Math.round(givingTotal) : null}
            icon={DollarSign}
          />
        </RoleGate>
      </div>

      {/* Charts -- Executive+ only */}
      <RoleGate minRole="executive">
        <div className="grid gap-6 lg:grid-cols-2">
          <MemberGrowthChart data={memberGrowthData} />
          <GivingChart data={givingChartData} />
        </div>
      </RoleGate>

      {/* Content studio shortcut */}
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

      {/* Recent activity */}
      <ActivityFeed items={activityItems} />
    </div>
  );
}
