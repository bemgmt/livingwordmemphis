"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export async function getTranslations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bible_translations")
    .select("id, name, abbreviation, module, has_strongs")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getBooks(translationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bible_books")
    .select("id, book_number, name, testament, chapter_count")
    .eq("translation_id", translationId)
    .order("book_number");
  return data ?? [];
}

export async function getChapterVerses(bookId: string, chapter: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: verses } = await supabase
    .from("bible_verses")
    .select("id, chapter, verse, text, text_with_strongs")
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .order("verse");

  if (!verses?.length) return { verses: [], highlights: {}, notes: {} };

  const verseIds = verses.map((v) => v.id);

  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase
      .from("user_verse_highlights")
      .select("verse_id, color")
      .eq("user_id", user.id)
      .in("verse_id", verseIds),
    supabase
      .from("user_verse_notes")
      .select("id, verse_id, content, updated_at")
      .eq("user_id", user.id)
      .in("verse_id", verseIds),
  ]);

  const highlightMap: Record<string, string> = {};
  for (const h of highlights ?? []) {
    highlightMap[h.verse_id] = h.color;
  }

  const noteMap: Record<
    string,
    { id: string; content: string; updated_at: string }
  > = {};
  for (const n of notes ?? []) {
    noteMap[n.verse_id] = {
      id: n.id,
      content: n.content,
      updated_at: n.updated_at,
    };
  }

  return { verses, highlights: highlightMap, notes: noteMap };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchBible(query: string, translationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_bible", {
    p_query: query,
    p_translation_id: translationId,
    p_limit: 25,
  });
  if (error) return [];
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

export async function toggleHighlight(verseId: string, color: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  if (!color) {
    await supabase
      .from("user_verse_highlights")
      .delete()
      .eq("user_id", user.id)
      .eq("verse_id", verseId);
    return { ok: true as const, color: null };
  }

  const { error } = await supabase.from("user_verse_highlights").upsert(
    { user_id: user.id, verse_id: verseId, color },
    { onConflict: "user_id,verse_id" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, color };
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function saveNote(verseId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const trimmed = content.trim();
  if (!trimmed)
    return { ok: false as const, error: "Note cannot be empty." };

  const { data: existing } = await supabase
    .from("user_verse_notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("verse_id", verseId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_verse_notes")
      .update({ content: trimmed })
      .eq("id", existing.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, noteId: existing.id };
  }

  const { data, error } = await supabase
    .from("user_verse_notes")
    .insert({ user_id: user.id, verse_id: verseId, content: trimmed })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, noteId: data.id };
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("user_verse_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Share verse to bulletin or group
// ---------------------------------------------------------------------------

export async function shareVerse(
  verseId: string,
  target: "bulletin" | "group",
  groupId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch verse details with book info
  const { data: verse } = await supabase
    .from("bible_verses")
    .select(
      `
      id, chapter, verse, text,
      book:bible_books!inner(name, translation:bible_translations!inner(abbreviation))
    `,
    )
    .eq("id", verseId)
    .single();

  if (!verse) return { ok: false as const, error: "Verse not found." };

  const book = verse.book as unknown as {
    name: string;
    translation: { abbreviation: string };
  };
  const reference = `${book.name} ${verse.chapter}:${verse.verse} (${book.translation.abbreviation})`;
  const title = `Scripture: ${reference}`;
  const body = `"${verse.text}"\n\n— ${reference}`;

  if (target === "bulletin") {
    const { error } = await supabase.from("bulletin_posts").insert({
      author_id: user.id,
      title,
      body,
    });
    if (error) return { ok: false as const, error: error.message };
    revalidatePath("/member/bulletin");
    return { ok: true as const };
  }

  if (target === "group" && groupId) {
    const { error } = await supabase.from("forum_topics").insert({
      author_id: user.id,
      title,
      body,
    });
    if (error) return { ok: false as const, error: error.message };
    revalidatePath("/member/forum");
    return { ok: true as const };
  }

  return { ok: false as const, error: "Invalid share target." };
}

// ---------------------------------------------------------------------------
// Strong's lookup
// ---------------------------------------------------------------------------

export async function getStrongsDefinition(strongsId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("strongs_definitions")
    .select("*")
    .eq("id", strongsId)
    .maybeSingle();
  return data;
}

export async function getStrongsDefinitions(strongsIds: string[]) {
  if (!strongsIds.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("strongs_definitions")
    .select("*")
    .in("id", strongsIds);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Reading position
// ---------------------------------------------------------------------------

export async function saveReadingPosition(
  translationId: string,
  bookId: string,
  chapter: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_reading_positions").upsert(
    {
      user_id: user.id,
      translation_id: translationId,
      book_id: bookId,
      chapter,
    },
    { onConflict: "user_id,translation_id" },
  );
}

export async function getReadingPosition(translationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_reading_positions")
    .select(
      "book_id, chapter, book:bible_books!inner(name, book_number)",
    )
    .eq("user_id", user.id)
    .eq("translation_id", translationId)
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// User's groups (for share dialog)
// ---------------------------------------------------------------------------

export async function getUserGroups() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("group_members")
    .select("group:groups!inner(id, name)")
    .eq("user_id", user.id);

  return (
    data?.map((d) => {
      const g = d.group as unknown as { id: string; name: string };
      return { id: g.id, name: g.name };
    }) ?? []
  );
}
