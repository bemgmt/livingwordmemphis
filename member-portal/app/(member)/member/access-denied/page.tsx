import Link from "next/link";

type AccessDeniedPageProps = {
  searchParams: Promise<{ area?: string }>;
};

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const { area } = await searchParams;
  const isYouthMinistry = area === "youth-ministry";

  return (
    <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">
        Access restricted
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">
        {isYouthMinistry
          ? "Youth ministry access is required"
          : "You do not have access to this area"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {isYouthMinistry
          ? "This curriculum is available only to administrators, participating youth, and their parents or guardians. Ask a church administrator to add Youth ministry access to your account."
          : "Ask a church administrator if you believe your account should have access."}
      </p>
      <Link
        href="/member/dashboard"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Return to dashboard
      </Link>
    </section>
  );
}
