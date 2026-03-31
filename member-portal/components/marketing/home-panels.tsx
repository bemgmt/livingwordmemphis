import Image from "next/image";
import Link from "next/link";

const panels = [
  { href: "/about", title: "About", image: "/images/book1.jpeg" },
  {
    href: "https://www.youtube.com/@LivingWordMemphis1/streams",
    title: "Sermons",
    image: "/images/book2.jpeg",
    external: true,
  },
  { href: "/events", title: "Events", image: "/images/AdobeStock_649448438.jpeg" },
  {
    href: "/visitors",
    title: "Visitors",
    image: "/images/AdobeStock_316745004_Preview.jpeg",
  },
  { href: "/giving", title: "Giving", image: "/images/AdobeStock_557590452.jpeg" },
] as const;

export function HomePanels() {
  return (
    <section className="flex min-h-[280px] w-full flex-col md:h-[min(70vh,560px)] md:flex-row">
      {panels.map((p) => {
        const inner = (
          <>
            <Image
              src={p.image}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 20vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-center p-4 pb-8">
              <h3 className="font-serif text-xl font-semibold text-white drop-shadow md:text-2xl">
                {p.title}
              </h3>
            </div>
          </>
        );
        const className =
          "group relative min-h-[140px] flex-1 overflow-hidden transition-[flex] duration-500 ease-out md:min-h-0 md:hover:flex-[2]";

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
    </section>
  );
}
