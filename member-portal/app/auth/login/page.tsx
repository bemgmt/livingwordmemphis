import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Sign in
            </h1>
            <CardDescription>
              Magic link via Supabase Auth. After login you&apos;ll be redirected
              to your destination.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Configure{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
            NEXT_PUBLIC_SUPABASE_*
          </code>{" "}
          in{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
            .env.local
          </code>
          .
        </p>
      </div>
    </main>
  );
}
