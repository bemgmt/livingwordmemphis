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
          <p className="font-serif text-xl font-medium text-white drop-shadow md:text-2xl">
            Love God. Love People. Live in Dominion.
          </p>
        }
      />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          About Living Word Memphis
        </h1>
        <div className="mt-8 space-y-4 text-muted-foreground">
          <p>
            Living Word Memphis is more than a church — it&apos;s a movement.
            Since our founding in 2010, we have been on a bold, Spirit-led
            journey to see lives transformed, families restored, and
            communities revived.
          </p>
          <p>
            Our mission is simple but profound: Love God. Love People. Live in
            Dominion. This isn&apos;t just a motto — it&apos;s the heartbeat of
            our house.
          </p>
          <p>
            Led by Apostle Derek Talbird, Living Word Memphis is rooted in
            biblical truth and ignited by the Holy Spirit. Whether you are new
            to the faith, searching for a deeper relationship with Jesus, or
            looking to be equipped for Kingdom impact — there is a place for you
            here.
          </p>
        </div>
      </section>
      <AboutTabs />
    </main>
  );
}
