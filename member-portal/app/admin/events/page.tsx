import { createClient } from "@/lib/supabase/server";

import { EventsAdmin } from "./events-admin";

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("id, sanity_event_id, sanity_event_slug, sanity_event_title, user_id, created_at")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((rsvps ?? []).map((r) => r.user_id))];

  let profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.display_name ?? "(no name)"]),
    );
  }

  type EventGroup = {
    sanityEventId: string;
    title: string;
    slug: string;
    rsvpCount: number;
    attendees: { userId: string; displayName: string; rsvpDate: string }[];
  };

  const eventMap = new Map<string, EventGroup>();
  for (const rsvp of rsvps ?? []) {
    let group = eventMap.get(rsvp.sanity_event_id);
    if (!group) {
      group = {
        sanityEventId: rsvp.sanity_event_id,
        title: rsvp.sanity_event_title,
        slug: rsvp.sanity_event_slug,
        rsvpCount: 0,
        attendees: [],
      };
      eventMap.set(rsvp.sanity_event_id, group);
    }
    group.rsvpCount++;
    group.attendees.push({
      userId: rsvp.user_id,
      displayName: profileMap[rsvp.user_id] ?? "(no name)",
      rsvpDate: rsvp.created_at,
    });
  }

  const events = Array.from(eventMap.values()).sort(
    (a, b) => b.rsvpCount - a.rsvpCount,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Event RSVPs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track registrations across all events.
        </p>
      </div>
      <EventsAdmin events={events} />
    </div>
  );
}
