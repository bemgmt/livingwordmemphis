import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Reset password
            </h1>
            <CardDescription>
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
