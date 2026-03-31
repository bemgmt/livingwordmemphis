import type { Metadata } from "next";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

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
        slides={slides}
        overlay={
          <p className="font-serif text-xl font-medium text-white drop-shadow md:text-2xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <section className="relative border-b border-border bg-muted/40 py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Get in touch
            </h1>
            <p className="text-muted-foreground">
              We&apos;d love to hear from you. Whether you have questions,
              prayer requests, or want to learn more about Living Word Memphis,
              we&apos;re here to help.
            </p>
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
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                {CHURCH_ADDRESS}
              </li>
            </ul>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Service times
            </h2>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Sunday worship: 10:00 AM</li>
              <li>Wednesday Bible study: 6:30 PM</li>
              <li>Prayer meeting: Saturdays at 9:00 AM</li>
            </ul>
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
          <ContactForm heading="Send us a message" variant="full" />
        </div>
      </section>
      <MapEmbed />
    </main>
  );
}
