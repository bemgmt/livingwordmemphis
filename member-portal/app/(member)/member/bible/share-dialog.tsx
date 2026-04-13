"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { shareVerse, shareVerseToStudy } from "./actions";

export function ShareDialog({
  open,
  onOpenChange,
  verseId,
  verseRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseId: string;
  verseRef: string;
}) {
  const [target, setTarget] = useState<"bulletin" | "study">("bulletin");
  const [isPending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      if (target === "study") {
        const result = await shareVerseToStudy(verseId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Verse saved to Study Assistant");
      } else {
        const result = await shareVerse(verseId, "bulletin");
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Verse shared to Bulletin Board");
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share verse</DialogTitle>
          <DialogDescription>
            Share <strong>{verseRef}</strong> with your church community or save
            it for study.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="shareTarget"
              value="bulletin"
              checked={target === "bulletin"}
              onChange={() => setTarget("bulletin")}
              className="accent-primary"
            />
            Post to Bulletin Board
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="shareTarget"
              value="study"
              checked={target === "study"}
              onChange={() => setTarget("study")}
              className="accent-primary"
            />
            Add to Study Assistant
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isPending}>
            {isPending ? "Sharing…" : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
