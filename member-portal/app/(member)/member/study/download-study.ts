"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StudyDownloadOptions = {
  /** Specific session IDs to include. If empty, include all. */
  sessionIds?: string[];
  /** ISO date string — only include content updated/created on or after this date */
  dateFrom?: string;
  /** ISO date string — only include content updated/created on or before this date */
  dateTo?: string;
};

export async function buildStudyExport(opts: StudyDownloadOptions = {}): Promise<{
  ok: true;
  text: string;
  filename: string;
} | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { sessionIds = [], dateFrom, dateTo } = opts;
  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [
    "=== Living Word Memphis — My Study Export ===",
    `Exported: ${exportDate}`,
    "",
  ];

  // ── Study Sessions (AI Chat) ──────────────────────────────────────────────
  let sessionsQuery = supabase
    .from("study_sessions")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (sessionIds.length > 0) {
    sessionsQuery = sessionsQuery.in("id", sessionIds);
  }
  if (dateFrom) sessionsQuery = sessionsQuery.gte("updated_at", dateFrom);
  if (dateTo) sessionsQuery = sessionsQuery.lte("updated_at", dateTo);

  const { data: sessions, error: sessErr } = await sessionsQuery;
  if (sessErr) return { ok: false, error: sessErr.message };

  lines.push(divider("STUDY SESSIONS (AI Chat)"));

  if (!sessions || sessions.length === 0) {
    lines.push("  (no sessions)", "");
  } else {
    for (const session of sessions) {
      const updatedLabel = new Date(session.updated_at).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      );
      lines.push(`[Session: "${session.title}"] — Updated ${updatedLabel}`);

      const { data: messages } = await supabase
        .from("study_messages")
        .select("role, content, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (!messages || messages.length === 0) {
        lines.push("  (empty session)", "");
        continue;
      }

      for (const msg of messages) {
        const label = msg.role === "user" ? "  You" : "  Assistant";
        const wrapped = msg.content
          .split("\n")
          .map((l: string, i: number) => (i === 0 ? `${label}: ${l}` : `          ${l}`))
          .join("\n");
        lines.push(wrapped);
      }
      lines.push("");
    }
  }

  // ── Study Notes ───────────────────────────────────────────────────────────
  let notesQuery = supabase
    .from("study_notes")
    .select("title, content, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (dateFrom) notesQuery = notesQuery.gte("updated_at", dateFrom);
  if (dateTo) notesQuery = notesQuery.lte("updated_at", dateTo);

  const { data: notes } = await notesQuery;

  lines.push(divider("MY NOTES"));

  if (!notes || notes.length === 0) {
    lines.push("  (no notes)", "");
  } else {
    for (const note of notes) {
      const d = new Date(note.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      lines.push(`[${note.title}] — ${d}`);
      lines.push(...note.content.split("\n").map((l: string) => `  ${l}`));
      lines.push("");
    }
  }

  // ── Saved Scriptures ──────────────────────────────────────────────────────
  let scripturesQuery = supabase
    .from("study_saved_scriptures")
    .select("reference, verse_text, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (dateFrom) scripturesQuery = scripturesQuery.gte("created_at", dateFrom);
  if (dateTo) scripturesQuery = scripturesQuery.lte("created_at", dateTo);

  const { data: scriptures } = await scripturesQuery;

  lines.push(divider("SAVED SCRIPTURES"));

  if (!scriptures || scriptures.length === 0) {
    lines.push("  (no saved scriptures)", "");
  } else {
    for (const s of scriptures) {
      const d = new Date(s.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      lines.push(`${s.reference} — Saved ${d}`);
      lines.push(`  "${s.verse_text}"`);
      if (s.note) lines.push(`  My note: ${s.note}`);
      lines.push("");
    }
  }

  // ── Bible Notes ───────────────────────────────────────────────────────────
  type VerseRow = {
    chapter: number;
    verse: number;
    text: string;
    book: { name: string; book_number: number; translation: { abbreviation: string } };
  };

  lines.push(divider("BIBLE NOTES"));

  // Paginate through all bible notes
  const PAGE_SIZE = 100;
  let bibFrom = 0;
  let bibTotal = Infinity;
  let bibNoteCount = 0;

  while (bibFrom < bibTotal) {
    let bibQuery = supabase
      .from("user_verse_notes")
      .select(
        `content, updated_at, verse_id,
         verse:bible_verses!inner(
           chapter, verse, text,
           book:bible_books!inner(
             name, book_number,
             translation:bible_translations!inner(abbreviation)
           )
         )`,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(bibFrom, bibFrom + PAGE_SIZE - 1);

    if (dateFrom) bibQuery = bibQuery.gte("updated_at", dateFrom);
    if (dateTo) bibQuery = bibQuery.lte("updated_at", dateTo);

    const { data: bibNotes, count } = await bibQuery;

    if (count !== null) bibTotal = count;
    if (!bibNotes || bibNotes.length === 0) break;

    for (const n of bibNotes) {
      const v = n.verse as unknown as VerseRow;
      const ref = `${v.book.name} ${v.chapter}:${v.verse} (${v.book.translation.abbreviation})`;
      const d = new Date(n.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      lines.push(`${ref} — Updated ${d}`);
      lines.push(`  "${v.text}"`);
      lines.push(`  My note: ${n.content}`);
      lines.push("");
      bibNoteCount++;
    }

    bibFrom += PAGE_SIZE;
  }

  if (bibNoteCount === 0) {
    lines.push("  (no Bible notes)", "");
  }

  const text = lines.join("\n");
  const safeDate = new Date().toISOString().slice(0, 10);
  const filename = `lwm-study-export-${safeDate}.txt`;

  return { ok: true, text, filename };
}

/** Fetch just the session list for the picker (no messages) */
export async function loadSessionsForPicker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, sessions: data ?? [] };
}

function divider(title: string) {
  const line = "─".repeat(60);
  return `\n${line}\n${title}\n${line}\n`;
}
