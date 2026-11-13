"use strict";
// Private administrative importer. No source text is bundled into the web application.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const args = process.argv.slice(2),
  value = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const bundlePath = path.resolve(
  value("--bundle", ".ministry-import/bundle.json"),
);
const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const allowed = ["apostles", "prophets", "evangelist", "pastor", "teacher"];
if (
  bundle.schema_version !== 1 ||
  bundle.schools.length !== 5 ||
  bundle.schools.some((s) => !allowed.includes(s))
)
  throw Error("Only the five approved schools may be imported.");
for (const unit of bundle.units)
  if (!allowed.some((s) => unit.offering_id === "2027-" + s))
    throw Error("Unapproved school in import.");
const summary = {
  schools: bundle.schools,
  documents: bundle.documents.length,
  chapters: bundle.units.filter((u) => u.kind === "chapter").length,
  assignments: bundle.assignments.filter((a) => a.published).length,
  held: bundle.reconciliation.map((r) => r.chapter),
  missing: bundle.documents.filter((d) => d.state === "missing").length,
};
if (!args.includes("--apply")) {
  console.log(
    JSON.stringify(
      {
        preview: summary,
        instruction:
          "Use --apply with --local or --production after reviewing the private preview.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw Error("Set the intended project URL and server-only service key.");
const local = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(url);
let config;
if (args.includes("--local")) {
  if (!local)
    throw Error("Local imports require an isolated localhost project.");
  const stack = process.env.MINISTRY_TEST_STACK || "lwm-youth-forms-test";
  if (!/^[a-z0-9-]+-test$/.test(stack))
    throw Error("Use a named local -test stack.");
  const container = JSON.parse(
    execFileSync("docker", ["inspect", "supabase_db_" + stack], {
      encoding: "utf8",
    }),
  )[0];
  const env = Object.fromEntries(
    container.Config.Env.map((v) => {
      const i = v.indexOf("=");
      return [v.slice(0, i), v.slice(i + 1)];
    }),
  );
  const port =
    process.env.MINISTRY_TEST_DB_PORT ||
    container.NetworkSettings.Ports["5432/tcp"]?.[0]?.HostPort;
  if (!port) throw Error("Local database port unavailable.");
  config = {
    host: "127.0.0.1",
    port: Number(port),
    user: "postgres",
    database: "postgres",
    password: env.POSTGRES_PASSWORD,
  };
} else if (args.includes("--production")) {
  const ref = value("--project-ref", "");
  if (!ref || new URL(url).hostname !== ref + ".supabase.co")
    throw Error("Confirm the exact production project ref.");
  const connection = new URL(process.env.POSTGRES_URL_NON_POOLING || "");
  if (
    !connection.username.includes(ref) &&
    connection.hostname !== "db." + ref + ".supabase.co"
  )
    throw Error("Database does not match the intended project.");
  connection.searchParams.delete("sslmode");
  config = {
    connectionString: connection.toString(),
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(value("--ca", ""), "utf8"),
    },
  };
} else throw Error("Choose --local or --production explicitly.");
const db = new Client(config),
  storage = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const check = (r) => {
  if (r.error) throw Error(r.error.message);
  return r.data;
};
async function insert(table, row, conflict = "id", update = false) {
  const keys = Object.keys(row);
  if (!/^[a-z_.]+$/.test(table) || keys.some((k) => !/^[a-z_]+$/.test(k)))
    throw Error("Unsafe import identifier");
  const params = keys.map((k) =>
    Array.isArray(row[k]) && k !== "chapters"
      ? JSON.stringify(row[k])
      : row[k] && typeof row[k] === "object" && !Array.isArray(row[k])
        ? JSON.stringify(row[k])
        : row[k],
  );
  const suffix = update
    ? "do update set " +
      keys
        .filter((k) => k !== conflict)
        .map((k) => k + "=excluded." + k)
        .join(",")
    : "do nothing";
  await db.query(
    `insert into ${table}(${keys.join(",")}) values(${keys.map((_, i) => "$" + (i + 1)).join(",")}) on conflict(${conflict}) ${suffix}`,
    params,
  );
}
(async () => {
  await db.connect();
  const present = await db.query(
    "select to_regclass('public.som_units') as units",
  );
  if (!present.rows[0].units)
    throw Error("Apply the library/workbook migration before importing.");
  const bucket = check(await storage.storage.getBucket("ministry-curriculum"));
  if (bucket.public) throw Error("Curriculum storage must remain private.");
  for (const file of bundle.files) {
    const raw = fs.readFileSync(
      path.resolve(path.dirname(bundlePath), file.local_file),
    );
    if (
      crypto.createHash("sha256").update(raw).digest("hex") !==
      bundle.documents.find((d) => d.id === file.document_id).source_hash
    )
      throw Error("Source hash changed.");
    let existing = await storage.storage.from(file.bucket).info(file.path);
    if (existing.error) {
      const r = await storage.storage
        .from(file.bucket)
        .upload(file.path, raw, { contentType: file.mime, upsert: false });
      if (r.error)
        throw Error(
          "Source upload failed (" + file.local_file + "): " + r.error.message,
        );
      existing = await storage.storage.from(file.bucket).info(file.path);
    }
    const info = check(existing);
    if (info.size !== file.size || info.contentType !== file.mime)
      throw Error("Stored source verification failed.");
  }
  await db.query("begin");
  try {
    for (const d of bundle.documents) {
      const old = (
        await db.query(
          "select state,source_hash from public.som_library where id=$1",
          [d.id],
        )
      ).rows[0];
      if (!old) await insert("public.som_library", d);
      else if (old.state === "missing" && d.state === "available")
        await insert("public.som_library", d, "id", true);
    }
    for (const file of bundle.files) {
      const { local_file, ...row } = file;
      await insert("ministry_private.library_files", row, "document_id");
    }
    let created = 0,
      preserved = 0;
    for (const unit of bundle.units) {
      const old = (
        await db.query("select state from public.som_units where id=$1", [
          unit.id,
        ])
      ).rows[0];
      const body = bundle.bodies.find((b) => b.unit_id === unit.id);
      if (old) {
        // Never overwrite editor-published questions, student work, or academic records.
        if (body.reading)
          await db.query(
            "update ministry_private.unit_content set reading=$2 where unit_id=$1 and reading='' ",
            [unit.id, body.reading],
          );
        preserved++;
        continue;
      }
      const assessment = bundle.assignments.find(
        (a) => a.id === unit.assignment_id,
      );
      if (assessment) await insert("public.som_content", assessment);
      await insert("public.som_units", unit);
      await insert("ministry_private.unit_content", body, "unit_id");
      created++;
    }
    await db.query("commit");
    console.log(
      JSON.stringify(
        {
          imported: summary,
          created_units: created,
          preserved_units: preserved,
          student_records_changed: 0,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
  await db.end();
})().catch(async (e) => {
  console.error(e.message);
  try {
    await db.end();
  } catch {}
  process.exit(1);
});
