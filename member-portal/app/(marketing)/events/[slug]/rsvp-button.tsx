"use client";

import { useTransition, useState } from "react";
import { CalendarCheck, CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toggleRsvp } from "./actions";

interface RsvpButtonProps {
  sanityEventId: string;
  slug: string;
  title: string;
  isRegistered: boolean;
}

export function RsvpButton({
  sanityEventId,
  slug,
  title,
  isRegistered: initialRegistered,
}: RsvpButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(initialRegistered);

  function handleClick() {
    startTransition(async () => {
      const result = await toggleRsvp(sanityEventId, slug, title);
      if (result.ok) {
        setRegistered(result.registered);
      }
    });
  }

  if (registered) {
    return (
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
        className="gap-2"
      >
        <CalendarX className="size-4" aria-hidden />
        {isPending ? "Updating…" : "Cancel Registration"}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isPending} className="gap-2">
      <CalendarCheck className="size-4" aria-hidden />
      {isPending ? "Registering…" : "Register for this Event"}
    </Button>
  );
}
