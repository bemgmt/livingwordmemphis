"use client";

import { useEffect, useState, useTransition } from "react";
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

import { getUserGroups, shareVerse } from "./actions";

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
  const [target, setTarget] = useState<"bulletin" | "group">("bulletin");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getUserGroups().then(setGroups);
    }
  }, [open]);

  function handleShare() {
    startTransition(async () => {
      const result = await shareVerse(
        verseId,
        target,
        target === "group" ? selectedGroup : undefined,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        target === "bulletin"
          ? "Verse shared to Bulletin Board"
          : "Verse shared to group",
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share verse</DialogTitle>
          <DialogDescription>
            Share <strong>{verseRef}</strong> with your church community.
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
              value="group"
              checked={target === "group"}
              onChange={() => setTarget("group")}
              className="accent-primary"
            />
            Share to a Group
          </label>

          {target === "group" && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              {groups.length === 0 && (
                <option disabled>You haven&apos;t joined any groups yet</option>
              )}
            </select>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              isPending ||
              (target === "group" && !selectedGroup)
            }
          >
            {isPending ? "Sharing…" : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
