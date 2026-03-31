"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Slide = { src: string; alt: string };

export function ImageSlider({
  slides,
  intervalMs = 4000,
  className,
  overlay,
  visibility = "always",
}: {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
  overlay?: React.ReactNode;
  /** `desktopOnly` hides the slider below the `lg` breakpoint (subpage spacing on mobile). */
  visibility?: "always" | "desktopOnly";
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [slides.length, intervalMs, reduceMotion]);

  return (
    <section
      className={cn(
        "relative min-h-[240px] w-full overflow-hidden bg-zinc-950 md:aspect-[21/9] md:min-h-[320px] lg:min-h-[380px]",
        visibility === "desktopOnly" && "hidden lg:block",
        className,
      )}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0",
            reduceMotion
              ? i === index
                ? "opacity-100"
                : "opacity-0"
              : "transition-opacity duration-1000 ease-out",
            !reduceMotion && (i === index ? "opacity-100" : "opacity-0"),
          )}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/30 to-black/40"
        aria-hidden
      />
      {overlay && (
        <div className="absolute inset-0 z-[2] flex items-end justify-center px-4 pb-10 md:items-center md:pb-0 md:pt-0">
          <div className="max-w-4xl text-center">{overlay}</div>
        </div>
      )}
    </section>
  );
}
