import type { Metadata } from "next";

import { AboutTabs } from "@/components/marketing/about-tabs";
import { ImageSlider } from "@/components/marketing/image-slider";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Living Word Memphis: mission, culture, beliefs, and leadership.",
};

const slides = [
  { src: "/images/AdobeStock_432501052.jpeg", alt: "Living Word Memphis" },
  { src: "/images/AdobeStock_548441101.jpeg", alt: "Community outreach" },
  { src: "/images/AdobeStock_521075212.jpeg", alt: "Church gathering" },
];

export default function AboutPage() {
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
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          About Living Word Memphis
        </h1>
        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            Living Word Memphis is more than a church — it&apos;s a movement.
            Since our founding in 2010, we have been on a bold, Spirit-led
            journey to see lives transformed, families restored, and communities
            revived. We exist to glorify God and to demonstrate His Kingdom here
            on earth through tangible expressions of faith, love, and power.
          </p>
          <p>
            Our mission is simple but profound: Love God. Love People. Live in
            Dominion. This isn&apos;t just a motto — it&apos;s the heartbeat of
            our house. From powerful Sunday worship to vibrant midweek
            encounters, from grassroots outreach to global vision, everything
            we do flows from this call to live with spiritual authority,
            compassion, and purpose.
          </p>
          <p>
            Led by Apostle Derek Talbird, Living Word Memphis is rooted in
            biblical truth and ignited by the Holy Spirit. We are a prophetic,
            apostolic church where miracles, healing, deliverance, and dynamic
            teaching come together to create an atmosphere of breakthrough.
            Whether you are new to the faith, searching for a deeper relationship
            with Jesus, or looking to be equipped for Kingdom impact — there is a
            place for you here.
          </p>
          <p>
            We believe that church is not just a place to attend, but a people
            to belong to. At Living Word Memphis, you&apos;ll find a culture of
            honor, a community of faith, and a commitment to discipleship. Join
            us as we build strong families, raise up Kingdom leaders, and carry
            revival to Memphis and beyond.
          </p>
        </div>
      </section>
      <AboutTabs />
    </main>
  );
}
