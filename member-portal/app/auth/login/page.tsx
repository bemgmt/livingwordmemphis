import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Magic link via Supabase Auth. After login you&apos;ll be redirected to
        your destination.
      </p>

      <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-xs text-zinc-500">
        Configure{" "}
        <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_SUPABASE_*</code>{" "}
        in <code className="rounded bg-zinc-100 px-1">.env.local</code>.
      </p>
    </main>
  );
}
