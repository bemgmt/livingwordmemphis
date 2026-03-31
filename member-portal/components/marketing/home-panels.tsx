import Image from "next/image";
import Link from "next/link";

const panels = [
  {
    href: "/about",
    title: "About",
    tagline: "Our story, mission, and culture.",
    image: "/images/book1.jpeg",
    alt: "Open Bible — learn about Living Word Memphis",
  },
  {
    href: "https://www.youtube.com/@LivingWordMemphis1/streams",
    title: "Sermons",
    tagline: "Watch live and recent messages.",
    image: "/images/book2.jpeg",
    alt: "Worship and teaching — sermon livestream",
    external: true,
  },
  {
    href: "/events",
    title: "Events",
    tagline: "Gatherings and what’s next.",
    image: "/images/AdobeStock_649448438.jpeg",
    alt: "Church community event gathering",
  },
  {
    href: "/visitors",
    title: "Visitors",
    tagline: "Plan your first visit.",
    image: "/images/AdobeStock_316745004_Preview.jpeg",
    alt: "Welcoming guests at church",
  },
  {
    href: "/giving",
    title: "Giving",
    tagline: "Partner with the mission.",
    image: "/images/AdobeStock_557590452.jpeg",
    alt: "Generosity and stewardship",
  },
] as const;

export function HomePanels() {
  return (
    <section
      aria-label="Explore Living Word Memphis"
      className="w-full bg-zinc-950"
    >
      {/* Mobile: horizontal snap scroll; md+: cinematic strip */}
      <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] md:snap-none md:h-[min(70vh,560px)] md:overflow-x-visible md:overflow-y-visible md:flex-row [&::-webkit-scrollbar]:hidden">
        {panels.map((p) => {
          const inner = (
            <>
              <Image
                src={p.image}
                alt={p.alt}
                fill
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                sizes="(max-width: 767px) 88vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-5 pb-8 text-center md:pb-10">
                <h3 className="font-serif text-xl font-semibold tracking-tight text-white drop-shadow md:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-2 max-w-[18ch] text-xs font-medium leading-snug text-white/80 md:max-w-none md:text-sm">
                  {p.tagline}
                </p>
              </div>
            </>
          );
          const className =
            "group relative h-[min(52vh,420px)] w-[min(100%,88vw)] shrink-0 snap-center overflow-hidden md:h-auto md:min-h-0 md:w-auto md:flex-1 md:transition-[flex] md:duration-500 md:ease-out md:hover:flex-[2]";

          if ("external" in p && p.external) {
            return (
              <a
                key={p.title}
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
            <Link key={p.title} href={p.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
