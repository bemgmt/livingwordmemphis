"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Study sessions
// ---------------------------------------------------------------------------

export async function createStudySession(title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: user.id, title: title || "New Study" })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const, sessionId: data.id };
}

export async function loadSessionMessages(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session)
    return { ok: false as const, error: "Session not found." };

  const { data, error } = await supabase
    .from("study_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, messages: data ?? [] };
}

export async function deleteStudySession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { ok: false as const, error: error.message };
  if (!data?.length)
    return { ok: false as const, error: "Session not found or not yours." };

  revalidatePath("/member/study");
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Study notes (sermon notes, free-form)
// ---------------------------------------------------------------------------

export async function createStudyNote(title: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const trimmedContent = content.trim();
  if (!trimmedContent)
    return { ok: false as const, error: "Note content cannot be empty." };

  const { data, error } = await supabase
    .from("study_notes")
    .insert({
      user_id: user.id,
      title: title.trim() || "Untitled Note",
      content: trimmedContent,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const, noteId: data.id };
}

export async function updateStudyNote(
  noteId: string,
  data: { title?: string; content?: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const updates: Record<string, string> = {};
  if (data.title !== undefined) updates.title = data.title.trim() || "Untitled Note";
  if (data.content !== undefined) {
    const trimmed = data.content.trim();
    if (!trimmed)
      return { ok: false as const, error: "Note content cannot be empty." };
    updates.content = trimmed;
  }

  const { error } = await supabase
    .from("study_notes")
    .update(updates)
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const };
}

export async function deleteStudyNote(noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("study_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const };
}

export async function loadStudyNotes() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_notes")
    .select("id, title, content, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, notes: data ?? [] };
}

// ---------------------------------------------------------------------------
// Saved scriptures (shared from Bible reader)
// ---------------------------------------------------------------------------

export async function loadSavedScriptures() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_saved_scriptures")
    .select("id, verse_id, reference, verse_text, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, scriptures: data ?? [] };
}

export async function deleteSavedScripture(scriptureId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("study_saved_scriptures")
    .delete()
    .eq("id", scriptureId)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/member/study");
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Bible notes aggregation (all user_verse_notes with references)
// ---------------------------------------------------------------------------

export async function loadAllBibleNotes(page = 1, pageSize = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
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
    .range(from, to);

  if (error) return { ok: false as const, error: error.message };

  type VerseRow = {
    chapter: number;
    verse: number;
    text: string;
    book: { name: string; book_number: number; translation: { abbreviation: string } };
  };

  const notes = (data ?? []).map((n) => {
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

  return {
    ok: true as const,
    notes,
    total: count ?? 0,
    page,
    pageSize,
  };
}
