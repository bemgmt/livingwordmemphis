"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";

import { deleteSavedScripture, loadSavedScriptures } from "./actions";

type SavedScripture = {
  id: string;
  verse_id: string;
  reference: string;
  verse_text: string;
  note: string | null;
  created_at: string;
};

export function SavedScriptures({
  initialScriptures,
  onUseInChat,
}: {
  initialScriptures: SavedScripture[];
  onUseInChat?: (reference: string, text: string) => void;
}) {
  const [scriptures, setScriptures] = useState(initialScriptures);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteSavedScripture(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setScriptures((prev) => prev.filter((s) => s.id !== id));
      toast.success("Scripture removed");
    });
  }

  if (scriptures.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scriptures you save from the Bible reader will appear here.
        </p>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No saved scriptures yet. Use the Share button in the Bible reader
              and select &ldquo;Add to Study Assistant&rdquo; to save verses
              here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Scriptures you saved from the Bible reader for study reference.
      </p>

      <div className="space-y-3">
        {scriptures.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-medium text-primary">
                  {s.reference}
                </CardTitle>
                <div className="flex shrink-0 items-center gap-1">
                  {onUseInChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onUseInChat(s.reference, s.verse_text)}
                    >
                      Use in chat
                    </Button>
                  )}
                  <ConfirmDelete
                    onConfirm={() => handleDelete(s.id)}
                    disabled={isPending}
                    title="Remove saved scripture?"
                    description="This will remove the verse from your saved scriptures."
                  >
                    <button
                      className="px-1 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      &times;
                    </button>
                  </ConfirmDelete>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Saved{" "}
                {new Date(s.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-2 border-primary/30 pl-3 text-sm italic text-foreground">
                &ldquo;{s.verse_text}&rdquo;
              </blockquote>
              {s.note && (
                <p className="mt-2 text-sm text-muted-foreground">{s.note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
