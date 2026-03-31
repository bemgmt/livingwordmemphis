import type { Metadata } from "next";

import { AboutTabs } from "@/components/marketing/about-tabs";
import { ImageSlider } from "@/components/marketing/image-slider";
import {
  ContentSection,
  PageHeroText,
  PageShell,
  ValueCard,
  ValueGrid,
} from "@/components/marketing/marketing-page-sections";

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
          eyebrow="About us"
          title="About Living Word Memphis"
          subtitle="Love God. Love People. Live in Dominion."
        />
        <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
          <ContentSection title="Who we are">
            <p>
              Living Word Memphis is more than a church — it&apos;s a movement.
              Since our founding in 2010, we have been on a bold, Spirit-led
              journey to see lives transformed, families restored, and communities
              revived. We exist to glorify God and to demonstrate His Kingdom here
              on earth through tangible expressions of faith, love, and power.
            </p>
          </ContentSection>

          <ContentSection title="Our mission">
            <p>
              Our mission is simple but profound: Love God. Love People. Live in
              Dominion. This isn&apos;t just a motto — it&apos;s the heartbeat of
              our house. From powerful Sunday worship to vibrant midweek
              encounters, from grassroots outreach to global vision, everything
              we do flows from this call to live with spiritual authority,
              compassion, and purpose.
            </p>
          </ContentSection>

          <div className="space-y-8">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              What we&apos;re built on
            </h2>
            <ValueGrid>
              <ValueCard title="Spirit-led">
                Led by Apostle Derek Talbird, we are rooted in biblical truth and
                ignited by the Holy Spirit — a prophetic, apostolic church where
                miracles, healing, deliverance, and dynamic teaching create an
                atmosphere of breakthrough.
              </ValueCard>
              <ValueCard title="Biblical truth">
                Whether you are new to the faith, searching for a deeper
                relationship with Jesus, or looking to be equipped for Kingdom
                impact — there is a place for you here.
              </ValueCard>
              <ValueCard title="Community">
                Church is not just a place to attend, but a people to belong to.
                You&apos;ll find a culture of honor, a community of faith, and a
                commitment to discipleship.
              </ValueCard>
              <ValueCard title="Kingdom impact">
                Join us as we build strong families, raise up Kingdom leaders, and
                carry revival to Memphis and beyond.
              </ValueCard>
            </ValueGrid>
          </div>
        </div>
      </PageShell>
      <AboutTabs />
    </main>
  );
}
