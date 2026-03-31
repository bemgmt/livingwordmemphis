import type { Metadata } from "next";
import { BookOpen, Handshake, Music, Users } from "lucide-react";

import { GUEST_SMS } from "@/components/marketing/constants";
import { ImageSlider } from "@/components/marketing/image-slider";

export const metadata: Metadata = {
  title: "New here?",
  description:
    "Visiting Living Word Memphis? What to expect, service times, and how to connect.",
};

const slides = [
  { src: "/images/AdobeStock_113562790.jpeg", alt: "Welcoming church foyer" },
  { src: "/images/AdobeStock_432501052.jpeg", alt: "Joyful congregation" },
  { src: "/images/AdobeStock_600954263.jpeg", alt: "Friendly welcome team" },
];

export default function VisitorsPage() {
  return (
    <main>
      <ImageSlider
        slides={slides}
        overlay={
          <p className="font-serif text-xl font-medium tracking-wide text-white text-balance drop-shadow-md md:text-2xl lg:text-3xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-14 sm:px-6 md:py-20">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          We can&apos;t wait to meet you!
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          At Living Word Memphis, you&apos;re not just a visitor — you&apos;re
          family. From the moment you arrive, you&apos;ll be greeted with warm
          smiles, a welcoming environment, and genuine hearts committed to helping
          you feel right at home. We believe church should be a place of peace,
          community, and divine presence, where everyone belongs.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Service times:</strong> Join us
          Sundays at 10 AM for powerful worship, relevant teaching, and a place
          to connect. We also offer midweek prayer and discipleship nights to
          continue growing in your walk with God.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          To make your visit even smoother, text{" "}
          <strong className="text-foreground">GUEST</strong> to{" "}
          <strong className="text-foreground">{GUEST_SMS}</strong> and receive
          personalized help, directions, answers, and updates.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Whether this is your first visit or you&apos;re rejoining with new
          excitement, expect to be embraced, encouraged, and empowered—because at
          Living Word Memphis, we live out our mission:{" "}
          <em className="text-foreground">
            Love God. Love People. Live in Dominion.
          </em>
        </p>
      </section>

      <section className="border-y border-border bg-muted/30 py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            What to expect during your visit
          </h2>
          <ul className="mt-10 space-y-8 text-muted-foreground">
            <li className="flex gap-4">
              <Handshake
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-base leading-relaxed">
                <strong className="text-foreground">Warm greeting:</strong> Our
                welcome team is ready to assist you in entrance, seating, and
                children&apos;s check-in.
              </span>
            </li>
            <li className="flex gap-4">
              <Music
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-base leading-relaxed">
                <strong className="text-foreground">Uncommon worship:</strong>{" "}
                Spirit-led music that invites God&apos;s presence and connects
                heaven to earth.
              </span>
            </li>
            <li className="flex gap-4">
              <BookOpen
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-base leading-relaxed">
                <strong className="text-foreground">Practical teaching:</strong>{" "}
                Bible-centered messages designed to encourage, equip, and empower
                everyday life.
              </span>
            </li>
            <li className="flex gap-4">
              <Users
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-base leading-relaxed">
                <strong className="text-foreground">Community connection:</strong>{" "}
                A laid-back atmosphere where you can make meaningful friendships
                and find your place.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Join the family
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          There&apos;s a seat waiting for you — no dress code, no pressure. As a
          next step, consider:
        </p>
        <ol className="mt-10 space-y-8">
          <li className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </span>
            <p className="text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Attend our Visitor Reception
              </strong>{" "}
              after service — meet the pastors and ask questions.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </span>
            <p className="text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Join a Life Group</strong> to
              build relationships, grow, and serve others.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <p className="text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Discover ministry</strong> —
              whether you enjoy greeting, music, kids, tech, or hospitality,
              there&apos;s a place for you to shine.
            </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
