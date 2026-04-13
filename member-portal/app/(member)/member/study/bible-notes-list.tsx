"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { loadAllBibleNotes } from "./actions";

type BibleNote = {
  id: string;
  content: string;
  updated_at: string;
  verse_id: string;
  reference: string;
  verse_text: string;
};

export function BibleNotesList({
  initialNotes,
  initialTotal,
}: {
  initialNotes: BibleNote[];
  initialTotal: number;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const pageSize = 20;
  const hasMore = page * pageSize < total;

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const res = await loadAllBibleNotes(nextPage, pageSize);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setNotes((prev) => [...prev, ...res.notes]);
      setTotal(res.total);
      setPage(nextPage);
    });
  }

  if (notes.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          All your Bible verse notes and highlights in one place.
        </p>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No Bible notes yet. Open the{" "}
              <Link href="/member/bible" className="text-primary underline">
                Bible reader
              </Link>{" "}
              and tap a verse to add notes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} note{total !== 1 ? "s" : ""} across your Bible reading.
        </p>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href="/member/bible"
                  className="transition-colors hover:text-primary"
                >
                  <CardTitle className="text-base font-medium">
                    {note.reference}
                  </CardTitle>
                </Link>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <blockquote className="border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
                &ldquo;{note.verse_text}&rdquo;
              </blockquote>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {note.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
