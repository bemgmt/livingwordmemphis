"use client";

import { Eraser, Highlighter, MessageSquarePlus, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const HIGHLIGHT_COLORS = [
  { name: "yellow", class: "bg-yellow-300" },
  { name: "green", class: "bg-green-300" },
  { name: "blue", class: "bg-blue-300" },
  { name: "pink", class: "bg-pink-300" },
  { name: "purple", class: "bg-purple-300" },
] as const;

export function VerseToolbar({
  currentColor,
  hasNote,
  onHighlight,
  onNote,
  onShare,
}: {
  currentColor: string | null;
  hasNote: boolean;
  onHighlight: (color: string | null) => void;
  onNote: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-lg">
      <div className="flex items-center gap-0.5 border-r border-border pr-1">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.name}
            title={`Highlight ${c.name}`}
            onClick={() => onHighlight(c.name)}
            className={`size-5 rounded-full ${c.class} transition-transform hover:scale-110 ${
              currentColor === c.name
                ? "ring-2 ring-primary ring-offset-1"
                : ""
            }`}
          />
        ))}
        {currentColor && (
          <button
            title="Remove highlight"
            onClick={() => onHighlight(null)}
            className="ml-0.5 rounded p-0.5 text-muted-foreground hover:text-destructive"
          >
            <Eraser className="size-3.5" />
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        title={hasNote ? "Edit note" : "Add note"}
        onClick={onNote}
        className={hasNote ? "text-primary" : ""}
      >
        <MessageSquarePlus className="size-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon-xs"
        title="Share verse"
        onClick={onShare}
      >
        <Share2 className="size-3.5" />
      </Button>
    </div>
  );
}
