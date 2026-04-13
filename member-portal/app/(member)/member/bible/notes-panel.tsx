"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { deleteNote, saveNote } from "./actions";

export function NotePanel({
  open,
  onOpenChange,
  verseId,
  verseRef,
  existingNote,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseId: string;
  verseRef: string;
  existingNote: { id: string; content: string } | null;
  onSaved: (verseId: string, note: { id: string; content: string }) => void;
  onDeleted: (verseId: string) => void;
}) {
  const [content, setContent] = useState(existingNote?.content ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await saveNote(verseId, content);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onSaved(verseId, { id: result.noteId!, content: content.trim() });
      toast.success("Note saved");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!existingNote) return;
    startTransition(async () => {
      const result = await deleteNote(existingNote.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onDeleted(verseId);
      toast.success("Note deleted");
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Note — {verseRef}</SheetTitle>
          <SheetDescription>
            Add a personal note for this verse.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts…"
            rows={8}
            className="resize-none"
          />
        </div>
        <SheetFooter>
          <div className="flex w-full items-center justify-between">
            {existingNote ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !content.trim()}
            >
              {isPending ? "Saving…" : "Save note"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
