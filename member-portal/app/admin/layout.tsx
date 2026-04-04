import Link from "next/link";
import { redirect } from "next/navigation";

import { ChurchLogo } from "@/components/church-logo";
import { adminSidebarNav } from "@/lib/admin-sidebar-nav";
import { userHasStaffAccess } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin/dashboard");
  }

  const ok = await userHasStaffAccess(supabase, user.id);
  if (!ok) {
    redirect("/member/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <ChurchLogo heightClass="h-9" href="/admin/dashboard" />
          <span className="text-sm font-semibold text-foreground">
            Leadership
          </span>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {adminSidebarNav.map(({ href, label, icon: Icon }) => (
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
            href="/member/dashboard"
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Member view
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="p-4 lg:hidden">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <ChurchLogo heightClass="h-7" href="/admin/dashboard" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Leadership
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {adminSidebarNav.map(({ href, label, icon: Icon }) => (
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
                href="/member/dashboard"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Member view
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
