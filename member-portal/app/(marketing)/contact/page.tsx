import type { Metadata } from "next";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

import {
  CHURCH_ADDRESS,
  CHURCH_EMAIL,
  CHURCH_PHONE_DISPLAY,
  CHURCH_PHONE_TEL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  YOUTUBE_CHANNEL,
} from "@/components/marketing/constants";
import { ContactForm } from "@/components/marketing/contact-form";
import { ImageSlider } from "@/components/marketing/image-slider";
import {
  PageHeroText,
  ValueCard,
  ValueGrid,
} from "@/components/marketing/marketing-page-sections";
import { MapEmbed } from "@/components/marketing/map-embed";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Living Word Memphis — email, phone, or visit us in Memphis, TN.",
};

const slides = [
  { src: "/images/AdobeStock_113562790.jpeg", alt: "Living Word Memphis" },
  { src: "/images/AdobeStock_432501052.jpeg", alt: "Community gathering" },
  { src: "/images/AdobeStock_600954263.jpeg", alt: "Welcoming community" },
];

export default function ContactPage() {
  return (
    <main>
      <ImageSlider
        visibility="desktopOnly"
        slides={slides}
        overlay={
          <p className="font-serif text-xl font-medium text-white drop-shadow md:text-2xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <section className="relative border-b border-border bg-muted/40 py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <PageHeroText
            className="max-w-3xl"
            eyebrow="Contact"
            title="Get in touch"
            subtitle="We&apos;d love to hear from you — questions, prayer requests, or learning more about Living Word Memphis."
          />
          <ValueGrid className="mt-10 max-w-3xl">
            <ValueCard title="Visit us" icon={<MapPin />}>
              {CHURCH_ADDRESS}
            </ValueCard>
            <ValueCard title="Service times" icon={<Clock />}>
              Sunday worship 10:00 AM · Wednesday Bible study 6:30 PM · Saturday
              prayer 9:00 AM
            </ValueCard>
          </ValueGrid>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Contact information
                </h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                    <a
                      href={`mailto:${CHURCH_EMAIL}`}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {CHURCH_EMAIL}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                    <a
                      href={CHURCH_PHONE_TEL}
                      className="text-foreground hover:text-primary hover:underline"
                    >
                      {CHURCH_PHONE_DISPLAY}
                    </a>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Connect with us
                </h2>
                <div className="flex gap-4">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Facebook"
                  >
                    <Facebook className="size-6" />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Instagram"
                  >
                    <Instagram className="size-6" />
                  </a>
                  <a
                    href={YOUTUBE_CHANNEL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    aria-label="YouTube"
                  >
                    <Youtube className="size-6" />
                  </a>
                </div>
              </div>
            </div>
            <ContactForm heading="Send us a message" variant="full" />
          </div>
        </div>
      </section>
      <MapEmbed />
    </main>
  );
}
