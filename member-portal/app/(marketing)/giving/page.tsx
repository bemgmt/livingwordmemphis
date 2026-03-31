import type { Metadata } from "next";
import Link from "next/link";

import { TITHE_GIVE_URL } from "@/components/marketing/constants";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Giving",
  description:
    "Give to Living Word Memphis securely online through Tithe.ly.",
};

export default function GivingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Giving
      </h1>
      <p className="mt-6 text-muted-foreground">
        Thank you for your generosity. Your gifts help us love God, love
        people, and serve our city. Secure online giving is available through
        Tithe.ly.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <a
            href={TITHE_GIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Give online
          </a>
        </Button>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Official giving records and tax statements come from the church office
        and Tithe.ly. Members can also save private giving reminders in the{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          member portal
        </Link>
        .
      </p>
    </main>
  );
}
