import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  MEETINGS,
  nextMeeting,
  TUITION,
  gradeSummary,
  chicagoInputToIso,
  chicagoInputValue,
} from "../lib/ministry/program";
const admin = "11111111-1111-4111-8111-111111111111",
  student = "22222222-2222-4222-8222-222222222222",
  other = "33333333-3333-4333-8333-333333333333",
  teacher = "44444444-4444-4444-8444-444444444444";
export async function fixture() {
  const db = new PGlite();
  await db.exec(`create role authenticated;create role anon;create role service_role;
 create schema auth;create schema storage;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''test.uid'',true),'''')::uuid';
 create function auth.jwt() returns jsonb language sql stable as 'select coalesce(nullif(current_setting(''test.jwt'',true),''''),''{}'')::jsonb';
 create table public.user_roles(user_id uuid,role text);create table public.profiles(id uuid primary key,display_name text);
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to authenticated,anon;
 grant select,insert,update,delete on storage.objects to authenticated;
 insert into auth.users values('${admin}'),('${student}'),('${other}'),('${teacher}');
 insert into public.profiles select id,'Synthetic test member' from auth.users;
 insert into public.user_roles values('${admin}','executive');`);
  await db.exec(
    await readFile(
      "../supabase/migrations/20261111215112_school_of_ministry.sql",
      "utf8",
    ),
  );
  return db;
}
async function as(db: PGlite, id: string) {
  await db.exec(
    `set role authenticated;select set_config('test.uid','${id}',false);`,
  );
}
async function command(db: PGlite, action: string, payload: unknown = {}) {
  return (
    await db.query<{ result: { id: string } }>(
      "select public.ministry_command($1,$2::jsonb) result",
      [action, JSON.stringify(payload)],
    )
  ).rows[0].result;
}
test("official calendar, Chicago boundaries, chapter coverage, and tuition", () => {
  assert.equal(
    MEETINGS.filter((m) => m.kind === "instruction" && m.semester === "spring")
      .length,
    14,
  );
  assert.equal(
    MEETINGS.filter((m) => m.kind === "instruction" && m.semester === "fall")
      .length,
    13,
  );
  assert.equal(MEETINGS.filter((m) => m.kind === "exam").length, 2);
  assert.equal(MEETINGS.filter((m) => m.kind === "orientation").length, 1);
  assert.deepEqual(
    MEETINGS.flatMap((m) => m.chapters),
    Array.from({ length: 45 }, (_, i) => i + 1),
  );
  for (const m of MEETINGS)
    assert.equal(new Date(m.date + "T12:00:00Z").getUTCDay(), 2);
  assert.equal(
    TUITION.reduce((n, t) => n + t.cents, 0),
    67500,
  );
  assert.equal(
    nextMeeting(new Date("2027-05-05T12:00:00Z"))?.date,
    "2027-08-24",
  );
  assert.equal(nextMeeting(new Date("2027-12-08T12:00:00Z")), null);
  assert.deepEqual(
    gradeSummary([
      { score: 8, max_points: 10 },
      { score: null, max_points: 50 },
      { score: 0, max_points: 10 },
    ]),
    { earned: 8, possible: 20, percentage: 40 },
  );
  assert.equal(
    chicagoInputToIso("2027-01-19T18:30"),
    "2027-01-20T00:30:00.000Z",
  );
  assert.equal(
    chicagoInputToIso("2027-08-24T18:30"),
    "2027-08-24T23:30:00.000Z",
  );
  assert.equal(chicagoInputValue("2027-08-24T23:30:00Z"), "2027-08-24T18:30");
  assert.throws(() => chicagoInputToIso("2027-03-14T02:30"), /does not exist/);
});
test("exams keep keys private, score saved answers at closure, preserve retakes and block delivery-mode changes", async () => {
  const db = await fixture();
  try {
    await as(db, admin);
    await command(db, "grant_enrollment", {
      offering_id: "2027-prophets",
      user_id: student,
    });
    await command(db, "instructor", {
      offering_id: "2027-prophets",
      user_id: teacher,
    });
    const now = Date.now(),
      data = {
        semester: "spring",
        mode: "online",
        max_points: 10,
        opens_at: new Date(now - 60000).toISOString(),
        closes_at: new Date(now + 60000).toISOString(),
        questions: [
          {
            id: "one",
            type: "multiple-choice",
            prompt: "Choose the correct answer",
            options: ["A", "B"],
            points: 4,
          },
          { id: "two", type: "written", prompt: "Explain", points: 6 },
        ],
        answer_key: { one: "B" },
      };
    const exam = await command(db, "save_content", {
      offering_id: "2027-prophets",
      kind: "exam",
      title: "Spring examination",
      data,
      published: true,
    });
    await as(db, student);
    const visible = await db.query<{ data: object }>(
      "select data from som_content where id=$1",
      [exam.id],
    );
    assert.ok(!JSON.stringify(visible.rows).includes("answer_key"));
    await assert.rejects(
      db.exec("select * from ministry_private.answer_keys"),
      /permission denied/,
    );
    const attempt = await command(db, "save_work", {
      assessment_id: exam.id,
      answers: { one: "B", two: "Saved explanation" },
    });
    await as(db, admin);
    await command(db, "exam_window", {
      id: exam.id,
      opens_at: new Date(now - 120000).toISOString(),
      closes_at: new Date(now - 1000).toISOString(),
    });
    await db.exec("select public.ministry_finalize_exams()");
    const graded = await db.query<{ score: number }>(
      "select score from som_grades where work_id=$1",
      [attempt.id],
    );
    assert.equal(Number(graded.rows[0].score), 4);
    await as(db, student);
    const after = await command(db, "save_work", {
      assessment_id: exam.id,
      answers: { one: "A", two: "Too late" },
    });
    assert.equal((after as unknown as { closed: boolean }).closed, true);
    assert.equal(
      (
        await db.query<{ answers: { one: string } }>(
          "select answers from som_work where id=$1",
          [attempt.id],
        )
      ).rows[0].answers.one,
      "B",
    );
    assert.equal((await db.query("select * from som_grades")).rows.length, 0);
    await as(db, teacher);
    await command(db, "retake", { id: attempt.id });
    await assert.rejects(
      command(db, "retake", { id: attempt.id }),
      /newer attempt/,
    );
    await command(db, "exam_window", {
      id: exam.id,
      opens_at: new Date(now - 60000).toISOString(),
      closes_at: new Date(now + 60000).toISOString(),
    });
    await as(db, student);
    await command(db, "submit_work", {
      assessment_id: exam.id,
      answers: { one: "A" },
    });
    assert.equal((await db.query("select * from som_work")).rows.length, 2);
    await as(db, admin);
    await assert.rejects(
      command(db, "save_content", {
        id: exam.id,
        offering_id: "2027-prophets",
        kind: "exam",
        title: "Changed",
        data: { ...data, mode: "in-person" },
      }),
      /locked/,
    );
    await command(db, "grant_enrollment", {
      offering_id: "2027-pastor",
      user_id: student,
    });
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "select sum(cents)::integer balance from som_ledger",
        )
      ).rows[0].balance,
      67500,
    );
  } finally {
    await db.close();
  }
});
test("enrollment gating, cross-school isolation, draft privacy, tuition and completion", async () => {
  const db = await fixture();
  try {
    await as(db, student);
    const enrolled = await command(db, "request_enrollment", {
      offering_id: "2027-prophets",
      accepted: true,
    });
    await assert.rejects(
      command(db, "request_enrollment", {
        offering_id: "2027-pastor",
        accepted: true,
      }),
      /unique/,
    );
    await assert.rejects(
      command(db, "enrollment", { id: enrolled.id, status: "approved" }),
      /administrator/,
    );
    await as(db, admin);
    await command(db, "enrollment", { id: enrolled.id, status: "approved" });
    await command(db, "instructor", {
      offering_id: "2027-prophets",
      user_id: teacher,
    });
    const draft = await command(db, "save_content", {
      offering_id: "2027-prophets",
      kind: "draft",
      title: "Private draft",
      data: { body: "unreleased" },
    });
    const lesson = await command(db, "publish_lesson", { id: draft.id });
    await command(db, "save_content", {
      id: draft.id,
      offering_id: "2027-prophets",
      kind: "draft",
      title: "Changed draft",
      data: { body: "new secret", published_id: lesson.id },
    });
    await as(db, student);
    const contents = await db.query<{ kind: string; data: { body: string } }>(
      "select kind,data from som_content",
    );
    assert.equal(contents.rows.length, 1);
    assert.equal(contents.rows[0].data.body, "unreleased");
    assert.equal((await db.query("select * from som_ledger")).rows.length, 2);
    await assert.rejects(
      db.exec("update som_enrollments set status='approved'"),
      /permission denied/,
    );
    await as(db, other);
    assert.equal((await db.query("select * from som_content")).rows.length, 0);
    assert.equal((await db.query("select * from som_ledger")).rows.length, 0);
    await as(db, teacher);
    assert.equal((await db.query("select * from som_ledger")).rows.length, 0);
    await assert.rejects(
      command(db, "instructor", {
        offering_id: "2027-pastor",
        user_id: teacher,
      }),
      /administrator/,
    );
    await as(db, admin);
    await command(db, "enrollment", { id: enrolled.id, status: "completed" });
    await as(db, student);
    assert.equal((await db.query("select * from som_content")).rows.length, 1);
    await assert.rejects(
      command(db, "progress", {
        offering_id: "2027-prophets",
        chapter: 1,
        done: true,
      }),
      /active enrollment/,
    );
    await as(db, admin);
    await command(db, "enrollment", { id: enrolled.id, status: "suspended" });
    await as(db, student);
    assert.equal((await db.query("select * from som_content")).rows.length, 0);
  } finally {
    await db.close();
  }
});
test("assignment retries, unreleased grades, instructor boundaries and immutable tuition corrections", async () => {
  const db = await fixture();
  try {
    await as(db, admin);
    const e = await command(db, "grant_enrollment", {
      offering_id: "2027-prophets",
      user_id: student,
    });
    await command(db, "instructor", {
      offering_id: "2027-prophets",
      user_id: teacher,
    });
    const a = await command(db, "save_content", {
      offering_id: "2027-prophets",
      kind: "assignment",
      title: "Reflection",
      published: true,
      data: {
        max_points: 10,
        semester: "spring",
        due_at: "2020-01-01T12:00:00Z",
      },
    });
    await as(db, student);
    const w = await command(db, "save_work", {
      assessment_id: a.id,
      response: "My reflection",
    });
    await command(db, "submit_work", {
      assessment_id: a.id,
      response: "My reflection",
    });
    const retry = await command(db, "submit_work", { assessment_id: a.id });
    assert.equal(retry.id, w.id);
    assert.equal(
      (await db.query<{ late: boolean }>("select late from som_work")).rows[0]
        .late,
      true,
    );
    await assert.rejects(
      command(db, "save_work", { assessment_id: a.id, response: "changed" }),
      /read-only/,
    );
    await as(db, teacher);
    await command(db, "grade", {
      id: w.id,
      score: 8,
      feedback: "Good work",
      released: false,
    });
    await assert.rejects(
      command(db, "save_content", {
        offering_id: "2027-pastor",
        kind: "assignment",
        title: "No",
        data: { max_points: 10 },
      }),
      /instructor/,
    );
    await as(db, student);
    assert.equal((await db.query("select * from som_grades")).rows.length, 0);
    await as(db, teacher);
    await command(db, "grade", {
      id: w.id,
      score: 8,
      feedback: "Good work",
      released: true,
    });
    await assert.rejects(
      command(db, "attendance", {
        offering_id: "2027-prophets",
        meeting_id: "2027-03-09",
        user_id: student,
        status: "absent",
      }),
      /Attendance/,
    );
    await as(db, student);
    assert.equal((await db.query("select * from som_grades")).rows.length, 1);
    await as(db, admin);
    await command(db, "tuition", {
      enrollment_id: e.id,
      semester: "spring",
      kind: "payment",
      cents: -10000,
      description: "Payment recorded",
    });
    await command(db, "tuition", {
      enrollment_id: e.id,
      semester: "spring",
      kind: "correction",
      cents: 10000,
      description: "Correction of test entry",
    });
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "select sum(cents)::integer balance from som_ledger",
        )
      ).rows[0].balance,
      67500,
    );
    assert.equal(
      (await db.query<{ status: string }>("select status from som_enrollments"))
        .rows[0].status,
      "approved",
    );
  } finally {
    await db.close();
  }
});
