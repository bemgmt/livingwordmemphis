import type { Metadata } from "next";
import { BookOpen, Handshake, Music, Users } from "lucide-react";

import { GUEST_SMS } from "@/components/marketing/constants";
import { ImageSlider } from "@/components/marketing/image-slider";
import {
  Band,
  ContentSection,
  PageHeroText,
  PageShell,
  ValueCard,
  ValueGrid,
} from "@/components/marketing/marketing-page-sections";

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
        visibility="desktopOnly"
        slides={slides}
        overlay={
          <p className="font-serif text-xl font-medium tracking-wide text-white text-balance drop-shadow-md md:text-2xl lg:text-3xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <PageShell>
        <PageHeroText
          eyebrow="New here"
          title="We can&apos;t wait to meet you!"
          subtitle="You&apos;re not just a visitor — you&apos;re family."
        />
        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground md:mt-12">
          <p>
            From the moment you arrive, you&apos;ll be greeted with warm smiles, a
            welcoming environment, and genuine hearts committed to helping you feel
            right at home. We believe church should be a place of peace, community,
            and divine presence, where everyone belongs.
          </p>
          <p>
            <strong className="text-foreground">Service times:</strong> Join us
            Sundays at 10 AM for powerful worship, relevant teaching, and a place
            to connect. We also offer midweek prayer and discipleship nights to
            continue growing in your walk with God.
          </p>
          <p>
            To make your visit even smoother, text{" "}
            <strong className="text-foreground">GUEST</strong> to{" "}
            <strong className="text-foreground">{GUEST_SMS}</strong> and receive
            personalized help, directions, answers, and updates.
          </p>
          <p>
            Whether this is your first visit or you&apos;re rejoining with new
            excitement, expect to be embraced, encouraged, and empowered—because at
            Living Word Memphis, we live out our mission:{" "}
            <em className="text-foreground">
              Love God. Love People. Live in Dominion.
            </em>
          </p>
        </div>
      </PageShell>

      <Band>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          What to expect during your visit
        </h2>
        <ValueGrid className="mt-10">
          <ValueCard title="Warm greeting" icon={<Handshake />}>
            Our welcome team is ready to assist you in entrance, seating, and
            children&apos;s check-in.
          </ValueCard>
          <ValueCard title="Uncommon worship" icon={<Music />}>
            Spirit-led music that invites God&apos;s presence and connects heaven
            to earth.
          </ValueCard>
          <ValueCard title="Practical teaching" icon={<BookOpen />}>
            Bible-centered messages designed to encourage, equip, and empower
            everyday life.
          </ValueCard>
          <ValueCard title="Community connection" icon={<Users />}>
            A laid-back atmosphere where you can make meaningful friendships and
            find your place.
          </ValueCard>
        </ValueGrid>
      </Band>

      <PageShell>
        <ContentSection title="Join the family">
          <p>
            There&apos;s a seat waiting for you — no dress code, no pressure. As a
            next step, consider:
          </p>
          <ol className="mt-6 list-none space-y-8 pl-0">
            <li className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              <p>
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
              <p>
                <strong className="text-foreground">Join a Life Group</strong> to
                build relationships, grow, and serve others.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </span>
              <p>
                <strong className="text-foreground">Discover ministry</strong> —
                whether you enjoy greeting, music, kids, tech, or hospitality,
                there&apos;s a place for you to shine.
              </p>
            </li>
          </ol>
        </ContentSection>
      </PageShell>
    </main>
  );
}
