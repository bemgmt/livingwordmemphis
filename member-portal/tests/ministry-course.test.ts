import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { fixture } from "./ministry.test";
import type { PGlite } from "@electric-sql/pglite";
const student = "22222222-2222-4222-8222-222222222222",
  admin = "11111111-1111-4111-8111-111111111111",
  teacher = "44444444-4444-4444-8444-444444444444",
  other = "33333333-3333-4333-8333-333333333333";
const assessment = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  document = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
async function as(db: PGlite, id: string) {
  await db.exec(
    `set role authenticated;select set_config('test.uid','${id}',false)`,
  );
}
async function cmd(
  db: PGlite,
  action: string,
  payload: unknown,
  course = true,
) {
  return (
    await db.query<{ result: { id: string; saved_at: string } }>(
      `select public.${course ? "ministry_course_command" : "ministry_command"}($1,$2::jsonb) result`,
      [action, JSON.stringify(payload)],
    )
  ).rows[0].result;
}
async function setup() {
  const db = await fixture();
  await db.exec(
    await readFile(
      "../supabase/migrations/20261113030758_ministry_library_and_workbooks.sql",
      "utf8",
    ),
  );
  await db.exec(`insert into som_library(id,offering_id,title,category,audience,state) values('${document}','2027-prophets','Manual','manual','student','available');
 insert into ministry_private.library_files(document_id,path,mime,size) values('${document}','library/manual.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',100);
 insert into som_content(id,offering_id,kind,title,published,data) values('${assessment}','2027-prophets','assignment','Workbook chapter 1',true,'{"unit_id":"2027-prophets-chapter-01","grading_mode":"completion","max_points":1}');
 insert into som_units(id,offering_id,kind,number,title,state,source_version,assignment_id,chapters) values('2027-prophets-chapter-01','2027-prophets','chapter',1,'The call','available','source-v1','${assessment}',array[1]);
 insert into ministry_private.unit_content(unit_id,reading,instructions,fields) values('2027-prophets-chapter-01','Approved manual reading','Answer from Scripture','[{"id":"q1","label":"Explain the call","type":"written","required":true}]');
 insert into som_instructors values('2027-prophets','${teacher}');`);
  await as(db, student);
  const e = await cmd(
    db,
    "request_enrollment",
    { offering_id: "2027-prophets", accepted: true },
    false,
  );
  await as(db, admin);
  await cmd(
    db,
    "tuition",
    { enrollment_id: e.id, semester: "spring", kind: "payment", cents: -50000 },
    false,
  );
  await cmd(db, "enrollment", { id: e.id, status: "approved" }, false);
  return db;
}
test("workbook saves, submit retries, frozen questions and authorized revisions preserve the academic record", async () => {
  const db = await setup();
  try {
    await as(db, student);
    const w = await cmd(db, "workbook_save", {
      assessment_id: assessment,
      answers: { q1: "My response" },
    });
    await assert.rejects(
      cmd(db, "workbook_save", {
        assessment_id: assessment,
        answers: { q1: "Stale update" },
      }),
      /newer draft/,
    );
    const retry = await cmd(db, "workbook_save", {
      assessment_id: assessment,
      answers: { q1: "My response" },
    });
    assert.equal(retry.id, w.id);
    await assert.rejects(
      cmd(db, "workbook_save", {
        assessment_id: assessment,
        expected_saved_at: w.saved_at,
        answers: { unknown: "Bad question" },
      }),
      /Unknown/,
    );
    await cmd(db, "workbook_submit", {
      assessment_id: assessment,
      expected_saved_at: w.saved_at,
      answers: { q1: "My response" },
    });
    assert.equal(
      (
        await cmd(db, "workbook_submit", {
          assessment_id: assessment,
          answers: { q1: "My response" },
        })
      ).id,
      w.id,
    );
    await assert.rejects(
      cmd(
        db,
        "save_work",
        { assessment_id: assessment, answers: { q1: "Changed" } },
        false,
      ),
      /read-only/,
    );
    await assert.rejects(
      cmd(db, "workbook_revision", { id: w.id }),
      /instructor/,
    );
    await as(db, teacher);
    await assert.rejects(
      cmd(db, "grade", { id: w.id, score: 1, released: true }, false),
      /completion feedback/,
    );
    await cmd(db, "workbook_grade", {
      id: w.id,
      completion_status: "revision_required",
      feedback: "Use the passage in context",
      released: false,
    });
    await as(db, student);
    assert.equal((await db.query("select * from som_grades")).rows.length, 0);
    await as(db, teacher);
    await cmd(db, "workbook_grade", {
      id: w.id,
      completion_status: "revision_required",
      feedback: "Use the passage in context",
      released: true,
    });
    const revision = await cmd(db, "workbook_revision", { id: w.id });
    assert.notEqual(revision.id, w.id);
    await as(db, student);
    const rows = (
      await db.query<{
        assessment_snapshot: { source_version: string };
        answers: { q1: string };
        status: string;
      }>("select * from som_work order by attempt")
    ).rows;
    assert.equal(rows.length, 2);
    assert.equal(rows[0].status, "submitted");
    assert.equal(rows[1].answers.q1, "My response");
    assert.equal(rows[1].assessment_snapshot.source_version, "source-v1");
    assert.equal(
      (await db.query<{ score: number | null }>("select score from som_grades"))
        .rows[0].score,
      null,
    );
  } finally {
    await db.close();
  }
});
test("library, placeholders and confidential admissions records enforce school and role boundaries", async () => {
  const db = await setup();
  try {
    await as(db, other);
    assert.equal((await db.query("select * from som_library")).rows.length, 0);
    await assert.rejects(
      db.query("select ministry_unit_detail('2027-prophets-chapter-01')"),
      /not available/,
    );
    await as(db, student);
    assert.equal((await db.query("select * from som_library")).rows.length, 1);
    const application = await cmd(db, "record_save", {
      offering_id: "2027-prophets",
      kind: "application",
      status: "submitted",
      data: { answers: { reason: "To learn" } },
    });
    await assert.rejects(
      cmd(db, "record_save", {
        id: application.id,
        offering_id: "2027-prophets",
        kind: "application",
        status: "draft",
        data: { reason: "Changed" },
      }),
      /submitted/,
    );
    await assert.rejects(
      cmd(db, "record_save", {
        offering_id: "2027-prophets",
        user_id: other,
        kind: "application",
        status: "draft",
        data: {},
      }),
      /enrollment|cannot change/,
    );
    await as(db, admin);
    await cmd(db, "record_save", {
      offering_id: "2027-prophets",
      user_id: student,
      kind: "reference",
      status: "complete",
      data: { notes: "Private reference" },
    });
    await as(db, teacher);
    assert.equal((await db.query("select * from som_records")).rows.length, 0);
    await as(db, student);
    assert.equal((await db.query("select * from som_records")).rows.length, 1);
    await db.exec("reset role");
    await db.exec(
      "update som_units set state='review_required' where id='2027-prophets-chapter-01';update som_content set published=false",
    );
    await as(db, student);
    await assert.rejects(
      cmd(db, "workbook_save", {
        assessment_id: assessment,
        answers: { q1: "Try" },
      }),
      /released workbook/,
    );
    const detail = (
      await db.query<{ result: { fields: unknown[] } }>(
        "select ministry_unit_detail('2027-prophets-chapter-01') result",
      )
    ).rows[0].result;
    assert.equal(detail.fields.length, 0);
  } finally {
    await db.close();
  }
});

