import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PDFDocument } from "pdf-lib";
import { normalizeAnswers, TERMS, FORM_VERSION, childStatus, type Child, type Submission } from "../lib/youth-forms/schema";
import { renderSignedForm, validateArchiveText } from "../lib/youth-forms/pdf";

const guardian = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const childId = "33333333-3333-4333-8333-333333333333";
export const answers = normalizeAnswers({ childName: "Alex García", birthday: "2024-03-15", guardianName: "Jordan García", phone: "901-555-0100", hasAllergies: "Yes", allergies: ["Peanuts"], allergyDetails: "Peanut allergy. Contact parent immediately if a concern arises.", hasNeeds: "No", feeding: ["Solid foods"], feedingInstructions: "Food provided by parent.", foodsToAvoid: "Peanuts", preferences: ["Quiet activities"], movement: ["Walks independently"], comforts: ["Lovey/blanket"], temperament: "Prefers a quiet introduction.", contactPermission: "Yes", remainOnPremises: "Yes", bestContact: "901-555-0100", notes: "Synthetic QA record; not a real child." }, true);
const submission: Submission = { id: "44444444-4444-4444-8444-444444444444", child_id: childId, guardian_id: guardian, revision: 1, form_version: FORM_VERSION, answers, terms: TERMS, signature_name: "Jordan García", signer_email: "guardian@example.test", signed_at: "2026-09-12T18:30:00.000Z", status: "pending", storage_path: null, pdf_sha256: null, archived_at: null };

test("validation rejects missing emergency information, invalid dates and non-consent; drafts remain possible", () => {
  assert.doesNotThrow(() => normalizeAnswers({ childName: "Alex" }));
  assert.throws(() => normalizeAnswers({ ...answers, allergyDetails: "" }, true), /Allergy details/);
  assert.throws(() => normalizeAnswers({ ...answers, hasNeeds: "Yes" }, true), /Medical, developmental/);
  assert.throws(() => normalizeAnswers({ ...answers, birthday: "2024-02-30" }, true), /birthday/);
  assert.throws(() => normalizeAnswers({ ...answers, birthday: "2999-01-01" }, true), /birthday/);
  assert.throws(() => normalizeAnswers({ ...answers, remainOnPremises: "No" }, true), /acknowledgments/);
  assert.throws(() => normalizeAnswers({ ...answers, allergies: ["injected"] }, true));
  assert.throws(() => normalizeAnswers({ ...answers, guardianName: 5 }, true));
  const clean = normalizeAnswers({ ...answers, hasAllergies: "No", guardian_id: other }, true);
  assert.equal(clean.allergyDetails, undefined);
  assert.equal(clean.guardian_id, undefined);
});

test("PDF preserves Unicode, multiple pages, signature and frozen schema; rejects unsupported glyphs before signing", async () => {
  await mkdir("test-results/youth-forms", { recursive: true });
  const bytes = await renderSignedForm(submission);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 3);
  assert.equal(pdf.getForm().getFields().length, 0);
  await writeFile("test-results/youth-forms/signed-sample.pdf", bytes);
  const long = { ...submission, answers: { ...answers, notes: "Long care notes with wrapping. ".repeat(65), temperament: "x".repeat(2000) } };
  const stress = await renderSignedForm(long);
  assert.ok((await PDFDocument.load(stress)).getPageCount() > pdf.getPageCount());
  await writeFile("test-results/youth-forms/signed-long-sample.pdf", stress);
  await assert.rejects(validateArchiveText({ childName: "Alex 🦄" }, "Jordan"), /cannot display/);
});

test("status distinguishes missing, draft, pending archive, completed and later revisions", () => {
  const child = { id: childId, draft: {}, revision: 0 } as Child;
  assert.equal(childStatus(child, []), "Missing");
  assert.equal(childStatus({ ...child, draft: answers, revision: 1 }, []), "Draft");
  assert.equal(childStatus({ ...child, draft: answers, revision: 1 }, [submission]), "Archive pending");
  assert.equal(childStatus({ ...child, draft: answers, revision: 1 }, [{ ...submission, status: "completed" }]), "Completed");
  assert.equal(childStatus({ ...child, draft: answers, revision: 2 }, [{ ...submission, status: "completed" }]), "Draft");
});

