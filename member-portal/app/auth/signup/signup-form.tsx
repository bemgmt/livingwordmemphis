"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/member/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "resending">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("sending");

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName || undefined },
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(
        error.message.toLowerCase().includes("rate limit")
          ? "Too many requests. Please wait a few minutes and try again."
          : error.message,
      );
      return;
    }

    setStatus("sent");
  }

  async function handleResend() {
    if (resendCooldown) return;
    setStatus("resending");

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setMessage(
        error.message.toLowerCase().includes("rate limit")
          ? "Too many requests. Please wait a minute and try again."
          : error.message,
      );
      setStatus("sent");
    } else {
      setMessage("Email resent! Check your inbox.");
      setStatus("sent");
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 60_000);
    }
  }

  // ── Verification sent state ──────────────────────────────────────────────
  if (status === "sent" || status === "resending") {
    return (
      <div className="space-y-6 py-2">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✉️
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold text-foreground break-all">
              {email}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account. Be sure to
            check your <span className="font-medium text-foreground">spam or junk</span> folder
            if you don&apos;t see it within a few minutes.
          </p>
        </div>

        {message && (
          <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={resendCooldown || status === "resending"}
            onClick={handleResend}
          >
            {status === "resending"
              ? "Sending…"
              : resendCooldown
                ? "Email sent — wait 60s to resend"
                : "Resend confirmation email"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(next)}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            placeholder="How you'd like to be known"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {message && status === "error" && (
        <p className="text-sm text-destructive">{message}</p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
