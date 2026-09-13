"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addChild } from "@/app/(member)/member/youth/forms/actions";
import { Button } from "@/components/ui/button";

export function AddChild() {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [id, setId] = useState<string>();
  const router = useRouter();
  return <form className="rounded-xl border bg-card p-5" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const childId = id ?? crypto.randomUUID();
    setId(childId);
    start(async () => {
      try {
        const result = await addChild(childId, String(data.get("childName") ?? ""));
        if (result.error) setError(result.error);
        else router.push(`/member/youth/forms/${result.id}`);
      } catch { setError("Connection lost. Please try again."); }
    });
  }}>
    <h2 className="text-lg font-semibold">Add a child</h2>
    <p className="mt-1 text-sm text-muted-foreground">Complete one nursery form per child. You can add siblings separately.</p>
    <label className="mt-4 block text-sm font-medium" htmlFor="new-child-name">Child&apos;s full name</label>
    <input id="new-child-name" name="childName" required maxLength={200} className="mt-2 min-h-11 w-full rounded-md border bg-background px-3" autoComplete="off" />
    <Button className="mt-4" disabled={pending}>{pending ? "Adding…" : "Add child & start form"}</Button>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </form>;
}