test("database migration enforces family isolation, service-only writes, idempotency and immutable signed records", async () => {
  const db = new PGlite();
  try {
    // Minimal local equivalents of Supabase-owned schemas. No external database.
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      create function public.is_executive_or_apostle() returns boolean language sql stable as 'select coalesce(current_setting(''test.archive_admin'',true),'''') = ''true''';
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema auth,storage to authenticated,service_role;
      grant select on auth.users to service_role;
      grant select,insert,update,delete on storage.objects to authenticated,service_role;
      insert into auth.users values ('${guardian}'),('${other}');`);
    await db.exec(await readFile("../supabase/migrations/20260912215627_youth_registration_archives.sql", "utf8"));
    await db.query("insert into youth_children(id,guardian_id,display_name,draft,revision) values ($1,$2,'Alex',$3,1)", [childId, guardian, JSON.stringify(answers)]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${guardian}',false);`);
    assert.equal((await db.query("select * from youth_children")).rows.length, 1);
    await assert.rejects(db.query("update youth_children set guardian_id=$1", [other]), /permission denied/);
    await assert.rejects(db.query("insert into youth_form_submissions default values"), /permission denied/);
    await assert.rejects(db.query("select freeze_youth_form($1,$2,1,'v1','{}','Jordan','a@example.test')", [childId, guardian]), /permission denied/);
    await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
    assert.equal((await db.query("select * from youth_children")).rows.length, 0);
    await db.exec("select set_config('test.archive_admin','true',false)");
    assert.equal((await db.query("select * from youth_children")).rows.length, 1);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from youth_children"), /permission denied/);
    await db.exec("set role service_role");
    await assert.rejects(db.query("select freeze_youth_form($1,$2,2,'v1',$3,'Jordan','a@example.test')", [childId, guardian, JSON.stringify(TERMS)]), /Draft changed/);
    await assert.rejects(db.query("select freeze_youth_form($1,$2,1,'v1',$3,'Jordan','a@example.test')", [childId, other, JSON.stringify(TERMS)]), /Child not found/);
    const freeze = () => db.query<{ id: string }>("select (freeze_youth_form($1,$2,1,'v1',$3,'Jordan','a@example.test')).*", [childId, guardian, JSON.stringify(TERMS)]);
    const first = (await freeze()).rows[0];
    const repeat = (await freeze()).rows[0];
    assert.equal(first.id, repeat.id);
    assert.equal((await db.query("select * from youth_form_submissions")).rows.length, 1);
    await assert.rejects(db.query("update youth_form_submissions set signature_name='Someone Else' where id=$1", [first.id]), /immutable/);
    await assert.rejects(db.query("update youth_form_submissions set status='completed' where id=$1", [first.id]), /check constraint/);
    await db.query("insert into storage.objects(bucket_id,name) values ('youth-signed-forms','test.pdf')");
    await db.query("update youth_form_submissions set status='completed',storage_path='test.pdf',pdf_sha256=repeat('a',64),archived_at=now() where id=$1", [first.id]);
    await assert.rejects(db.query("update youth_form_submissions set signature_name='Someone Else' where id=$1", [first.id]), /immutable/);
    await assert.rejects(db.query("delete from youth_form_submissions where id=$1", [first.id]), /cannot be deleted/);
    await db.exec(`set role authenticated; select set_config('test.archive_admin','false',false); select set_config('request.jwt.claim.sub','${other}',false);`);
    assert.equal((await db.query("select * from youth_form_submissions")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    await db.exec(`select set_config('request.jwt.claim.sub','${guardian}',false);`);
    assert.equal((await db.query("select * from youth_form_submissions")).rows.length, 1);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 1);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('youth-signed-forms','forged.pdf')"), /row-level security/);
    assert.equal((await db.query("update storage.objects set name='changed.pdf' returning *")).rows.length, 0);
    assert.equal((await db.query("delete from storage.objects returning *")).rows.length, 0);
  } finally { await db.close(); }
});
