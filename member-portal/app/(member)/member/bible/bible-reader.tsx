"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ApprovedBible = {
  id: string;
  name: string;
  abbreviation: string;
  api_bible_id: string;
};

type Book = { id: string; name: string; nameLong: string };
type Chapter = { id: string; number: string; reference: string };

async function apiBible(path: string) {
  const res = await fetch(`/api/bible?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function BibleReader({
  approvedBibles,
}: {
  approvedBibles: ApprovedBible[];
}) {
  const [selectedBible, setSelectedBible] = useState<ApprovedBible | null>(
    approvedBibles[0] ?? null,
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; reference: string; text: string }[]
  >([]);

  const loadBooks = useCallback(async (bibleId: string) => {
    setLoading(true);
    try {
      const data = await apiBible(`/bibles/${bibleId}/books`);
      setBooks(data.data ?? []);
      setSelectedBook(null);
      setChapters([]);
      setSelectedChapter(null);
      setContent("");
    } catch {
      setBooks([]);
    }
    setLoading(false);
  }, []);

  const loadChapters = useCallback(
    async (bookId: string) => {
      if (!selectedBible) return;
      setLoading(true);
      try {
        const data = await apiBible(
          `/bibles/${selectedBible.api_bible_id}/books/${bookId}/chapters`,
        );
        setChapters(data.data ?? []);
        setSelectedChapter(null);
        setContent("");
      } catch {
        setChapters([]);
      }
      setLoading(false);
    },
    [selectedBible],
  );

  const loadChapterContent = useCallback(
    async (chapterId: string) => {
      if (!selectedBible) return;
      setLoading(true);
      try {
        const data = await apiBible(
          `/bibles/${selectedBible.api_bible_id}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
        );
        setContent(data.data?.content ?? "");
      } catch {
        setContent("Failed to load content.");
      }
      setLoading(false);
    },
    [selectedBible],
  );

  async function handleSearch() {
    if (!selectedBible || !search.trim()) return;
    setLoading(true);
    try {
      const data = await apiBible(
        `/bibles/${selectedBible.api_bible_id}/search?query=${encodeURIComponent(search)}&limit=20`,
      );
      setSearchResults(
        (data.data?.verses ?? []).map(
          (v: { id: string; reference: string; text: string }) => ({
            id: v.id,
            reference: v.reference,
            text: v.text,
          }),
        ),
      );
    } catch {
      setSearchResults([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedBible) loadBooks(selectedBible.api_bible_id);
  }, [selectedBible, loadBooks]);

  if (approvedBibles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No Bible translations have been approved yet. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {approvedBibles.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBible(b)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedBible?.id === b.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {b.abbreviation}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scripture…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button size="sm" onClick={handleSearch} disabled={loading}>
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Search results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {searchResults.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="font-medium text-foreground">{r.reference}</p>
                  <p className="mt-1 text-muted-foreground">{r.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Books
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  loadChapters(book.id);
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
            {books.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground">
                Select a translation above.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedChapter
                  ? selectedChapter.reference
                  : selectedBook
                    ? `${selectedBook.name} — select a chapter`
                    : "Select a book to begin"}
              </CardTitle>
            </div>
            {selectedBook && chapters.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChapter(ch);
                      loadChapterContent(ch.id);
                    }}
                    className={`h-8 w-8 rounded text-xs transition-colors ${
                      selectedChapter?.id === ch.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {ch.number}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : content ? (
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a book and chapter to read.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
