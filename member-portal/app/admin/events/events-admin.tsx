"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Attendee = {
  userId: string;
  displayName: string;
  rsvpDate: string;
};

type EventGroup = {
  sanityEventId: string;
  title: string;
  slug: string;
  rsvpCount: number;
  attendees: Attendee[];
};

interface Props {
  events: EventGroup[];
}

export function EventsAdmin({ events }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const totalRsvps = events.reduce((sum, e) => sum + e.rsvpCount, 0);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <CalendarCheck className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {totalRsvps}
            </p>
            <p className="text-xs text-muted-foreground">Total RSVPs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {events.length}
            </p>
            <p className="text-xs text-muted-foreground">Events with RSVPs</p>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No RSVPs yet. Registrations will appear here once members sign up for
          events.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const isOpen = expanded.has(event.sanityEventId);
            return (
              <Card key={event.sanityEventId}>
                <CardHeader className="pb-2">
                  <button
                    type="button"
                    onClick={() => toggle(event.sanityEventId)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base font-medium">
                        {event.title}
                      </CardTitle>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {event.rsvpCount}{" "}
                      {event.rsvpCount === 1 ? "RSVP" : "RSVPs"}
                    </span>
                  </button>
                </CardHeader>
                {isOpen && (
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View event page
                        <ExternalLink className="size-3" aria-hidden />
                      </Link>
                    </div>
                    <div className="rounded-md border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Attendee
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Registered
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.attendees.map((a) => (
                            <tr
                              key={a.userId}
                              className="border-b border-border last:border-b-0"
                            >
                              <td className="px-3 py-2 text-foreground">
                                {a.displayName}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {new Date(a.rsvpDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
