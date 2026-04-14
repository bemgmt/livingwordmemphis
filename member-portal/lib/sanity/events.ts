export interface SanityEvent {
  _id: string;
  title: string;
  slug: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  summary: string | null;
  registrationUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  isRecurring: boolean;
  recurrenceRule: string | null;
  recurrenceEndDate: string | null;
}

export interface SanityEventDetail extends SanityEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any[] | null;
  seo: { title: string | null; description: string | null } | null;
}

export const SINGLE_EVENT_QUERY = `
  *[_type == "churchEvent" && slug.current == $slug][0] {
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
    recurrenceEndDate,
    details,
    seo
  }
`;

export interface EventOccurrence extends SanityEvent {
  occurrenceDate: Date;
  occurrenceEndDate: Date | null;
}

const DAY_INDEX: Record<string, number> = {
  "weekly-sunday": 0,
  "weekly-monday": 1,
  "weekly-tuesday": 2,
  "weekly-wednesday": 3,
  "weekly-thursday": 4,
  "weekly-friday": 5,
  "weekly-saturday": 6,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDuration(start: string, end: string | null): number {
  if (!end) return 0;
  return new Date(end).getTime() - new Date(start).getTime();
}

/**
 * Expand recurring events into individual occurrences within a date range.
 * Non-recurring events are passed through if they fall in range.
 */
export function expandRecurringEvents(
  events: SanityEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];

  for (const event of events) {
    const eventStart = new Date(event.startAt);
    const durationMs = getDuration(event.startAt, event.endAt);

    if (!event.isRecurring || !event.recurrenceRule) {
      if (eventStart >= rangeStart && eventStart <= rangeEnd) {
        occurrences.push({
          ...event,
          occurrenceDate: eventStart,
          occurrenceEndDate: event.endAt ? new Date(event.endAt) : null,
        });
      }
      continue;
    }

    const recEnd = event.recurrenceEndDate
      ? new Date(event.recurrenceEndDate + "T23:59:59")
      : rangeEnd;
    const effectiveEnd = recEnd < rangeEnd ? recEnd : rangeEnd;
    const rule = event.recurrenceRule;

    if (rule.startsWith("weekly-")) {
      const targetDay = DAY_INDEX[rule];
      if (targetDay === undefined) continue;

      let cursor = new Date(rangeStart);
      const currentDay = cursor.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7;
      cursor = addDays(cursor, daysUntil);

      const time = eventStart.getHours() * 60 + eventStart.getMinutes();

      while (cursor <= effectiveEnd) {
        const occDate = new Date(cursor);
        occDate.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0);

        if (occDate >= rangeStart) {
          occurrences.push({
            ...event,
            occurrenceDate: occDate,
            occurrenceEndDate: durationMs
              ? new Date(occDate.getTime() + durationMs)
              : null,
          });
        }
        cursor = addDays(cursor, 7);
      }
    } else if (rule === "biweekly") {
      let cursor = new Date(eventStart);
      while (cursor <= effectiveEnd) {
        if (cursor >= rangeStart) {
          occurrences.push({
            ...event,
            occurrenceDate: new Date(cursor),
            occurrenceEndDate: durationMs
              ? new Date(cursor.getTime() + durationMs)
              : null,
          });
        }
        cursor = addDays(cursor, 14);
      }
    } else if (rule === "monthly") {
      let cursor = new Date(eventStart);
      while (cursor <= effectiveEnd) {
        if (cursor >= rangeStart) {
          occurrences.push({
            ...event,
            occurrenceDate: new Date(cursor),
            occurrenceEndDate: durationMs
              ? new Date(cursor.getTime() + durationMs)
              : null,
          });
        }
        cursor = addMonths(cursor, 1);
      }
    }
  }

  occurrences.sort(
    (a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime(),
  );

  return occurrences;
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventRange(start: Date, end: Date | null): string {
  const datePart = formatEventDate(start);
  const timePart = formatEventTime(start);
  if (!end) return `${datePart} at ${timePart}`;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${datePart}, ${timePart} – ${formatEventTime(end)}`;
  }
  return `${datePart} – ${formatEventDate(end)}`;
}
