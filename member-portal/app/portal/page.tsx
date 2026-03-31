import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Member portal",
  description:
    "Sign in to access your dashboard, prayer requests, and leadership tools.",
};

export default function PortalHubPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 bg-background px-6 py-16 text-foreground">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Living Word Memphis
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">
          Member &amp; leadership portal
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to access your dashboard, prayer requests, and (for authorized
          leaders) admin tools.
        </p>
      </div>
      <nav className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          className="rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          href="/auth/login"
        >
          Sign in
        </Link>
        <Link
          className="rounded-md border border-input bg-background px-4 py-3 text-center text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          href="/member/dashboard"
        >
          Member area
        </Link>
        <Link
          className="rounded-md border border-input bg-background px-4 py-3 text-center text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          href="/admin/dashboard"
        >
          Admin area
        </Link>
        <Link
          className="rounded-md border border-transparent px-4 py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/"
        >
          Public site
        </Link>
      </nav>
    </main>
  );
}
