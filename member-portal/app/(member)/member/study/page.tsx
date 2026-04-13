import { requireAuth } from "@/lib/supabase/auth-helpers";

import { StudyTabs } from "./study-tabs";

export default async function MemberStudyPage() {
  const { supabase, user } = await requireAuth();

  const [
    { data: sessions },
    { data: studyNotes },
    { data: savedScriptures },
    bibleNotesResult,
  ] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("study_notes")
      .select("id, title, content, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("study_saved_scriptures")
      .select("id, verse_id, reference, verse_text, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_verse_notes")
      .select(
        `
        id, content, updated_at, verse_id,
        verse:bible_verses!inner(
          chapter, verse, text,
          book:bible_books!inner(
            name, book_number,
            translation:bible_translations!inner(abbreviation)
          )
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(0, 19),
  ]);

  type VerseRow = {
    chapter: number;
    verse: number;
    text: string;
    book: {
      name: string;
      book_number: number;
      translation: { abbreviation: string };
    };
  };

  const bibleNotes = (bibleNotesResult.data ?? []).map((n) => {
    const v = n.verse as unknown as VerseRow;
    return {
      id: n.id,
      content: n.content,
      updated_at: n.updated_at,
      verse_id: n.verse_id,
      reference: `${v.book.name} ${v.chapter}:${v.verse} (${v.book.translation.abbreviation})`,
      verse_text: v.text,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Study assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Research Bible topics, save scriptures, and organize your study notes.
        </p>
      </div>
      <StudyTabs
        sessions={sessions ?? []}
        studyNotes={studyNotes ?? []}
        savedScriptures={savedScriptures ?? []}
        bibleNotes={bibleNotes}
        bibleNotesTotal={bibleNotesResult.count ?? 0}
      />
    </div>
  );
}
