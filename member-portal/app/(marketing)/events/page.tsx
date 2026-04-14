import type { Metadata } from "next";

import { EventsTabs } from "@/components/marketing/events-tabs";
import { sanityFetch } from "@/lib/sanity/client";
import type { SanityEvent } from "@/lib/sanity/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events and church calendar — Living Word Memphis.",
};

const EVENTS_QUERY = `
  *[_type == "churchEvent"] | order(startAt asc) {
    _id,
    title,
    "slug": slug.current,
    startAt,
    endAt,
    location,
    summary,
    registrationUrl,
    "imageUrl": image.asset->url,
    featured,
    isRecurring,
    recurrenceRule,
    recurrenceEndDate
  }
`;

export default async function EventsPage() {
  const events = await sanityFetch<SanityEvent[]>(EVENTS_QUERY, {}, 60);

  return (
    <main className="bg-background">
      <div className="border-b border-border bg-muted/30 px-4 py-10 md:py-14">
        <h1 className="mx-auto max-w-4xl font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Events
        </h1>
        <p className="mx-auto mt-3 max-w-4xl text-muted-foreground">
          Stay connected with what&apos;s happening at Living Word Memphis.
        </p>
      </div>
      <EventsTabs events={events} />
    </main>
  );
}
