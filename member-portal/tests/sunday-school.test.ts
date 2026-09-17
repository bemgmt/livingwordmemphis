import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { SCHOOL_CLASSES, schoolMonths, sundayDates, validateLesson, rolesCanUploadSundaySchool } from "../lib/sunday-school";
import { readSchoolTicket, signSchoolTicket, type SchoolUploadTicket } from "../lib/sunday-school-ticket";

test("October starts with four classes and correct Sunday weeks; months roll forward without losing archives", () => {
  assert.deepEqual(SCHOOL_CLASSES.map(c => c.label), ["Adult", "High School", "Middle School", "Elementary"]);
  assert.deepEqual(sundayDates("2026-10"), ["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"]);
  assert.equal(sundayDates("2026-11").length, 5);
  assert.deepEqual(schoolMonths([], new Date("2026-09-16T12:00:00Z")), ["2026-10"]);
  assert.deepEqual(schoolMonths(["2027-02", "bad"], new Date("2027-01-15T12:00:00Z")), ["2027-02", "2027-01", "2026-12", "2026-11", "2026-10"]);
});
test("lesson input rejects wrong classes, months and mismatched or non-Sunday dates", () => {
  const input = { title: "Lesson one", month: "2026-10", classGroup: "adult", lessonDate: "2026-10-04", description: "" };
  assert.deepEqual(validateLesson(input), input);
  for (const change of [{ month: "2026-09" }, { month: "2026-13" }, { lessonDate: "2026-10-05" }, { lessonDate: "2026-11-01" }, { classGroup: "other" }, { title: "" }]) assert.throws(() => validateLesson({ ...input, ...change }));
  assert.equal(rolesCanUploadSundaySchool(["member"]), false);
  assert.equal(rolesCanUploadSundaySchool(["youth_ministry", "youth_minister"]), false);
  assert.equal(rolesCanUploadSundaySchool(["sunday_school_teacher"]), true);
  assert.equal(rolesCanUploadSundaySchool(["executive"]), true);
});
test("publication ticket cannot be altered, replayed by another teacher or used after expiry", () => {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-not-a-real-key";
  try {
    const value: SchoolUploadTicket = { id: "test", userId: "teacher-a", storagePath: "teacher-a/file.pdf", filename: "file.pdf", contentType: "application/pdf", size: 100, expiresAt: Date.now() + 60000, title: "Lesson", month: "2026-10", classGroup: "adult", lessonDate: "2026-10-04", description: "" };
    const token = signSchoolTicket(value);
    assert.deepEqual(readSchoolTicket(token, "teacher-a"), value);
    assert.throws(() => readSchoolTicket(token, "teacher-b"));
    const [payload, signature] = token.split(".");
    const altered = JSON.parse(Buffer.from(payload, "base64url").toString());
    altered.storagePath = "someone-else/file.pdf";
    assert.throws(() => readSchoolTicket(`${Buffer.from(JSON.stringify(altered)).toString("base64url")}.${signature}`, "teacher-a"));
    assert.throws(() => readSchoolTicket(signSchoolTicket({ ...value, expiresAt: Date.now() - 1000 }), "teacher-a"));
  } finally { if (previous === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previous; }
});
test("Storage allows member downloads and teacher uploads, blocks anonymous users, self-elevation and overwrites", async () => {
  const db = new PGlite();
  const teacher = "11111111-1111-4111-8111-111111111111";
  const member = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`create role authenticated; create role anon;
      create schema auth; create schema storage;
      create type public.app_role as enum ('member','staff','executive','apostle');
      create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''test.uid'',true),'''')::uuid';
      create function auth.jwt() returns jsonb language sql stable as 'select coalesce(nullif(current_setting(''test.jwt'',true),''''),''{}'')::jsonb';
      create table public.user_roles(user_id uuid,role public.app_role);
      create function public.has_any_role(roles public.app_role[]) returns boolean language sql stable as 'select exists(select 1 from user_roles where user_id=auth.uid() and role=any(roles))';
      create function public.is_staff_or_above() returns boolean language sql stable as 'select public.has_any_role(array[''staff'',''executive'',''apostle'']::public.app_role[])';
      create function storage.foldername(name text) returns text[] language sql immutable as 'select string_to_array(name,''/'')';
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema auth,storage to authenticated,anon;
      grant select on public.user_roles to authenticated;
      grant select,insert,update,delete on storage.objects to authenticated,anon;`);
    await db.exec(await readFile("../supabase/migrations/20260917011234_sunday_school_teacher_role.sql", "utf8"));
    await db.exec(await readFile("../supabase/migrations/20260917011239_sunday_school_curriculum_storage.sql", "utf8"));
    await db.exec(`insert into user_roles values ('${teacher}','sunday_school_teacher'),('${member}','member'); set role authenticated; select set_config('test.uid','${teacher}',false);`);
    await db.query("insert into storage.objects values ('sunday-school-curriculum',$1)", [`${teacher}/lesson.pdf`]);
    await assert.rejects(db.query("insert into storage.objects values ('sunday-school-curriculum',$1)", [`${member}/forged.pdf`]), /row-level security/);
    assert.equal((await db.query("update storage.objects set name='changed' returning *")).rows.length, 0);
    await db.exec(`select set_config('test.uid','${member}',false);`);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 1);
    await assert.rejects(db.query("insert into storage.objects values ('sunday-school-curriculum',$1)", [`${member}/lesson.pdf`]), /row-level security/);
    await assert.rejects(db.query("insert into user_roles values ($1,'sunday_school_teacher')", [member]), /permission denied/);
    await db.exec(`select set_config('test.jwt','{"is_anonymous":true}',false);`);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    await db.exec("set role anon");
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
  } finally { await db.close(); }
});
