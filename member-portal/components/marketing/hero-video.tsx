"use client";

import Link from "next/link";
import { useState } from "react";

import { YOUTUBE_CHANNEL } from "@/components/marketing/constants";
import { cn } from "@/lib/utils";

/**
 * Hero video: 16:9 landscape from `md` up (`/videos/lwm-hero-landscape.mp4`),
 * 9:16 vertical below `md` (`/videos/lwm-hero-vertical.mp4`) in `public/videos/`.
 * If a file fails to load, that breakpoint falls back to the dark gradient.
 */
export function HeroVideo() {
  const [landscapeOk, setLandscapeOk] = useState(true);
  const [verticalOk, setVerticalOk] = useState(true);
  const videoBaseClass =
    "absolute inset-0 h-full w-full object-cover motion-safe:scale-[1.01]";

  return (
    <div className="relative isolate flex min-h-[max(280px,min(88dvh,920px))] w-full flex-col overflow-hidden bg-zinc-950 sm:min-h-[max(320px,min(100dvh,920px))]">
      {landscapeOk && (
        <video
          className={cn(videoBaseClass, "hidden md:block")}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setLandscapeOk(false)}
          aria-hidden
        >
          <source src="/videos/lwm-hero-landscape.mp4" type="video/mp4" />
        </video>
      )}
      {verticalOk && (
        <video
          className={cn(videoBaseClass, "md:hidden")}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVerticalOk(false)}
          aria-hidden
        >
          <source src="/videos/lwm-hero-vertical.mp4" type="video/mp4" />
        </video>
      )}
      {/* Cinematic gradient: readable type + depth (Tesla-style lower third) */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[1]",
          "bg-gradient-to-b from-black/50 via-black/25 to-black/85",
          !verticalOk && "max-md:from-zinc-900 max-md:via-zinc-950 max-md:to-black",
          !landscapeOk && "md:from-zinc-900 md:via-zinc-950 md:to-black",
        )}
        aria-hidden
      />
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col justify-end px-5 pb-10 pt-28 text-center sm:px-8 md:pb-16 md:pt-36">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white text-balance drop-shadow-sm sm:text-5xl md:text-6xl md:tracking-tighter">
            Welcome to Living Word Memphis
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed tracking-wide text-white/95 text-balance drop-shadow-sm md:text-xl">
            Love God. Love People. Live in Dominion.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <span
                className="size-2 rounded-full bg-white motion-safe:animate-pulse"
                aria-hidden
              />
              Watch Now
            </Link>
            <Link
              href="/visitors"
              className="text-sm font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition hover:text-white hover:decoration-white"
            >
              Plan a visit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
