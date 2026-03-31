import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/marketing/contact-form";
import {
  CHURCH_ADDRESS,
  CHURCH_EMAIL,
} from "@/components/marketing/constants";
import { HeroVideo } from "@/components/marketing/hero-video";
import { HomePanels } from "@/components/marketing/home-panels";
import { MapEmbed } from "@/components/marketing/map-embed";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Living Word Memphis — Love God. Love People. Live in Dominion. Join us in Memphis, TN.",
};

export default function HomePage() {
  return (
    <>
      <HeroVideo />
      <HomePanels />

      <section className="relative border-y border-border bg-muted/50 py-14 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6 text-foreground">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              About Living Word Memphis
            </h2>
            <p className="text-muted-foreground">
              Living Word Memphis is a place of worship, community, and
              spiritual growth in the heart of Memphis, TN. We welcome all who
              seek to encounter God, grow in faith, and serve others with love.
            </p>
            <p className="text-muted-foreground">
              Join us for our weekly services, events, and outreach programs.
              There&apos;s a place for you here.
            </p>
            <h3 className="font-serif text-xl font-semibold">Service times</h3>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Sunday worship:</strong>{" "}
                10:00 AM
              </li>
              <li>
                <strong className="text-foreground">Wednesday Bible study:</strong>{" "}
                6:30 PM
              </li>
              <li>
                <strong className="text-foreground">Prayer meeting:</strong>{" "}
                Saturdays at 9:00 AM
              </li>
            </ul>
            <h3 className="font-serif text-xl font-semibold">Location</h3>
            <p className="text-muted-foreground">{CHURCH_ADDRESS}</p>
            <h3 className="font-serif text-xl font-semibold">Contact</h3>
            <p className="text-muted-foreground">
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`mailto:${CHURCH_EMAIL}`}
              >
                {CHURCH_EMAIL}
              </a>
            </p>
            <Link
              href="/about"
              className="inline-flex text-sm font-medium text-primary hover:underline"
            >
              Learn more about us →
            </Link>
          </div>
          <ContactForm heading="Contact us" variant="compact" />
        </div>
      </section>

      <MapEmbed />
    </>
  );
}
