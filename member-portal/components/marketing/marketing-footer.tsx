import Link from "next/link";

import { CHURCH_ADDRESS, CHURCH_EMAIL } from "@/components/marketing/constants";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/visitors", label: "New here" },
  { href: "/events", label: "Events" },
  { href: "/giving", label: "Giving" },
  { href: "/contact", label: "Contact" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md space-y-3">
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Living Word Memphis
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Love God. Love People. Live in Dominion.
            </p>
            <p className="text-sm text-muted-foreground">{CHURCH_ADDRESS}</p>
            <p className="text-sm">
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`mailto:${CHURCH_EMAIL}`}
              >
                {CHURCH_EMAIL}
              </a>
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          &copy; {year} Living Word Memphis. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
