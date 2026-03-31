"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const subjects = [
  { value: "", label: "Select a subject…" },
  { value: "general", label: "General inquiry" },
  { value: "prayer", label: "Prayer request" },
  { value: "visit", label: "Planning a visit" },
  { value: "ministry", label: "Ministry information" },
  { value: "other", label: "Other" },
];

type SubmitState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | null;

export function ContactForm({
  heading = "Contact us",
  variant = "full",
}: {
  heading?: string;
  /** `compact` matches legacy home form (name, email, message only). */
  variant?: "full" | "compact";
}) {
  const [state, setState] = useState<SubmitState>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      company: String(fd.get("company") ?? ""),
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message: string;
      };
      setState(
        data.ok
          ? { ok: true, message: data.message }
          : { ok: false, message: data.message },
      );
      if (data.ok) form.reset();
    } catch {
      setState({
        ok: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
        {heading}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="relative mt-8 flex flex-col gap-5"
      >
        <div className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="contact-company">Company</label>
          <input
            id="contact-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        {variant === "full" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone (optional)</Label>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <select
                id="contact-subject"
                name="subject"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue=""
              >
                {subjects.map((s) => (
                  <option key={s.value || "empty"} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            className="resize-y"
          />
        </div>

        {state?.message && (
          <p
            className={
              state.ok ? "text-sm text-primary" : "text-sm text-destructive"
            }
            role="status"
          >
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
