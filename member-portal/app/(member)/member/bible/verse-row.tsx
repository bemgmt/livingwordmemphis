"use client";

import { Fragment, useCallback, useState } from "react";
import { MessageSquareText } from "lucide-react";

import { StrongsPopover } from "./strongs-popover";
import { VerseToolbar } from "./verse-toolbar";

const HIGHLIGHT_BG: Record<string, string> = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/30",
  green: "bg-green-100 dark:bg-green-900/30",
  blue: "bg-blue-100 dark:bg-blue-900/30",
  pink: "bg-pink-100 dark:bg-pink-900/30",
  purple: "bg-purple-100 dark:bg-purple-900/30",
};

type VerseRowProps = {
  verse: {
    id: string;
    verse: number;
    text: string;
    text_with_strongs: string | null;
  };
  highlightColor: string | null;
  hasNote: boolean;
  showStrongs: boolean;
  bookName: string;
  chapter: number;
  onHighlight: (verseId: string, color: string | null) => void;
  onNote: (verseId: string) => void;
  onShare: (verseId: string) => void;
};

function parseStrongsText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(\{[^}]+\})/g);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;

    if (seg.startsWith("{") && seg.endsWith("}")) {
      const inner = seg.slice(1, -1);
      // Morphological code like (H8804) — skip display
      if (inner.startsWith("(") && inner.endsWith(")")) continue;

      const code = inner;
      if (/^[HG]\d+$/.test(code)) {
        parts.push(
          <StrongsPopover key={`${i}-${code}`} code={code}>
            <button
              type="button"
              className="align-super text-[0.6em] font-mono text-primary/70 hover:text-primary hover:underline"
            >
              {code}
            </button>
          </StrongsPopover>,
        );
      }
    } else {
      parts.push(<Fragment key={i}>{seg}</Fragment>);
    }
  }

  return parts;
}

export function VerseRow({
  verse,
  highlightColor,
  hasNote,
  showStrongs,
  bookName,
  chapter,
  onHighlight,
  onNote,
  onShare,
}: VerseRowProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const handleClick = useCallback(() => {
    setShowToolbar((prev) => !prev);
  }, []);

  const bgClass = highlightColor ? HIGHLIGHT_BG[highlightColor] ?? "" : "";

  return (
    <div className="group relative">
      <div
        className={`cursor-pointer rounded-sm px-2 py-1 transition-colors hover:bg-secondary/50 ${bgClass}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
      >
        <span className="mr-1.5 inline-block min-w-[2ch] text-right align-top font-mono text-xs font-semibold text-primary/60">
          {verse.verse}
        </span>
        <span className="text-sm leading-relaxed text-foreground">
          {showStrongs && verse.text_with_strongs
            ? parseStrongsText(verse.text_with_strongs)
            : verse.text}
        </span>
        {hasNote && (
          <MessageSquareText className="ml-1 inline-block size-3 text-primary/60" />
        )}
      </div>

      {showToolbar && (
        <div className="absolute right-0 top-0 z-10 -translate-y-full">
          <VerseToolbar
            currentColor={highlightColor}
            hasNote={hasNote}
            onHighlight={(color) => {
              onHighlight(verse.id, color);
              setShowToolbar(false);
            }}
            onNote={() => {
              onNote(verse.id);
              setShowToolbar(false);
            }}
            onShare={() => {
              onShare(verse.id);
              setShowToolbar(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
