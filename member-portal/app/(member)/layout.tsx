import Link from "next/link";

import { ChurchLogo } from "@/components/church-logo";
import { MobileNav, SidebarNav } from "@/components/sidebar-nav";
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

  const footer = (
    <>
      <Link
        href={publicSiteHref}
        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        Back to Website
      </Link>
      <MemberSignOut />
    </>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col">
        <ChurchLogo heightClass="h-11" />
        <div className="mt-8 flex flex-1 flex-col">
          <SidebarNav items={memberSidebarNav} footer={footer} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="p-4 lg:hidden">
          <MobileNav
            items={memberSidebarNav}
            title="Living Word Memphis"
            footer={footer}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
