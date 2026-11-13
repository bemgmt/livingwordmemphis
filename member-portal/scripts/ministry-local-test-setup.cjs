"use strict";
// Local Docker test stack only. This script never reads production credentials.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const stack = process.env.MINISTRY_TEST_STACK || "lwm-youth-forms-test";
if (!/^[a-z0-9-]+-test$/.test(stack))
  throw new Error("Use a named local -test stack.");
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" });
const auth = JSON.parse(docker("inspect", `supabase_auth_${stack}`))[0];
const env = Object.fromEntries(
  auth.Config.Env.map((value) => {
    const i = value.indexOf("=");
    return [value.slice(0, i), value.slice(i + 1)];
  }),
);
const secret = env.GOTRUE_JWT_SECRET;
if (!secret) throw new Error("Local test signing configuration not found.");
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const token = (role) => {
  const h = encode({ alg: "HS256", typ: "JWT" });
  const p = encode({
    iss: "supabase",
    role,
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 86400,
  });
  return `${h}.${p}.${crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url")}`;
};
const kong = JSON.parse(docker("inspect", `supabase_kong_${stack}`))[0];
const port = process.env.MINISTRY_TEST_API_PORT || kong.NetworkSettings.Ports["8000/tcp"]?.[0]?.HostPort;
if (!port || !/^\d+$/.test(port)) throw new Error("Local API port not found.");
fs.writeFileSync(
  path.resolve(__dirname, "../.env.ministry-test"),
  [
    `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${port}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${token("anon")}`,
    `SUPABASE_SERVICE_ROLE_KEY=${token("service_role")}`,
    "NEXT_PUBLIC_SANITY_PROJECT_ID=localtest",
    "NEXT_PUBLIC_SANITY_DATASET=production",
    "CRON_SECRET=local-ministry-cron-test-only",
    "",
  ].join("\n"),
);
if (process.argv.includes("--migrate") || process.argv.includes("--refresh")) {
  const sql = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../supabase/migrations/20261111215112_school_of_ministry.sql",
    ),
    "utf8",
  );
  const tuitionSql = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../supabase/migrations/20261111230218_ministry_tuition_and_approval.sql",
    ),
    "utf8",
  );
  const statements = process.argv.includes("--migrate")
    ? sql + "\n" + tuitionSql
    : [...sql.matchAll(/create function[\s\S]+?\$\$;/g)]
        .map((m) =>
          m[0].replace("create function", "create or replace function"),
        )
        .join("\n") +
      "\n" +
      sql
        .split("\n")
        .filter((line) => /^(revoke|grant) /.test(line))
        .join("\n") +
      "\nNOTIFY pgrst, 'reload schema';";
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${stack}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "--single-transaction",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: statements, stdio: ["pipe", "pipe", "pipe"] },
  );
}
if (process.argv.includes("--upgrade")) {
  const applied = docker(
    "exec",
    `supabase_db_${stack}`,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-Atc",
    "select exists(select 1 from information_schema.columns where table_schema='public' and table_name='som_enrollments' and column_name='first_approved_at')",
  );
  if (applied.trim() !== "t") {
    const sql = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../supabase/migrations/20261111230218_ministry_tuition_and_approval.sql",
      ),
      "utf8",
    );
    execFileSync(
      "docker",
      [
        "exec",
        "-i",
        `supabase_db_${stack}`,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "--single-transaction",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { input: sql, stdio: ["pipe", "pipe", "pipe"] },
    );
  }
}
console.log(
  "Prepared isolated local school test configuration. Credentials were not printed; production files were not modified.",
);
if (process.argv.includes("--course")) {
  const applied=docker("exec",`supabase_db_${stack}`,"psql","-U","postgres","-d","postgres","-Atc","select to_regclass('public.som_units') is not null");
  if(applied.trim()!=="t"){
    const sql=fs.readFileSync(path.resolve(__dirname,"../../supabase/migrations/20261113030758_ministry_library_and_workbooks.sql"),"utf8");
    execFileSync("docker",["exec","-i",`supabase_db_${stack}`,"psql","-U","postgres","-d","postgres","--single-transaction","-v","ON_ERROR_STOP=1"],{input:sql,stdio:["pipe","pipe","pipe"]});
  }
}
