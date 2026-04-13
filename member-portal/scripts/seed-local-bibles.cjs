/**
 * Import local Bible JSON files into Supabase bible_translations/books/verses.
 *
 * Usage:  node scripts/seed-local-bibles.cjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Uses the service-role key to bypass RLS for bulk inserts.
 *
 * JSON files expected in ../bibles/EN-English/ with shape:
 *   { metadata: { name, shortname, module, year }, verses: [{ book_name, book, chapter, verse, text }] }
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// 1. Parse .env.local
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local not found at", envPath);
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, "utf-8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  });

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ---------------------------------------------------------------------------
// 2. Bible files to import (plain text first, then Strong's as updates)
// ---------------------------------------------------------------------------
const BIBLES_DIR = path.resolve(__dirname, "..", "..", "bibles", "EN-English");

const PLAIN_FILES = [
  { file: "kjv.json", module: "kjv" },
  { file: "asv.json", module: "asv" },
];

const STRONGS_FILES = [
  { file: "kjv_strongs.json", module: "kjv" },
  { file: "asvs.json", module: "asv" },
];

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------
function stripStrongs(text) {
  return text
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function supabasePost(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${table} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function supabasePatch(table, match, updates) {
  const params = Object.entries(match)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join("&");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${table} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function supabaseSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 4. Import a plain-text Bible
// ---------------------------------------------------------------------------
async function importPlainBible({ file, module }) {
  const filePath = path.join(BIBLES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${file} — not found`);
    return;
  }

  console.log(`\n  Importing ${file} …`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const meta = data.metadata;
  const verses = data.verses;

  // Insert translation
  const [translation] = await supabasePost("bible_translations", [
    {
      name: meta.name,
      abbreviation: meta.shortname,
      module,
      year: meta.year || null,
      has_strongs: false,
      is_active: true,
    },
  ]);
  console.log(`    Translation: ${translation.abbreviation} (${translation.id})`);

  // Derive books
  const bookMap = new Map();
  for (const v of verses) {
    if (!bookMap.has(v.book)) {
      bookMap.set(v.book, {
        book_number: v.book,
        name: v.book_name,
        maxChapter: v.chapter,
      });
    } else {
      const entry = bookMap.get(v.book);
      if (v.chapter > entry.maxChapter) entry.maxChapter = v.chapter;
    }
  }

  const bookRows = [...bookMap.values()].map((b) => ({
    translation_id: translation.id,
    book_number: b.book_number,
    name: b.name,
    testament: b.book_number <= 39 ? "OT" : "NT",
    chapter_count: b.maxChapter,
  }));

  const insertedBooks = await supabasePost("bible_books", bookRows);
  console.log(`    Books: ${insertedBooks.length}`);

  // Build book_number -> book id lookup
  const bookIdMap = {};
  for (const b of insertedBooks) {
    bookIdMap[b.book_number] = b.id;
  }

  // Insert verses in batches
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < verses.length; i += BATCH) {
    const batch = verses.slice(i, i + BATCH).map((v) => ({
      book_id: bookIdMap[v.book],
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
    }));
    await supabasePost("bible_verses", batch);
    inserted += batch.length;
    if (inserted % 5000 === 0 || inserted === verses.length) {
      console.log(`    Verses: ${inserted}/${verses.length}`);
    }
  }

  return translation;
}

// ---------------------------------------------------------------------------
// 5. Update existing translation with Strong's data
// ---------------------------------------------------------------------------
async function importStrongsUpdate({ file, module }) {
  const filePath = path.join(BIBLES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${file} — not found`);
    return;
  }

  console.log(`\n  Adding Strong's from ${file} to module "${module}" …`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const verses = data.verses;

  // Find existing translation
  const translations = await supabaseSelect(
    "bible_translations",
    `module=eq.${module}&select=id`,
  );
  if (!translations.length) {
    console.log(`    ERROR: translation "${module}" not found — skipping`);
    return;
  }
  const translationId = translations[0].id;

  // Mark translation as having Strong's
  await supabasePatch("bible_translations", { id: translationId }, { has_strongs: true });

  // Load book id map
  const books = await supabaseSelect(
    "bible_books",
    `translation_id=eq.${translationId}&select=id,book_number`,
  );
  const bookIdMap = {};
  for (const b of books) bookIdMap[b.book_number] = b.id;

  // Update verses with text_with_strongs in batches via individual PATCHes
  // For performance we use the composite unique key (book_id, chapter, verse)
  let updated = 0;
  const BATCH = 100;
  for (let i = 0; i < verses.length; i += BATCH) {
    const batch = verses.slice(i, i + BATCH);
    const promises = batch.map((v) => {
      const bookId = bookIdMap[v.book];
      if (!bookId) return Promise.resolve();
      return supabasePatch(
        "bible_verses",
        { book_id: bookId, chapter: v.chapter, verse: v.verse },
        { text_with_strongs: v.text },
      ).catch((err) => {
        // Some Strong's files have slightly different verse counts
        console.log(`    WARN: ${v.book_name} ${v.chapter}:${v.verse} — ${err.message.substring(0, 80)}`);
      });
    });
    await Promise.all(promises);
    updated += batch.length;
    if (updated % 5000 === 0 || updated === verses.length) {
      console.log(`    Strong's updated: ${updated}/${verses.length}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Collect and report unique Strong's codes
// ---------------------------------------------------------------------------
function collectStrongsCodes() {
  const codes = new Set();
  for (const { file } of STRONGS_FILES) {
    const filePath = path.join(BIBLES_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    for (const v of data.verses) {
      const matches = v.text.match(/\{H\d+\}|\{G\d+\}/g);
      if (matches) {
        matches.forEach((m) => codes.add(m.replace(/[{}]/g, "")));
      }
    }
  }
  return codes;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Local Bible Seed ===\n");
  console.log("Supabase URL:", SUPABASE_URL);

  // Import plain text bibles
  for (const entry of PLAIN_FILES) {
    await importPlainBible(entry);
  }

  // Add Strong's data
  for (const entry of STRONGS_FILES) {
    await importStrongsUpdate(entry);
  }

  // Report Strong's codes for definition import
  const codes = collectStrongsCodes();
  const hCodes = [...codes].filter((c) => c.startsWith("H"));
  const gCodes = [...codes].filter((c) => c.startsWith("G"));
  console.log(
    `\n  Strong's codes found: ${codes.size} total (${hCodes.length} Hebrew, ${gCodes.length} Greek)`,
  );
  console.log(
    "  Run seed-strongs.cjs next to import definitions.\n",
  );

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
