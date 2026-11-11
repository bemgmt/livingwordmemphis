# School of Ministry · 2027

This is a separate, enrollment-gated learning system inside the existing member
portal. Sunday School and Youth Curriculum retain their existing access rules.

## Entrypoints and design

- Public overview: `/school-of-ministry`.
- Students and enrollment: `/member/school-of-ministry`.
- Assigned instructors: `/member/school-of-ministry/teach`.
- Executive/apostle administration: `/admin/school-of-ministry`.
- Existing staff curriculum editors: embedded Sanity `/admin/studio/ministry`.
- [Linked desktop/mobile wireframes](ministry-wireframes.html) cover enrollment,
  student dashboard, lessons, submissions, and grading. They are layout prototypes,
  not proof of implemented behavior.

The portal uses the existing Newsreader/Manrope typography, warm paper surfaces,
green actions, and existing member/admin shells. Mobile navigation wraps; weekly
content is progressively disclosed; academic records use individual student views
instead of wide gradebook tables.

## Academic source and content

`member-portal/lib/ministry/program.ts` contains the approved 2027 calendar and
weekly agenda. The migration seeds all five school offerings, 33 calendar events
(27 teaching meetings, two finals, three breaks, and orientation), and 135 private
weekly curriculum drafts. Only the Prophets drafts receive the supplied chapter
alignment. Every student has 45 chapter reading slots, independent of grades.

Orientation is separate from the 29 academic meetings. All wall-clock dates use
America/Chicago. There are no summer assignments seeded. Spring tuition is $500
due January 9, and fall tuition is $500 due August 14 ($1,000 annually). Additional school access
does not duplicate the primary program charge.

The Sanity `ministryProgram` document controls public introduction, school
descriptions, and calendar notes. The approved dates/fees are versioned in the
program source and database migration; changing the official schedule requires a
reviewed update to both. These are not inferred from public editorial prose.

Private content is authored through the Sanity Ministry curriculum tool. Its
authenticated API writes to Supabase rather than the public Sanity dataset. Editors
save a draft, attach files with a real file chooser, preview, and publish. A published
lesson is a separate snapshot, so subsequent private edits do not leak to students.
Published attachment references are refreshed on republishing. No storage paths or
MIME fields are part of the authoring UI.

The supplied source is an academic schedule, not complete teaching materials.
Editors must supply lesson titles/content, learning objectives, exercises, exams,
and actual files. Instructors and student enrollments must be assigned by staff.

## Security and data contracts

`GET /api/ministry` returns only records visible under the current user's RLS.
`POST /api/ministry` accepts `{action, payload}` and dispatches to the audited
`ministry_command` RPC. The server validates origin and file details. Every mutation
is authorized again inside Postgres; authenticated clients have no direct write
grants on school tables. The API uses the user's session, not a service role.

The private helper schema encapsulates role/enrollment lookups to avoid recursive
RLS. Its narrowly scoped SECURITY DEFINER functions use an empty search path,
qualified names, explicit execute grants, and current-user authorization. Exam
answer keys and administrative audit records have no client SELECT grants. The
separate answer-key RPC checks assigned-instructor/administrator access.

- Pending/declined/suspended/withdrawn enrollment does not grant curriculum access.
- Approved students can submit work; completed students can only read.
- Instructors are scoped by school assignment, with no general church admin grant.
- Executives/apostles manage enrollment, tuition, instructor assignment, and completion.
- Existing church staff editors publish curriculum but cannot read unrelated student
  work or tuition unless separately assigned/authorized.
- Tuition is an append-only ledger of charges, payments, waivers, and corrections.
  It never changes enrollment automatically. Descriptions are student-visible;
  private financial notes are not collected in this interface.
- Grades are separate from submissions and remain invisible to students until
  explicitly released. Missing work is not zero unless an instructor records zero.
- Only the latest authorized assessment attempt counts toward the student summary;
  older attempts remain available to instructors.

Files use private `ministry-curriculum` and `ministry-submissions` buckets. The
prepare/upload/verify sequence verifies actual object size and MIME before making
the attachment ready. Downloads check access and return 60-second signed URLs.
Previously issued signed URLs can remain usable until their short expiry even if
enrollment changes. Overwriting existing objects is not granted.

## Examinations

