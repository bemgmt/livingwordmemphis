"use client";

import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { GOOGLE_CALENDAR_EMBED } from "@/components/marketing/constants";
import { cn } from "@/lib/utils";

const EVENT_THUMB_SRC = "/images/lwm-black.png";

const events = [
  {
    title: "Community Prayer Night",
    when: "June 21, 2025 – 7:00 PM",
    desc: "Join us for a powerful evening of worship and intercession in the main sanctuary.",
  },
  {
    title: "Family Fun Day",
    when: "July 13, 2025 – 12:00 PM",
    desc: "Food, games, music, and fellowship for all ages after our Sunday service.",
  },
  {
    title: "Kingdom Builders Conference",
    when: "August 3–5, 2025",
    desc: "Three days of transformative teaching and prophetic activation. Registration now open.",
  },
];

export function EventsTabs() {
  const [tab, setTab] = useState<"list" | "calendar">("list");

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

      {tab === "list" && (
        <ul className="mt-8 flex flex-col gap-6">
          {events.map((e) => (
            <li
              key={e.title}
              className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:flex-row"
            >
              <div className="relative h-48 w-full shrink-0 bg-white sm:h-auto sm:w-48">
                <Image
                  src={EVENT_THUMB_SRC}
                  alt="Living Word Memphis"
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-4">
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  {e.title}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" aria-hidden />
                  {e.when}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "calendar" && (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <iframe
            title="Church calendar"
            src={GOOGLE_CALENDAR_EMBED}
            className="aspect-[4/3] min-h-[400px] w-full"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
