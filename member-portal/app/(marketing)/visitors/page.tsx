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
          <p className="font-serif text-xl font-medium text-white drop-shadow md:text-2xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 md:py-16">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          We can&apos;t wait to meet you
        </h1>
        <p className="text-muted-foreground">
          At Living Word Memphis, you&apos;re not just a visitor — you&apos;re
          family. From the moment you arrive, you&apos;ll be greeted with warm
          smiles and a welcoming environment.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Service times:</strong> Join us
          Sundays at 10 AM for worship, teaching, and connection. We also offer
          midweek prayer and discipleship.
        </p>
        <p className="text-muted-foreground">
          Text <strong className="text-foreground">GUEST</strong> to{" "}
          <strong className="text-foreground">{GUEST_SMS}</strong> for
          personalized help, directions, and updates.
        </p>
      </section>

      <section className="border-y border-border bg-muted/40 py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            What to expect during your visit
          </h2>
          <ul className="mt-8 space-y-6 text-muted-foreground">
            <li className="flex gap-4">
              <Handshake className="mt-1 size-6 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Warm greeting:</strong> Our
                welcome team can help with entrance, seating, and
                children&apos;s check-in.
              </span>
            </li>
            <li className="flex gap-4">
              <Music className="mt-1 size-6 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Spirit-led worship:</strong>{" "}
                Music that invites God&apos;s presence.
              </span>
            </li>
            <li className="flex gap-4">
              <BookOpen className="mt-1 size-6 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Practical teaching:</strong>{" "}
                Bible-centered messages to equip everyday life.
              </span>
            </li>
            <li className="flex gap-4">
              <Users className="mt-1 size-6 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Community:</strong> A
                laid-back atmosphere where you can build friendships and find your
                place.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Join the family
        </h2>
        <p className="mt-4 text-muted-foreground">
          There&apos;s a seat waiting for you — no dress code, no pressure. Next
          steps:
        </p>
        <ol className="mt-8 space-y-6">
          <li className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </span>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Visitor reception</strong>{" "}
              after service — meet the pastors and ask questions.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </span>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Join a Life Group</strong> to
              build relationships and grow together.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Discover ministry</strong> —
              greeting, music, kids, tech, hospitality, and more.
            </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
