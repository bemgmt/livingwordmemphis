"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryArchive } from "@/app/(member)/member/youth/forms/actions";
import { Button } from "@/components/ui/button";

export function RetryArchiveButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <div><Button variant="outline" disabled={pending} onClick={() => start(async () => {
    try {
      const result = await retryArchive(id);
      setError(result.error ?? "");
      router.refresh();
    } catch { setError("Connection lost. Please retry archiving."); }
  })}>{pending ? "Archiving…" : "Retry PDF archive"}</Button>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}
