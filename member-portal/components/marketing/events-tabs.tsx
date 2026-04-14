"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import {
  type SanityEvent,
  type EventOccurrence,
  expandRecurringEvents,
  formatEventRange,
} from "@/lib/sanity/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FALLBACK_IMAGE = "/images/lwm-black.png";

interface EventsTabsProps {
  events: SanityEvent[];
}

export function EventsTabs({ events }: EventsTabsProps) {
  const [tab, setTab] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const now = new Date();

  const upcomingOccurrences = useMemo(() => {
    const sixMonthsOut = new Date(now);
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
    return expandRecurringEvents(events, now, sixMonthsOut);
  }, [events]);

  const calendarOccurrences = useMemo(() => {
    const start = new Date(calMonth);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
    end.setDate(end.getDate() + (6 - end.getDay()));
    end.setHours(23, 59, 59);
    return expandRecurringEvents(events, start, end);
  }, [events, calMonth]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "list"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-secondary",
          )}
        >
          Upcoming Events
        </button>
        <button
          type="button"
          onClick={() => setTab("calendar")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "calendar"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-secondary",
          )}
        >
          Calendar View
        </button>
      </div>

      {tab === "list" && <EventList occurrences={upcomingOccurrences} />}
      {tab === "calendar" && (
        <EventCalendar
          month={calMonth}
          onMonthChange={setCalMonth}
          occurrences={calendarOccurrences}
        />
      )}
    </div>
  );
}

function EventList({ occurrences }: { occurrences: EventOccurrence[] }) {
  if (occurrences.length === 0) {
    return (
      <div className="mt-12 text-center">
        <CalendarDays className="mx-auto size-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">
          No upcoming events right now. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-6">
      {occurrences.map((occ, i) => (
        <li
          key={`${occ._id}-${occ.occurrenceDate.toISOString()}`}
          className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:flex-row"
        >
          <div className="relative h-48 w-full shrink-0 bg-white sm:h-auto sm:w-48">
            <Image
              src={occ.imageUrl || FALLBACK_IMAGE}
              alt={occ.title}
              fill
              className={cn(
                "object-cover",
                !occ.imageUrl && "object-contain p-6",
              )}
              sizes="(max-width: 640px) 100vw, 192px"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              <Link
                href={`/events/${occ.slug}`}
                className="hover:text-primary hover:underline"
              >
                {occ.title}
              </Link>
            </h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {formatEventRange(occ.occurrenceDate, occ.occurrenceEndDate)}
            </p>
            {occ.isRecurring && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="size-3 shrink-0" aria-hidden />
                Recurring event
              </p>
            )}
            {occ.location && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {occ.location}
              </p>
            )}
            {occ.summary && (
              <p className="mt-1 text-sm text-muted-foreground">
                {occ.summary}
              </p>
            )}
            {occ.registrationUrl && (
              <a
                href={occ.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Register / More Info
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function EventCalendar({
  month,
  onMonthChange,
  occurrences,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  occurrences: EventOccurrence[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>();
    for (const occ of occurrences) {
      const key = occ.occurrenceDate.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(occ);
      map.set(key, arr);
    }
    return map;
  }, [occurrences]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayKey =
    today.getFullYear() === month.getFullYear() &&
    today.getMonth() === month.getMonth()
      ? today.getDate()
      : null;

  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between rounded-t-xl border border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-x border-border bg-muted/30">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="border-b border-border py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-x border-b border-border rounded-b-xl overflow-hidden bg-card">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[4.5rem] border-b border-r border-border bg-muted/20 last:border-r-0"
              />
            );
          }

          const dateKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate.get(dateKey);
          const hasEvents = dayEvents && dayEvents.length > 0;
          const isToday = day === todayKey;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              type="button"
              key={dateKey}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={cn(
                "relative min-h-[4.5rem] border-b border-r border-border p-1.5 text-left transition-colors",
                "hover:bg-secondary/50",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary",
                "[&:nth-child(7n)]:border-r-0",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm",
                  isToday &&
                    "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {day}
              </span>
              {hasEvents && (
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={`${ev._id}-${i}`}
                      className="block h-1.5 w-1.5 rounded-full bg-primary"
                      title={ev.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] leading-none text-muted-foreground">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedEvents && selectedEvents.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h4>
          <ul className="mt-3 space-y-3">
            {selectedEvents.map((ev, i) => (
              <li
                key={`${ev._id}-${i}`}
                className="flex items-start gap-3 text-sm"
              >
                <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="font-medium text-foreground">{ev.title}</p>
                  <p className="text-muted-foreground">
                    {formatEventRange(ev.occurrenceDate, ev.occurrenceEndDate)}
                  </p>
                  {ev.location && (
                    <p className="text-muted-foreground">{ev.location}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
