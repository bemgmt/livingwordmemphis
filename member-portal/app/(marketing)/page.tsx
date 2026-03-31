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

      <section className="relative border-y border-border bg-muted/40 py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-8 text-foreground">
            <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              About Living Word Memphis
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Living Word Memphis is a place of worship, community, and
                spiritual growth in the heart of Memphis, TN. We welcome all who
                seek to encounter God, grow in faith, and serve others with love.
              </p>
              <p>
                Join us for our weekly services, events, and outreach programs.
                There&apos;s a place for you here.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-tight">
                Service times
              </h3>
              <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex flex-col gap-0.5 border-b border-border/80 pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <dt className="font-medium text-foreground">Sunday worship</dt>
                  <dd>10:00 AM</dd>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-border/80 pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <dt className="font-medium text-foreground">
                    Wednesday Bible study
                  </dt>
                  <dd>6:30 PM</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <dt className="font-medium text-foreground">Prayer meeting</dt>
                  <dd>Saturdays at 9:00 AM</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-tight">
                Location
              </h3>
              <p className="mt-2 text-muted-foreground">{CHURCH_ADDRESS}</p>
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-tight">
                Contact
              </h3>
              <p className="mt-2 text-muted-foreground">
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={`mailto:${CHURCH_EMAIL}`}
                >
                  {CHURCH_EMAIL}
                </a>
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
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
