import Link from "next/link";

import { ChurchLogo } from "@/components/church-logo";
import { MobileNav, SidebarNav } from "@/components/sidebar-nav";
import { rolesGrantYouthAccess } from "@/lib/auth/youth";
import { createClient } from "@/lib/supabase/server";

import { MemberSignOut } from "../(member)/sign-out-button";

const publicSiteHref =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "/";

export default async function MemberAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: roles } = user && !user.is_anonymous ? await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id) : { data: [] };

  const roleSet = new Set(roles?.map((r) => r.role) ?? []);
  const isYouthMember = rolesGrantYouthAccess(roleSet);

  const footer = (
    <>
      <Link
        href={publicSiteHref}
        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        Back to Website
      </Link>
      {user && !user.is_anonymous ? <MemberSignOut /> : <Link href="/auth/login?next=/member/sunday-school" className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Sign in</Link>}
    </>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col">
        <ChurchLogo heightClass="h-11" />
        <div className="mt-8 flex flex-1 flex-col">
          <SidebarNav
            variant="member"
            isYouthMember={isYouthMember}
            footer={footer}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="p-4 lg:hidden">
          <MobileNav
            variant="member"
            title="Living Word Memphis"
            isYouthMember={isYouthMember}
            footer={footer}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