test("document replacements require verified uploads and explicit publication; original sources remain in history", async () => {
  const db = await setup();
  try {
    await as(db, student);
    await assert.rejects(
      cmd(db, "library_prepare", {
        document_id: document,
        filename: "manual.pdf",
        size: 100,
        mime: "application/pdf",
      }),
      /editor/,
    );
    await as(db, admin);
    const upload = await cmd(db, "library_prepare", {
      document_id: document,
      filename: "manual.pdf",
      size: 100,
      mime: "application/pdf",
    });
    await assert.rejects(
      cmd(db, "library_publish", { id: upload.id }),
      /verified/,
    );
    await db.exec("reset role");
    const file = (
      await db.query<{ path: string }>(
        "select path from ministry_private.library_pending_files where id=$1",
        [upload.id],
      )
    ).rows[0];
    await db.query(
      'insert into storage.objects(bucket_id,name,metadata) values(\'ministry-curriculum\',$1,\'{"size":100,"mimetype":"application/pdf"}\')',
      [file.path],
    );
    await as(db, admin);
    await cmd(db, "library_finish", {
      id: upload.id,
      source_hash: "verified-source",
    });
    const before = (
      await db.query<{ result: { path: string } }>(
        "select ministry_library_file($1) result",
        [document],
      )
    ).rows[0].result;
    assert.equal(before.path, "library/manual.docx");
    await cmd(db, "library_publish", { id: upload.id });
    const after = (
      await db.query<{ result: { path: string } }>(
        "select ministry_library_file($1) result",
        [document],
      )
    ).rows[0].result;
    assert.equal(after.path, file.path);
    await db.exec("reset role");
    assert.equal(
      (await db.query("select * from ministry_private.library_versions")).rows
        .length,
      1,
    );
    await as(db, other);
    await assert.rejects(
      db.query("select ministry_library_file($1)", [document]),
      /unavailable/,
    );
  } finally {
    await db.close();
  }
});

