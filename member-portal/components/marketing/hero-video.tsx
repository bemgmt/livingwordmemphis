"use client";

import Link from "next/link";
import { useState } from "react";

import { YOUTUBE_CHANNEL } from "@/components/marketing/constants";
import { cn } from "@/lib/utils";

/**
 * Hero uses `/videos/church-banner.mp4` when present in `public/videos/`.
 * If the file is missing (common in shallow clones), a dark fallback is shown.
 */
export function HeroVideo() {
  const [videoOk, setVideoOk] = useState(true);

  return (
    <div className="relative aspect-video min-h-[320px] w-full overflow-hidden bg-black md:min-h-[min(85vh,720px)]">
      {videoOk && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        >
          <source src="/videos/church-banner.mp4" type="video/mp4" />
        </video>
      )}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-4 text-center",
          !videoOk && "bg-gradient-to-b from-zinc-900 to-black",
        )}
      >
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
          Welcome to Living Word Memphis
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow">
          Love God. Love People. Live in Dominion.
        </p>
        <Link
          href={YOUTUBE_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
        >
          <span
            className="size-2 animate-pulse rounded-full bg-white"
            aria-hidden
          />
          Watch Now
        </Link>
      </div>
    </div>
  );
}