Online exams have an opening/closing window, one attempt, debounced serialized
autosave, and instructor-authorized retakes. Students see unsaved/network failure
states. Closing freezes the latest saved responses; late unsaved responses are not
accepted. Multiple-choice scoring runs on the server; written responses await an
instructor. Results remain unreleased until the instructor chooses to release them.

Questions and scoring are locked once attempts exist. Instructors can still adjust
the examination window or authorize another attempt. In-person exams use the same
assessment/gradebook but do not create a browser exam session or duplicate final.

`GET /api/ministry/finalize` requires `Authorization: Bearer <CRON_SECRET>` and is
scheduled every minute in `vercel.json`. It uses the server-only service key to
invoke the idempotent finalizer. The effective submission timestamp is the closing
time. Authenticated reads and student writes also reconcile overdue attempts, so
an interrupted client does not leave them writable. Verify minute-frequency cron
support for the target Vercel plan before release; do not silently remove the job.

## Isolated verification

### Payment-confirmed approvals

Tuition is $500 per semester ($1,000 annually). Pending primary applications
receive both semester charges immediately. Executive/apostle administrators use
the School of Ministry group on the leadership dashboard to review each school's
pending requests, record payments or authorized waivers, and approve students.
The database rejects initial approval until spring tuition is covered, including
direct API calls and attempts to grant a first school without applying.
Payment does not approve students automatically. Later balances and corrections
do not revoke approved access. Additional schools share the primary tuition
account and require that primary enrollment to be approved.

The follow-up migration preserves existing charges and payments, appends tuition
adjustments to the ledger, and preserves existing approved enrollments.
For an existing isolated local fixture stack, apply it once with:

```powershell
node scripts/ministry-local-test-setup.cjs --upgrade
```

Never point mutation tests at production. The browser suite fails immediately unless
the Supabase URL is `http://localhost:<port>` or `http://127.0.0.1:<port>`.

The current local Docker fixture stack is `lwm-youth-forms-test`, with API port
55421. It already contains the church's baseline auth/profile/role schema. Other
local stacks may be used through `MINISTRY_TEST_STACK` and must end in `-test`.

From `member-portal`:

```powershell
# First use only, after baseline church schema is present in the local test stack:
node scripts/ministry-local-test-setup.cjs --migrate
# Subsequent source-only function refinements in that same local fixture:
node scripts/ministry-local-test-setup.cjs --refresh
npm run test:ministry
npm run test:sunday-school
npm run test:youth-forms
npx tsc --noEmit
npx playwright test --config playwright.ministry.config.ts
```

The setup helper reads only named local Docker containers, generates ephemeral
local credentials into ignored `.env.ministry-test`, and never overwrites the
production `.env.local`. Start a preview with those test variables inherited:

```powershell
node --env-file=.env.ministry-test node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3017
```

Stop any preview using production variables before running browser tests. The
test configuration automatically starts a local preview when port 3017 is free.
Browser tests create synthetic users and exercise public overview, enrollment,
approval, curriculum uploads, draft/publication isolation, protected downloads,
submission persistence, grading, attendance, exam autosave/closure/retakes,
tuition balances, completion and suspension, and mobile layout. They clean up
their fixture records and files. PGlite tests independently exercise the migration,
SQL permissions, calendar, score calculations, DST, and academic/tuition boundaries.

## Production release boundary

Implementation and testing do not apply this migration to production. Before release:

1. Confirm the exact Supabase/Vercel projects and database backup. Reconcile existing
   migration history; an earlier database snapshot lacked a CLI history table. Do
   not blindly push all historical migrations.
2. Apply only `20261111215112_school_of_ministry.sql` to staging first and run the
   fixture suite there only if it is a local isolated stack; use a separately
   authorized fixture workflow for remote staging.
3. After authorized production migration, configure a strong `CRON_SECRET` and
   retain the existing server-only service key and Sanity configuration. Deploy
   the repository with app root `member-portal`, including sibling Sanity sources.
4. Verify the exact deployment's public overview and signed-in student/instructor/
   Sanity surfaces, storage privacy, and finalizer observability. Production
   verification is read-only unless separately authorized.

No online payment processor, automatic passing threshold, ordination claim,
accreditation claim, or automatic credential issuance is included.