test("publishing revised questions keeps a student's earlier assignment version and record correction history", async () => {
  const db = await setup();
  try {
    await as(db, student);
    const w = await cmd(db, "workbook_save", {
      assessment_id: assessment,
      answers: { q1: "Original response" },
    });
    await cmd(db, "workbook_submit", {
      assessment_id: assessment,
      expected_saved_at: w.saved_at,
      answers: { q1: "Original response" },
    });
    const app = await cmd(db, "record_save", {
      offering_id: "2027-prophets",
      kind: "application",
      status: "submitted",
      data: { answers: { reason: "To learn" } },
    });
    await as(db, admin);
    await cmd(db, "unit_save_draft", {
      unit_id: "2027-prophets-chapter-01",
      data: {
        title: "Revised chapter",
        reading: "Revised reading",
        instructions: "Revised guidance",
        fields: [
          {
            id: "q2",
            label: "A revised question",
            type: "written",
            required: false,
          },
        ],
      },
    });
    await cmd(db, "unit_publish", { unit_id: "2027-prophets-chapter-01" });
    await cmd(db, "record_save", {
      id: app.id,
      offering_id: "2027-prophets",
      user_id: student,
      kind: "application",
      status: "revision_required",
      data: { notes: "Please add more detail" },
    });
    await as(db, teacher);
    await cmd(db, "workbook_revision", { id: w.id });
    await assert.rejects(
      db.query("select ministry_record_versions($1)", [app.id]),
      /unavailable/,
    );
    await as(db, student);
    const works = (
      await db.query<{
        assessment_snapshot: { fields: { id: string }[] };
        answers: { q1: string };
      }>("select * from som_work order by attempt")
    ).rows;
    assert.equal(works.length, 2);
    assert.equal(works[1].assessment_snapshot.fields[0].id, "q1");
    assert.equal(works[1].answers.q1, "Original response");
    const history = (
      await db.query<{ result: { status: string }[] }>(
        "select ministry_record_versions($1) result",
        [app.id],
      )
    ).rows[0].result;
    assert.equal(history.length, 1);
    assert.equal(history[0].status, "submitted");
  } finally {
    await db.close();
  }
});
