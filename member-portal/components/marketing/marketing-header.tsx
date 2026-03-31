"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Clock,
  Facebook,
  Instagram,
  LogIn,
  MapPin,
  Menu,
  X,
  Youtube,
} from "lucide-react";

import { ChurchLogo } from "@/components/church-logo";
import {
  CHURCH_ADDRESS,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  YOUTUBE_CHANNEL,
  YOUTUBE_STREAMS,
} from "@/components/marketing/constants";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; external?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: YOUTUBE_STREAMS, label: "Sermons", external: true },
  { href: "/events", label: "Events" },
  { href: "/giving", label: "Giving" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const setMq = () => setWide(mq.matches);
    setMq();
    mq.addEventListener("change", setMq);
    return () => mq.removeEventListener("change", setMq);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const showTopbar =
    isHome && (wide ? scrolled : mobileOpen);

  return (
    <>
      {/* Top info bar (home page only — matches legacy static index) */}
      {isHome && (
      <div
        className={cn(
          "fixed left-0 right-0 top-0 z-[1000] flex flex-col gap-2 px-4 py-2 text-sm text-white backdrop-blur-md transition-all duration-300 lg:flex-row lg:items-center lg:justify-between",
          "bg-black/85",
          showTopbar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0 lg:pointer-events-auto",
          !wide && mobileOpen && "pointer-events-auto translate-y-0 opacity-100",
        )}
      >
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-4">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {CHURCH_ADDRESS}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden />
            Sundays at 10:00 AM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand-accent"
            aria-label="Facebook"
          >
            <Facebook className="size-4" />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand-accent"
            aria-label="Instagram"
          >
            <Instagram className="size-4" />
          </a>
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand-accent"
            aria-label="YouTube"
          >
            <Youtube className="size-4" />
          </a>
        </div>
      </div>
      )}

      <header
        className={cn(
          "relative z-10 w-full",
          isHome ? "" : "border-b border-border bg-background",
        )}
      >
        <nav
          className={cn(
            "flex w-full items-center justify-between gap-4 px-5 py-3 transition-colors duration-300",
            isHome && "absolute left-0 right-0 top-0",
            isHome &&
              (scrolled
                ? "bg-background/95 text-foreground shadow-sm backdrop-blur-md"
                : "bg-transparent text-white"),
            !isHome && "bg-background text-foreground",
          )}
        >
          <ChurchLogo
            href="/"
            heightClass="h-10"
            onDark={isHome && !scrolled}
          />

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ href, label, external }) => (
              <li key={href + label}>
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isHome && !scrolled
                        ? "hover:text-brand-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === href &&
                        (isHome && !scrolled
                          ? "text-brand-accent"
                          : "text-primary"),
                      pathname !== href &&
                        (isHome && !scrolled
                          ? "hover:text-brand-accent"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"),
                    )}
                  >
                    {label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link
                href="/auth/login"
                className={cn(
                  "ml-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isHome && !scrolled
                    ? "hover:text-brand-accent"
                    : "border border-input bg-background hover:bg-secondary",
                )}
              >
                <LogIn className="size-4" aria-hidden />
                Member login
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/auth/login"
              className={cn(
                "rounded-md p-2",
                isHome && !scrolled
                  ? "text-white hover:text-brand-accent"
                  : "text-foreground",
              )}
              aria-label="Member login"
            >
              <LogIn className="size-5" />
            </Link>
            <button
              type="button"
              className={cn(
                "rounded-md p-2",
                isHome && !scrolled
                  ? "text-white hover:text-brand-accent"
                  : "text-foreground",
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div
            className={cn(
              "border-t border-border bg-background px-4 py-4 shadow-lg lg:hidden",
              isHome && "absolute left-0 right-0 top-full z-20",
            )}
          >
            <ul className="flex flex-col gap-1">
              {navItems.map(({ href, label, external }) => (
                <li key={href + label}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary",
                        pathname === href
                          ? "bg-secondary text-primary"
                          : "text-foreground",
                      )}
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link
                  href="/auth/login"
                  className="mt-1 block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  Member login
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
