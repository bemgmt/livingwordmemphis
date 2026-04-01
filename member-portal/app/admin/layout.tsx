import Link from "next/link";
import { redirect } from "next/navigation";

import { ChurchLogo } from "@/components/church-logo";
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
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <ChurchLogo heightClass="h-9" href="/member/dashboard" />
            <span className="font-medium text-foreground">Leadership portal</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link
              className="transition-colors hover:text-foreground"
              href="/admin/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/admin/studio"
            >
              Content (CMS)
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/member/dashboard"
            >
              Member view
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
