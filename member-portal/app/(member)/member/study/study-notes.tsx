"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDelete } from "@/components/confirm-delete";

import {
  createStudyNote,
  updateStudyNote,
  deleteStudyNote,
  loadStudyNotes,
} from "./actions";

type StudyNote = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function StudyNotes({
  initialNotes,
}: {
  initialNotes: StudyNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(note: StudyNote) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setShowForm(true);
  }

  function handleSave() {
    startTransition(async () => {
      if (editingId) {
        const res = await updateStudyNote(editingId, { title, content });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Note updated");
      } else {
        const res = await createStudyNote(title, content);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Note created");
      }
      resetForm();
      const refreshed = await loadStudyNotes();
      if (refreshed.ok) setNotes(refreshed.notes);
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const res = await deleteStudyNote(noteId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (editingId === noteId) resetForm();
      toast.success("Note deleted");
    });
  }

  if (showForm) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {editingId ? "Edit note" : "New note"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Note title (e.g. Sunday Sermon Notes)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Write your notes here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="resize-y"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isPending || !content.trim()}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Save sermon notes, study reflections, and personal insights.
        </p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          New note
        </Button>
      </div>

      {notes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No notes yet. Create your first note to get started.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((note) => (
          <Card key={note.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-medium leading-snug">
                  {note.title}
                </CardTitle>
                <ConfirmDelete
                  onConfirm={() => handleDelete(note.id)}
                  disabled={isPending}
                  title="Delete this note?"
                  description="This action cannot be undone."
                >
                  <button
                    className="shrink-0 px-1 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    &times;
                  </button>
                </ConfirmDelete>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {new Date(note.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3">
              <p className="line-clamp-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {note.content}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => handleEdit(note)}
              >
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
