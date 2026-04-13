"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getBooks,
  getChapterVerses,
  saveReadingPosition,
  searchBible,
  toggleHighlight,
} from "./actions";
import { NotePanel } from "./notes-panel";
import { ShareDialog } from "./share-dialog";
import { VerseRow } from "./verse-row";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Translation = {
  id: string;
  name: string;
  abbreviation: string;
  module: string;
  has_strongs: boolean;
};

type Book = {
  id: string;
  book_number: number;
  name: string;
  testament: string;
  chapter_count: number;
};

type Verse = {
  id: string;
  chapter: number;
  verse: number;
  text: string;
  text_with_strongs: string | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BibleReader({
  translations,
}: {
  translations: Translation[];
}) {
  const [selectedTranslation, setSelectedTranslation] =
    useState<Translation | null>(translations[0] ?? null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<
    Record<string, { id: string; content: string; updated_at?: string }>
  >({});
  const [showStrongs, setShowStrongs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Search state
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      verse_id: string;
      book_name: string;
      book_number: number;
      chapter: number;
      verse: number;
      text: string;
    }[]
  >([]);

  // Note panel state
  const [notePanel, setNotePanel] = useState<{
    open: boolean;
    verseId: string;
    verseRef: string;
  }>({ open: false, verseId: "", verseRef: "" });

  // Share dialog state
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    verseId: string;
    verseRef: string;
  }>({ open: false, verseId: "", verseRef: "" });

  const contentRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadBooks = useCallback(async (translationId: string) => {
    setLoading(true);
    const data = await getBooks(translationId);
    setBooks(data);
    setSelectedBook(null);
    setSelectedChapter(null);
    setVerses([]);
    setHighlights({});
    setNotes({});
    setSearchResults([]);
    setLoading(false);
  }, []);

  const loadChapter = useCallback(
    async (book: Book, chapter: number) => {
      if (!selectedTranslation) return;
      setLoading(true);
      const data = await getChapterVerses(book.id, chapter);
      setVerses(data.verses);
      setHighlights(data.highlights);
      setNotes(data.notes);
      setSearchResults([]);
      setLoading(false);

      saveReadingPosition(selectedTranslation.id, book.id, chapter);

      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [selectedTranslation],
  );

  useEffect(() => {
    if (selectedTranslation) loadBooks(selectedTranslation.id);
  }, [selectedTranslation, loadBooks]);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async function handleSearch() {
    if (!selectedTranslation || !search.trim()) return;
    setLoading(true);
    const results = await searchBible(search.trim(), selectedTranslation.id);
    setSearchResults(results);
    setVerses([]);
    setSelectedChapter(null);
    setLoading(false);
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  function handleHighlight(verseId: string, color: string | null) {
    startTransition(async () => {
      const result = await toggleHighlight(verseId, color);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHighlights((prev) => {
        const next = { ...prev };
        if (color) next[verseId] = color;
        else delete next[verseId];
        return next;
      });
    });
  }

  function handleOpenNote(verseId: string) {
    const verse = verses.find((v) => v.id === verseId);
    if (!verse || !selectedBook) return;
    const ref = `${selectedBook.name} ${verse.chapter}:${verse.verse}`;
    const existing = notes[verseId]
      ? { id: notes[verseId].id, content: notes[verseId].content }
      : null;
    setNotePanel({ open: true, verseId, verseRef: ref });
  }

  function handleNoteSaved(
    verseId: string,
    note: { id: string; content: string },
  ) {
    setNotes((prev) => ({ ...prev, [verseId]: note }));
  }

  function handleNoteDeleted(verseId: string) {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[verseId];
      return next;
    });
  }

  function handleOpenShare(verseId: string) {
    const verse = verses.find((v) => v.id === verseId);
    if (!verse || !selectedBook || !selectedTranslation) return;
    const ref = `${selectedBook.name} ${verse.chapter}:${verse.verse} (${selectedTranslation.abbreviation})`;
    setShareDialog({ open: true, verseId, verseRef: ref });
  }

  // ---------------------------------------------------------------------------
  // Chapter navigation
  // ---------------------------------------------------------------------------

  function handlePrevChapter() {
    if (!selectedBook || !selectedChapter) return;
    if (selectedChapter > 1) {
      const prev = selectedChapter - 1;
      setSelectedChapter(prev);
      loadChapter(selectedBook, prev);
    } else {
      const prevBook = books.find(
        (b) => b.book_number === selectedBook.book_number - 1,
      );
      if (prevBook) {
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapter_count);
        loadChapter(prevBook, prevBook.chapter_count);
      }
    }
  }

  function handleNextChapter() {
    if (!selectedBook || !selectedChapter) return;
    if (selectedChapter < selectedBook.chapter_count) {
      const next = selectedChapter + 1;
      setSelectedChapter(next);
      loadChapter(selectedBook, next);
    } else {
      const nextBook = books.find(
        (b) => b.book_number === selectedBook.book_number + 1,
      );
      if (nextBook) {
        setSelectedBook(nextBook);
        setSelectedChapter(1);
        loadChapter(nextBook, 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (translations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No Bible translations have been loaded yet. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Translation selector */}
      <div className="flex flex-wrap items-center gap-2">
        {translations.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTranslation(t)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedTranslation?.id === t.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.abbreviation}
          </button>
        ))}

        {selectedTranslation?.has_strongs && (
          <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showStrongs}
              onChange={(e) => setShowStrongs(e.target.checked)}
              className="accent-primary"
            />
            Strong&apos;s numbers
          </label>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripture…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={loading || !search.trim()}
        >
          Search
        </Button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Search results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {searchResults.map((r) => (
                <li key={r.verse_id} className="py-3">
                  <p className="font-medium text-foreground">
                    {r.book_name} {r.chapter}:{r.verse}
                  </p>
                  <p className="mt-1 text-muted-foreground">{r.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main reader layout */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Book list */}
        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Books
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[32rem] overflow-y-auto">
            {books.length > 0 && (
              <>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Old Testament
                </p>
                {books
                  .filter((b) => b.testament === "OT")
                  .map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setSelectedChapter(null);
                        setVerses([]);
                        setSearchResults([]);
                      }}
                      className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                        selectedBook?.id === book.id
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {book.name}
                    </button>
                  ))}

                <p className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  New Testament
                </p>
                {books
                  .filter((b) => b.testament === "NT")
                  .map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setSelectedChapter(null);
                        setVerses([]);
                        setSearchResults([]);
                      }}
                      className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                        selectedBook?.id === book.id
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {book.name}
                    </button>
                  ))}
              </>
            )}
            {books.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground">
                Select a translation above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reading area */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="size-4" />
                {selectedChapter && selectedBook
                  ? `${selectedBook.name} ${selectedChapter}`
                  : selectedBook
                    ? `${selectedBook.name} — select a chapter`
                    : "Select a book to begin"}
              </CardTitle>

              {/* Prev / Next navigation */}
              {selectedChapter && selectedBook && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handlePrevChapter}
                    disabled={
                      selectedBook.book_number === 1 && selectedChapter === 1
                    }
                  >
                    ← Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleNextChapter}
                    disabled={
                      selectedBook.book_number === 66 &&
                      selectedChapter === selectedBook.chapter_count
                    }
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>

            {/* Chapter grid */}
            {selectedBook && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from(
                  { length: selectedBook.chapter_count },
                  (_, i) => i + 1,
                ).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChapter(ch);
                      loadChapter(selectedBook, ch);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded text-xs transition-colors ${
                      selectedChapter === ch
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent
            ref={contentRef}
            className="max-h-[32rem] overflow-y-auto"
          >
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : verses.length > 0 ? (
              <div className="space-y-0.5">
                {verses.map((v) => (
                  <VerseRow
                    key={v.id}
                    verse={v}
                    highlightColor={highlights[v.id] ?? null}
                    hasNote={!!notes[v.id]}
                    showStrongs={showStrongs}
                    bookName={selectedBook?.name ?? ""}
                    chapter={selectedChapter ?? 0}
                    onHighlight={handleHighlight}
                    onNote={handleOpenNote}
                    onShare={handleOpenShare}
                  />
                ))}

                {/* Bottom chapter navigation */}
                {selectedChapter && selectedBook && (
                  <div className="flex justify-between border-t border-border pt-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevChapter}
                      disabled={
                        selectedBook.book_number === 1 && selectedChapter === 1
                      }
                    >
                      ← Previous chapter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextChapter}
                      disabled={
                        selectedBook.book_number === 66 &&
                        selectedChapter === selectedBook.chapter_count
                      }
                    >
                      Next chapter →
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Choose a book and chapter to read.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Note panel */}
      <NotePanel
        open={notePanel.open}
        onOpenChange={(open) => setNotePanel((prev) => ({ ...prev, open }))}
        verseId={notePanel.verseId}
        verseRef={notePanel.verseRef}
        existingNote={notes[notePanel.verseId] ?? null}
        onSaved={handleNoteSaved}
        onDeleted={handleNoteDeleted}
      />

      {/* Share dialog */}
      <ShareDialog
        open={shareDialog.open}
        onOpenChange={(open) =>
          setShareDialog((prev) => ({ ...prev, open }))
        }
        verseId={shareDialog.verseId}
        verseRef={shareDialog.verseRef}
      />
    </div>
  );
}
