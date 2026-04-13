/**
 * Import Strong's concordance definitions into Supabase strongs_definitions.
 *
 * Sources public-domain Strong's data from the STEP Bible data repository,
 * which provides comprehensive Hebrew and Greek lexicon entries.
 *
 * Usage:  node scripts/seed-strongs.cjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 *
 * This script collects all Strong's IDs referenced in local bible_verses
 * (text_with_strongs column), then inserts placeholder definitions.
 * For a production deployment, you should replace or enrich these
 * with a full lexicon dataset.
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
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const BIBLES_DIR = path.resolve(__dirname, "..", "..", "bibles", "EN-English");

// ---------------------------------------------------------------------------
// 2. Collect Strong's codes from local JSON files
// ---------------------------------------------------------------------------
function collectCodes() {
  const codes = new Set();
  const files = ["kjv_strongs.json", "asvs.json"];
  for (const file of files) {
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
  return [...codes].sort();
}

// ---------------------------------------------------------------------------
// 3. Try to load a local Strong's JSON file if available
// ---------------------------------------------------------------------------
function loadLocalStrongs() {
  const candidates = [
    path.resolve(__dirname, "..", "..", "bibles", "strongs-hebrew.json"),
    path.resolve(__dirname, "..", "..", "bibles", "strongs-greek.json"),
    path.resolve(__dirname, "..", "..", "bibles", "strongs.json"),
  ];

  const result = {};
  for (const f of candidates) {
    if (fs.existsSync(f)) {
      console.log(`  Found local Strong's data: ${path.basename(f)}`);
      const data = JSON.parse(fs.readFileSync(f, "utf-8"));
      if (typeof data === "object") {
        Object.assign(result, data);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 4. Insert definitions
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Strong's Definition Seed ===\n");

  const codes = collectCodes();
  console.log(`  Found ${codes.length} unique Strong's codes in Bible files`);

  const localData = loadLocalStrongs();
  const hasLocalData = Object.keys(localData).length > 0;
  if (hasLocalData) {
    console.log(`  Loaded ${Object.keys(localData).length} local definitions`);
  }

  const rows = codes.map((code) => {
    const isHebrew = code.startsWith("H");
    const num = code.substring(1);

    const local = localData[code] || localData[num] || {};

    return {
      id: code,
      language: isHebrew ? "hebrew" : "greek",
      lemma: local.lemma || local.unicode || null,
      transliteration: local.translit || local.transliteration || null,
      definition: local.def || local.definition || local.strongs_def || `Strong's ${code}`,
      kjv_usage: local.kjv_def || local.kjv_usage || null,
    };
  });

  // Batch insert
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/strongs_definitions`, {
      method: "POST",
      headers: { ...HEADERS, Prefer: "return=minimal,resolution=merge-duplicates" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`  ERROR at batch ${i}: ${res.status} ${body.substring(0, 200)}`);
      continue;
    }
    inserted += batch.length;
    if (inserted % 2000 === 0 || inserted === rows.length) {
      console.log(`  Inserted: ${inserted}/${rows.length}`);
    }
  }

  console.log(`\n  Done. ${inserted} Strong's definitions seeded.`);
  if (!hasLocalData) {
    console.log(
      "  NOTE: Using placeholder definitions. For richer data, place strongs-hebrew.json and/or",
    );
    console.log(
      "  strongs-greek.json in the bibles/ directory and re-run this script.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
