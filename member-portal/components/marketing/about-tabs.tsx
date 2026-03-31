"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "culture", label: "Our Culture" },
  { id: "beliefs", label: "Our Beliefs" },
  { id: "leadership", label: "Senior Leadership" },
] as const;

export function AboutTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("culture");

  return (
    <section className="border-t border-border bg-muted/30 py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          className="flex flex-wrap gap-2 border-b border-border/80 pb-5"
          role="tablist"
          aria-label="About sections"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                active === t.id
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground ring-1 ring-border hover:bg-secondary hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {active === "culture" && (
            <div
              id="panel-culture"
              role="tabpanel"
              aria-labelledby="tab-culture"
              className="space-y-5 text-base leading-relaxed text-muted-foreground"
            >
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Our Culture
              </h3>
              <p>
                The culture of Living Word Memphis is one of radical faith,
                authentic love, and unshakable Kingdom identity. We are a
                multi-generational, multi-ethnic church family united by a passion
                for God&apos;s presence and a commitment to living out the Word
                of God in our daily lives. Our worship is alive, our fellowship is
                intentional, and our environment is charged with expectation for
                the miraculous.
              </p>
              <p>
                We believe in cultivating a culture of honor, where every person
                is seen, known, and empowered to walk in their God-given purpose.
                Whether you&apos;re attending a Sunday service, joining a ministry
                team, or participating in one of our city-wide outreach efforts,
                you&apos;ll encounter a spiritual family that embraces you fully
                and challenges you to grow.
              </p>
              <p>
                This is your safe place where faith comes alive, destinies are
                unlocked, and Memphis is impacted by the transformative power of
                Jesus Christ.
              </p>
            </div>
          )}
          {active === "beliefs" && (
            <div
              id="panel-beliefs"
              role="tabpanel"
              aria-labelledby="tab-beliefs"
              className="space-y-5 text-base leading-relaxed text-muted-foreground"
            >
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Our Beliefs
              </h3>
              <p>
                Living Word Memphis is built upon the unshakable foundation of
                the Bible — God&apos;s living, authoritative Word. We believe in
                one God, eternally existent in three persons: Father, Son, and
                Holy Spirit. We believe Jesus Christ is the only way to salvation,
                and through His death and resurrection, we are redeemed and
                reconciled to God.
              </p>
              <p>
                We believe in the baptism of the Holy Spirit, the gifts of the
                Spirit, divine healing, and the power of prayer. We believe in
                equipping believers to live victoriously and demonstrate the
                Kingdom of God in every sphere of life — in homes, schools,
                businesses, and communities. Our doctrine is rooted in sound
                theology, shaped by prophetic revelation, and activated through
                a lifestyle of holiness and surrender.
              </p>
              <p>
                As an apostolic and prophetic church, we stand firm on biblical
                truth while advancing with a bold vision for revival,
                reformation, and global impact.
              </p>
            </div>
          )}
          {active === "leadership" && (
            <div
              id="panel-leadership"
              role="tabpanel"
              aria-labelledby="tab-leadership"
              className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr] md:items-start"
            >
              <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <Image
                  src="/images/apostle-talbird.jpg"
                  alt="Apostle Derek Talbird"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              </div>
              <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Senior Leadership
                </h3>
                <p>
                  Apostle Derek Talbird is the visionary founder and Senior Pastor
                  of Living Word Memphis. Called by God to equip, activate, and
                  send leaders into their divine assignments, Apostle Talbird is
                  known for his revelatory teaching, prophetic insight, and
                  unwavering commitment to the presence of God.
                </p>
                <p>
                  Since planting Living Word Memphis in 2010, he has faithfully
                  shepherded a thriving, Spirit-empowered church that ministers
                  locally and influences globally. In 2016, he was publicly
                  affirmed as an Apostle, recognizing his call to build, govern,
                  and expand the Church with apostolic grace and integrity.
                </p>
                <p>
                  Alongside a team of dedicated pastors, elders, and ministry
                  leaders, Apostle Talbird continues to cast vision, develop
                  disciples, and lead with humility, wisdom, and fire. Under his
                  leadership, Living Word Memphis is not just a ministry —
                  it&apos;s a Kingdom training ground for spiritual growth,
                  personal breakthrough, and generational legacy.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
