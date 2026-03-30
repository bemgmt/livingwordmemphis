import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userHasStaffAccess } from "@/lib/auth/staff";

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
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <span className="font-semibold text-zinc-900">Leadership portal</span>
          <nav className="flex gap-4 text-sm text-zinc-600">
            <a className="hover:text-zinc-900" href="/admin/dashboard">
              Dashboard
            </a>
            <a className="hover:text-zinc-900" href="/member/dashboard">
              Member view
            </a>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
