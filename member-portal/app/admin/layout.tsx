import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminRoleProvider } from "@/components/admin/admin-role-context";
import { ChurchLogo } from "@/components/church-logo";
import { MobileNav, SidebarNav } from "@/components/sidebar-nav";
import { getUserAdminRole, ROLE_LABELS } from "@/lib/auth/staff";
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

  const role = await getUserAdminRole(supabase, user.id);
  if (!role) {
    redirect("/member/dashboard");
  }

  const footer = (
    <Link
      href="/member/dashboard"
      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      Member view
    </Link>
  );

  return (
    <AdminRoleProvider role={role} userId={user.id}>
      <div className="flex min-h-screen bg-secondary">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <ChurchLogo heightClass="h-9" href="/admin/dashboard" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Admin Panel
              </span>
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
          <div className="mt-8 flex flex-1 flex-col">
            <SidebarNav variant="admin" adminRole={role} footer={footer} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="p-4 lg:hidden">
            <MobileNav
              variant="admin"
              adminRole={role}
              title={`Admin \u2014 ${ROLE_LABELS[role]}`}
              footer={footer}
            />
          </div>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminRoleProvider>
  );
}
