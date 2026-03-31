"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

type Panel = {
  id: string;
  href: string;
  title: string;
  tagline: string;
  image: string;
  alt: string;
  external?: boolean;
};

const panels: Panel[] = [
  {
    id: "about",
    href: "/about",
    title: "About",
    tagline: "Our story, mission, and culture.",
    image: "/images/book1.jpeg",
    alt: "Open Bible — learn about Living Word Memphis",
  },
  {
    id: "sermons",
    href: "https://www.youtube.com/@LivingWordMemphis1/streams",
    title: "Sermons",
    tagline: "Watch live and recent messages.",
    image: "/images/book2.jpeg",
    alt: "Worship and teaching — sermon livestream",
    external: true,
  },
  {
    id: "events",
    href: "/events",
    title: "Events",
    tagline: "Gatherings and what’s next.",
    image: "/images/AdobeStock_649448438.jpeg",
    alt: "Church community event gathering",
  },
  {
    id: "visitors",
    href: "/visitors",
    title: "Visitors",
    tagline: "Plan your first visit.",
    image: "/images/AdobeStock_316745004_Preview.jpeg",
    alt: "Welcoming guests at church",
  },
  {
    id: "giving",
    href: "/giving",
    title: "Giving",
    tagline: "Partner with the mission.",
    image: "/images/AdobeStock_557590452.jpeg",
    alt: "Generosity and stewardship",
  },
];

function PanelMedia({
  image,
  alt,
  title,
  tagline,
}: {
  image: string;
  alt: string;
  title: string;
  tagline: string;
}) {
  return (
    <>
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        sizes="(max-width: 767px) 100vw, 20vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-5 pb-8 text-center md:pb-10">
        <h3 className="font-serif text-xl font-semibold tracking-tight text-white drop-shadow md:text-2xl">
          {title}
        </h3>
        <p className="mt-2 max-w-[18ch] text-xs font-medium leading-snug text-white/80 md:max-w-none md:text-sm">
          {tagline}
        </p>
      </div>
    </>
  );
}

function MobileHomePanels() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const go = useCallback((p: Panel) => {
    if (p.external) {
      window.open(p.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(p.href);
    }
  }, [router]);

  const onPanelPointerUp = (p: Panel) => {
    if (expandedId !== p.id) {
      setExpandedId(p.id);
      return;
    }
    go(p);
  };

  const visible = expandedId
    ? panels.filter((p) => p.id === expandedId)
    : panels;

  return (
    <div
      className={cn(
        "flex w-full flex-col md:hidden",
        expandedId && "min-h-[min(70vh,520px)]",
      )}
    >
      {visible.map((p) => {
        const expanded = expandedId === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `${p.title}. Tap again to open, or use collapse control to show all panels.`
                : `${p.title}. Tap to expand preview.`
            }
            className={cn(
              "group relative w-full shrink-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
              expanded ? "min-h-0 flex-1" : "h-[min(26vh,210px)]",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPanelPointerUp(p);
              }
            }}
            onClick={() => onPanelPointerUp(p)}
          >
            {expanded ? (
              <button
                type="button"
                className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/55 p-2.5 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70"
                aria-label="Collapse and show all panels"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(null);
                }}
              >
                <ChevronUp className="size-5" aria-hidden />
              </button>
            ) : null}
            <PanelMedia
              image={p.image}
              alt={p.alt}
              title={p.title}
              tagline={p.tagline}
            />
          </div>
        );
      })}
    </div>
  );
}

export function HomePanels() {
  return (
    <section
      aria-label="Explore Living Word Memphis"
      className="w-full bg-zinc-950"
    >
      <div className="hidden snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] md:flex md:h-[min(70vh,560px)] md:snap-none md:overflow-x-visible md:overflow-y-visible md:flex-row [&::-webkit-scrollbar]:hidden">
        {panels.map((p) => {
          const inner = (
            <PanelMedia
              image={p.image}
              alt={p.alt}
              title={p.title}
              tagline={p.tagline}
            />
          );
          const className =
            "group relative h-[min(52vh,420px)] w-[min(100%,88vw)] shrink-0 snap-center overflow-hidden md:h-auto md:min-h-0 md:w-auto md:flex-1 md:transition-[flex] md:duration-500 md:ease-out md:hover:flex-[2]";

          if (p.external) {
            return (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {inner}
              </a>
            );
          }
          return (
            <Link key={p.id} href={p.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
      <MobileHomePanels />
    </section>
  );
}
