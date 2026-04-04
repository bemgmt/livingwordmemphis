import { createClient } from "@/lib/supabase/server";

import { PrayerAdmin } from "./prayer-admin";

export default async function AdminPrayerPage() {
  const supabase = await createClient();

  const { data: prayers } = await supabase
    .from("prayer_requests")
    .select("id, user_id, title, body, visibility, is_anonymous_to_team, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Prayer requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all prayer requests submitted by members.
        </p>
      </div>
      <PrayerAdmin prayers={prayers ?? []} />
    </div>
  );
}
