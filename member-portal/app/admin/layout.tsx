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
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <ChurchLogo heightClass="h-9" href="/member/dashboard" />
            <span className="font-medium text-foreground">Leadership portal</span>
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link
              className="transition-colors hover:text-foreground"
              href="/admin/dashboard"
            >
              Dashboard
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
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
