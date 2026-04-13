/**
 * One-time script: discover KJV, AMP, and NLT Bible IDs from API.Bible,
 * then insert them into the Supabase `approved_bibles` table.
 *
 * Usage:  node scripts/seed-bibles.cjs
 *
 * Reads API_BIBLE_KEY, NEXT_PUBLIC_SUPABASE_URL, and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local in the project root.
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

const API_BIBLE_KEY = env.API_BIBLE_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!API_BIBLE_KEY) {
  console.error("ERROR: API_BIBLE_KEY is not set in .env.local");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Targets — abbreviations we want to match (case-insensitive)
// ---------------------------------------------------------------------------
const TARGETS = [
  { abbr: "KJV", fullName: "King James Version" },
  { abbr: "AMP", fullName: "Amplified Bible" },
  { abbr: "NLT", fullName: "New Living Translation" },
];

// ---------------------------------------------------------------------------
// 3. Discover Bible IDs from API.Bible
// ---------------------------------------------------------------------------
async function discoverBibles() {
  console.log("Fetching Bible list from API.Bible …");

  const res = await fetch("https://api.scripture.api.bible/v1/bibles", {
    headers: { "api-key": API_BIBLE_KEY },
  });

  if (!res.ok) {
    console.error("API.Bible returned", res.status, await res.text());
    process.exit(1);
  }

  const json = await res.json();
  const allBibles = json.data || [];
  console.log(`  ${allBibles.length} Bible(s) available on your key.\n`);

  const matched = [];

  for (const target of TARGETS) {
    // Prefer exact abbreviation match in English; fall back to name contains
    const exact = allBibles.find(
      (b) =>
        b.abbreviationLocal?.toUpperCase() === target.abbr.toUpperCase() &&
        b.language?.id === "eng",
    );

    const fallback =
      exact ||
      allBibles.find(
        (b) =>
          (b.abbreviation?.toUpperCase() === target.abbr.toUpperCase() ||
            b.nameLocal?.includes(target.fullName) ||
            b.name?.includes(target.fullName)) &&
          b.language?.id === "eng",
      );

    if (fallback) {
      matched.push({
        name: fallback.nameLocal || fallback.name,
        abbreviation: fallback.abbreviationLocal || fallback.abbreviation || target.abbr,
        api_bible_id: fallback.id,
      });
      console.log(
        `  FOUND  ${target.abbr}  →  id=${fallback.id}  name="${fallback.nameLocal || fallback.name}"`,
      );
    } else {
      console.log(
        `  MISS   ${target.abbr}  — not available on your API key / plan`,
      );
    }
  }

  return matched;
}

// ---------------------------------------------------------------------------
// 4. Insert into Supabase via REST (no SDK needed)
// ---------------------------------------------------------------------------
async function insertIntoSupabase(bibles) {
  if (bibles.length === 0) {
    console.log("\nNo Bibles to insert.");
    return;
  }

  console.log(`\nInserting ${bibles.length} Bible(s) into approved_bibles …`);

  const rows = bibles.map((b) => ({
    name: b.name,
    abbreviation: b.abbreviation,
    api_bible_id: b.api_bible_id,
    is_active: true,
  }));

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/approved_bibles`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(rows),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Supabase insert failed:", res.status, body);
    console.error(
      "\nIf you see an RLS error, you may need to run this SQL in the Supabase SQL Editor first:",
    );
    console.error(
      "  INSERT INTO public.user_roles (user_id, role) VALUES ('<YOUR_USER_UUID>', 'staff');",
    );
    console.error(
      "Then sign in as that user before running this script, or temporarily",
    );
    console.error(
      "use the service_role key instead of the anon key.\n",
    );
    process.exit(1);
  }

  const inserted = await res.json();
  console.log(`  Inserted ${inserted.length} row(s):\n`);
  inserted.forEach((row) => {
    console.log(
      `    ${row.abbreviation}  →  id=${row.id}  api_bible_id=${row.api_bible_id}`,
    );
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const bibles = await discoverBibles();
  await insertIntoSupabase(bibles);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
