import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Set new password
            </h1>
            <CardDescription>
              Choose a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <UpdatePasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
