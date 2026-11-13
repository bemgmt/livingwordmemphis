# School of Ministry curriculum and online workbooks

The five-school program includes Apostles, Prophets, Evangelist, Pastor, and
Teacher. School of Miracles is a separate module and is excluded from the
importer, library, assignments, and enrollment options.

## Student and staff journeys

The existing [desktop/mobile wireframes](ministry-wireframes.html) and portal
components remain the design basis: Newsreader headings, Manrope text, warm paper
surfaces, restrained green actions, accessible labels, and expandable sections.
My School links to the school library. The library groups optional reference
documents, chapter workbooks, dated weekly work, practical reflections, and
portfolio work. A chapter opens its supplied reading and structured response
fields. Missing material is labelled rather than represented as a real exam or
completed requirement.

Students answer directly on the site, autosave, leave and resume, explicitly
submit, receive released feedback, and complete instructor-authorized revisions.
No workbook download or upload is required. Submitted work and the original
questions are immutable; an authorized revision creates another attempt.
Failed saves remain visibly unsaved, with retry and an unload warning. Concurrent
stale drafts are rejected instead of silently overwriting newer work.

Personal reflections are optional by default. Instructors review actual work;
the import does not invent scores, pass marks, examination questions, or answer
keys. Workbook outcomes are Complete or Revision required and do not silently
affect the points-based grade summary. Editors can specify required response
fields in an approved workbook revision.

Students complete school applications and available student-facing forms online.
Administrative forms remain available as controlled references. Leadership
records references/admissions review, remediation, practical evaluations,
readiness, completion decisions, and numbered certificate issuance. References
and case notes are restricted to school administrators; assigned instructors
access only their school's academic records. Corrections preserve prior data.
Certificate issuance requires staff-confirmed completion and remains distinct
from ordination or recognition of an ecclesiastical office.

## Available source and reconciliation

The reviewed ZIP collection contains 16 unique Word/PDF sources for the five
schools. The import derives:

- 225 chapter units, with all 45 chapter numbers checked for each school.
- 27 Prophets weekly assignments matching the approved 2027 teaching dates.
- A Prophets portfolio reflection and six-month service plan.
- 14 Pastor supervised-practice reflection records, explicitly described as
  participation/reflection records rather than detailed competency guides.
- School applications and selected supplied student-facing request/concern forms.
- 14 Teacher practicum placeholders and a capstone placeholder.
- A private reference library with available documents and missing-material entries.

The controlling Prophets manual provides the reading. Workbook chapters 22 and
31–37 have title/content alignment differences and are held for reconciliation.
Their workbook questions are withheld from students. The matched weekly
assignments remain available. Staff can preview, correct, acknowledge
reconciliation, and explicitly publish a revision in the curriculum editor.

The four other schools have available workbook prompts but their complete student
manuals are missing. Actual exam papers, answer keys, detailed practicum guides,
and other absent supporting documents are marked as being prepared. Teacher's
handbook/rubric is supplied as reference; its additional unit exams and completion
requirements are not fabricated from blank administrative records. No automatic
graduation threshold or school-wide weighted grading is introduced.

## Private import workflow

Do not commit extracted curriculum or put it under public/. Originals remain
unchanged in the supplied folder. The generated bundle, extracted source bytes,
and preview belong under ignored member-portal/.ministry-import/.

Use the bundled Python runtime returned by Codex workspace dependencies:

```powershell
python scripts/ministry/build_curriculum.py --source-root D:\LivingWordMemphis --output .ministry-import
node scripts/ministry/import_curriculum.cjs --bundle .ministry-import/bundle.json
```

The first command reads the four reviewed ZIP archives in alldownloads, deduplicates
by hash, excludes Miracles, validates chapter coverage, extracts actual prompts,
and writes a private preview. The second command is a dry run unless --apply is
present. Uploads verify stored size/MIME and use immutable hash-based source paths.
Imports create missing library/unit records and preserve existing authored units,
student submissions, grades, enrollment, and tuition records.

For an existing isolated local test stack:

```powershell
node scripts/ministry-local-test-setup.cjs --upgrade --course
node --env-file=.env.ministry-test scripts/ministry/import_curriculum.cjs --apply --local
npm run test:ministry:course
npx playwright test --config playwright.ministry.config.ts
```

The helper/importer accept MINISTRY_TEST_API_PORT and MINISTRY_TEST_DB_PORT when
Windows reserves the original ports. Only named local stacks ending in -test are
accepted. Do not point mutation tests at production.

Production import requires --production, the exact --project-ref, a server-only
service key, a matching Postgres connection, and a trusted CA certificate supplied
with --ca. Apply only the additive library/workbook migration after reconciling
the live migration state; do not replay historical migrations. Production
verification is read-only unless separately authorized.

## Authoring and security

The embedded Sanity Ministry tool includes the imported workbook editor and
library publisher. Editors use a visible file chooser, preview the staged file,
then publish it. Replacements preserve the previous source record and keep the
old published document active until explicit publication. No storage path,
object ID, or MIME value is entered manually.

Library metadata and learning-unit listings have RLS. Source paths, chapter
reading/questions, unpublished drafts, file revisions, and record history live in
the non-exposed ministry_private schema. Authenticated RPCs check role and school
enrollment before returning content. Student and instructor downloads use
short-lived signed URLs backed by storage policies. Administrative references and
case notes do not appear in ordinary instructor/student snapshots.

Every saved workbook attempt freezes its source version, question labels,
question IDs, and instructions. Exports include answers, save/submission dates,
revision, version, and permitted grade/feedback data. Edits to the curriculum
cannot rewrite previously submitted responses. Existing Sunday School, Youth
Curriculum, tuition, and examination flows retain their original permissions.
