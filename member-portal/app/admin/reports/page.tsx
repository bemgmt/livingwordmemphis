import { createClient } from "@/lib/supabase/server";

import { ReportsAdmin } from "./reports-admin";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("content_reports")
    .select("id, content_type, content_id, reason, status, created_at, reporter_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const reporterIds = [
    ...new Set((reports ?? []).map((r) => r.reporter_id)),
  ];

  const { data: profiles } = reporterIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", reporterIds)
    : { data: [] };

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  const mapped = (reports ?? []).map((r) => ({
    id: r.id,
    content_type: r.content_type,
    content_id: r.content_id,
    reason: r.reason,
    status: r.status,
    created_at: r.created_at,
    reporter_name: nameMap.get(r.reporter_id) ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Content reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and act on reported content from the bulletin and forum.
        </p>
      </div>
      <ReportsAdmin reports={mapped} />
    </div>
  );
}
