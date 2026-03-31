import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: prayerCount } = await supabase
    .from("prayer_requests")
    .select("*", { count: "exact", head: true });

  const { data: recentPrayers } = await supabase
    .from("prayer_requests")
    .select("id, created_at, visibility, title")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational snapshot. Expand with announcements queue, analytics, and
          giving summaries per roadmap.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Prayer requests
          </CardTitle>
          <CardDescription>Total rows visible to your role</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {prayerCount ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent
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
