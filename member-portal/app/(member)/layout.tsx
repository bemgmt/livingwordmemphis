import Link from "next/link";

import { ChurchLogo } from "@/components/church-logo";
import { memberSidebarNav } from "@/lib/member-sidebar-nav";
import { requireAuth } from "@/lib/supabase/auth-helpers";

import { MemberSignOut } from "./sign-out-button";

const publicSiteHref =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "/";

export default async function MemberAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col">
        <ChurchLogo heightClass="h-11" />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {memberSidebarNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <Link
            href={publicSiteHref}
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Back to Website
          </Link>
          <MemberSignOut />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="p-4 lg:hidden">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <div className="flex flex-col gap-1">
              {memberSidebarNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              ))}
              <Link
                href={publicSiteHref}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Back to Website
              </Link>
              <div className="px-1 pt-1">
                <MemberSignOut />
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
