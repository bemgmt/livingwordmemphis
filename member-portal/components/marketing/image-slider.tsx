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
}: {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
  overlay?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <section
      className={cn("relative aspect-[21/9] min-h-[220px] w-full overflow-hidden bg-black md:min-h-[320px]", className)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
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
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-4">
          {overlay}
        </div>
      )}
    </section>
  );
}
