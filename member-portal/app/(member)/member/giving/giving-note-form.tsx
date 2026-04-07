"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type GivingResult, savePersonalGivingNote } from "./actions";

export function GivingNoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    GivingResult | undefined,
    FormData
  >(savePersonalGivingNote, undefined);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Giving note saved.");
      formRef.current?.reset();
    } else if (state?.ok === false) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl font-medium">
          Personal giving note
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          This is <strong>not</strong> your official giving record. You are only
          saving a private reminder on your account.
        </p>
        <form
          ref={formRef}
          action={formAction}
          className="space-y-4 max-w-lg"
        >
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue="tithe"
            >
              <option value="tithe">Tithe</option>
              <option value="offering">Offering</option>
              <option value="missions">Missions</option>
              <option value="building">Building / facilities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_detail">
              Other detail{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="category_detail"
              name="category_detail"
              type="text"
              maxLength={120}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
