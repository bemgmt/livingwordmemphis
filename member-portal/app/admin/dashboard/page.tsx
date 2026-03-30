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
        <h1 className="text-2xl font-semibold text-zinc-900">Admin dashboard</h1>
        <p className="mt-1 text-zinc-600">
          Operational snapshot. Expand with announcements queue, analytics, and
          giving summaries per roadmap.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Prayer requests
        </h2>
        <p className="mt-2 text-3xl font-semibold text-zinc-900">
          {prayerCount ?? "—"}
        </p>
        <p className="text-xs text-zinc-500">Total rows visible to your role</p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Recent
        </h2>
        <ul className="mt-4 divide-y divide-zinc-100 text-sm">
          {(recentPrayers ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 py-3">
              <span className="text-zinc-500">
                {p.created_at
                  ? new Date(p.created_at).toLocaleString()
                  : "—"}
              </span>
              <span className="font-medium text-zinc-800">
                {p.title || "(no title)"}
              </span>
              <span className="text-zinc-500">{p.visibility}</span>
            </li>
          ))}
          {!recentPrayers?.length && (
            <li className="py-4 text-zinc-500">No requests yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
