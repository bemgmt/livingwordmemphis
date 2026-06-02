"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { type PrayerResult, submitPrayerRequest } from "./actions";

const visibilityOptions = [
  {
    value: "pastoral_staff_only",
    label: "Pastoral / staff only (default)",
    hint: "Visible to church leadership and staff for care and follow-up.",
  },
  {
    value: "prayer_ministry",
    label: "Broader prayer ministry team",
    hint: "Includes approved intercessors and ministry leaders per church policy.",
  },
  {
    value: "public_praise_ok",
    label: "OK to share as public praise (anonymized)",
    hint: "You consent to possible bulletin or stage use without your name. Staff still reviews.",
  },
] as const;

export function PrayerForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    PrayerResult | undefined,
    FormData
  >(submitPrayerRequest, undefined);

  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Prayer request submitted.");
      formRef.current?.reset();
      setShowPending(true);
    } else if (state?.ok === false) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl font-medium">
          Share a need
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showPending && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/40 dark:bg-amber-950/30">
            <span className="shrink-0 text-amber-500">🙏</span>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Request received — pending review
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                Your prayer request has been submitted and is awaiting admin
                approval before it&apos;s shared with the prayer team.
              </p>
              <button
                onClick={() => setShowPending(false)}
                className="mt-2 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400"
              >
                Submit another request
              </button>
            </div>
          </div>
        )}
        <form ref={formRef} action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input id="title" name="title" type="text" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Request</Label>
            <Textarea
              id="body"
              name="body"
              required
              rows={6}
              placeholder="Share your prayer need..."
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              Visibility
            </legend>
            {visibilityOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  defaultChecked={opt.value === "pastoral_staff_only"}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="is_anonymous_to_team"
              className="mt-1 size-4 accent-primary"
            />
            <span>
              Keep my name hidden from prayer ministry volunteers where policy
              allows (staff may still see identity for safety).
            </span>
          </label>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
