import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { PortableText } from "@portabletext/react";

import { Button } from "@/components/ui/button";
import { sanityFetch } from "@/lib/sanity/client";
import {
  type SanityEventDetail,
  SINGLE_EVENT_QUERY,
  formatEventRange,
} from "@/lib/sanity/events";
import { getSession } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";

import { RsvpButton } from "./rsvp-button";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await sanityFetch<SanityEventDetail | null>(
    SINGLE_EVENT_QUERY,
    { slug },
    60,
  );

  if (!event) return { title: "Event Not Found" };

  const title = event.seo?.title ?? event.title;
  const description =
    event.seo?.description ?? event.summary ?? `${event.title} at Living Word Memphis.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(event.imageUrl ? { images: [{ url: event.imageUrl }] } : {}),
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await sanityFetch<SanityEventDetail | null>(
    SINGLE_EVENT_QUERY,
    { slug },
    60,
  );

  if (!event) notFound();

  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;

  const { user } = await getSession();

  let isRegistered = false;
  let rsvpCount = 0;

  if (user) {
    const supabase = await createClient();
    const [{ data: rsvp }, { count }] = await Promise.all([
      supabase
        .from("event_rsvps")
        .select("id")
        .eq("sanity_event_id", event._id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("sanity_event_id", event._id),
    ]);
    isRegistered = !!rsvp;
    rsvpCount = count ?? 0;
  }

  return (
    <main className="bg-background">
      <div className="border-b border-border bg-muted/30 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All Events
          </Link>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
            <span className="flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {formatEventRange(startDate, endDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {event.location}
              </span>
            )}
            {event.isRecurring && (
              <span className="flex items-center gap-1.5 text-xs">
                <RefreshCw className="size-3 shrink-0" aria-hidden />
                Recurring event
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {event.imageUrl && (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {event.summary && (
          <p className="mb-6 text-lg text-muted-foreground">{event.summary}</p>
        )}

        {event.details && event.details.length > 0 && (
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <PortableText value={event.details} />
          </div>
        )}

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Register for this Event
          </h2>
          {user ? (
            <div className="mt-4 space-y-3">
              <RsvpButton
                sanityEventId={event._id}
                slug={event.slug}
                title={event.title}
                isRegistered={isRegistered}
              />
              {rsvpCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rsvpCount} {rsvpCount === 1 ? "person has" : "people have"} registered.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to register for this event.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/auth/login?next=/events/${event.slug}`}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/auth/signup?next=/events/${event.slug}`}>
                    Create Account
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
