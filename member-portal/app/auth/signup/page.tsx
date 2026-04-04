import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Create account
            </h1>
            <CardDescription>
              Join the Living Word Memphis member portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <SignupForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
