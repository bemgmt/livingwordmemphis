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
    <section className="border-t border-border bg-muted/40 py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                active === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
          {active === "culture" && (
            <div className="space-y-4 text-foreground">
              <h3 className="font-serif text-xl font-semibold">Our Culture</h3>
              <p>
                The culture of Living Word Memphis is one of radical faith,
                authentic love, and unshakable Kingdom identity. We are a
                multi-generational, multi-ethnic church family united by a
                passion for God&apos;s presence and a commitment to living out
                the Word of God in our daily lives.
              </p>
              <p>
                We believe in cultivating a culture of honor, where every person
                is seen, known, and empowered to walk in their God-given purpose.
              </p>
              <p>
                This is your safe place where faith comes alive, destinies are
                unlocked, and Memphis is impacted by the transformative power of
                Jesus Christ.
              </p>
            </div>
          )}
          {active === "beliefs" && (
            <div className="space-y-4 text-foreground">
              <h3 className="font-serif text-xl font-semibold">Our Beliefs</h3>
              <p>
                Living Word Memphis is built upon the unshakable foundation of
                the Bible — God&apos;s living, authoritative Word. We believe in
                one God, eternally existent in three persons: Father, Son, and
                Holy Spirit.
              </p>
              <p>
                We believe in the baptism of the Holy Spirit, the gifts of the
                Spirit, divine healing, and the power of prayer. Our doctrine is
                rooted in sound theology, shaped by prophetic revelation, and
                activated through a lifestyle of holiness and surrender.
              </p>
            </div>
          )}
          {active === "leadership" && (
            <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
              <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                <Image
                  src="/images/apostle-talbird.jpg"
                  alt="Apostle Derek Talbird"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              </div>
              <div className="space-y-4 text-foreground">
                <h3 className="font-serif text-xl font-semibold">
                  Senior Leadership
                </h3>
                <p>
                  Apostle Derek Talbird is the visionary founder and Senior
                  Pastor of Living Word Memphis. Called by God to equip,
                  activate, and send leaders into their divine assignments,
                  Apostle Talbird is known for his revelatory teaching,
                  prophetic insight, and unwavering commitment to the presence of
                  God.
                </p>
                <p>
                  Since planting Living Word Memphis in 2010, he has faithfully
                  shepherded a thriving, Spirit-empowered church that ministers
                  locally and influences globally.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
