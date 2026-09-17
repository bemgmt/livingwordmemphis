# Sunday school curriculum

Signed-in members open `/member/sunday-school` from the desktop sidebar or mobile
member menu. The library starts in October 2026 and groups files by month, class
(Adult, High School, Middle School, Elementary), and Sunday. Empty weeks remain
visible so teachers can see the schedule before uploading materials.

Teachers use `/member/sunday-school/upload` to upload PDF, Word, PowerPoint, or MP4
files up to 50 MB. The `sunday_school_teacher`, `staff`, `executive`, and `apostle`
roles can upload. Executive/apostle administrators assign the Sunday school teacher
role in `/admin/members`. Ordinary members can download but cannot upload.

Files live in the private Supabase `sunday-school-curriculum` bucket. Metadata lives
in Sanity `sundaySchoolLesson` documents. The upload publishes metadata only after
Storage confirms the file exists and matches its expected size and content type.
If publication fails, keep the upload page open and choose **Retry publishing**.
Embedded Studio provides metadata editing under Sunday school curriculum.

## Deployment

Deploy the repository root with Vercel's app root set to `member-portal` so the
sibling `sanity` schemas are included. Commit the curriculum pages, API routes,
navigation, schemas, and migrations together before deploying from another machine.

Apply these migrations in order, in separate transactions (the enum must commit
before it is referenced by a storage policy):

1. `20260917011234_sunday_school_teacher_role.sql`
2. `20260917011239_sunday_school_curriculum_storage.sql`

Both were applied to production on September 17, 2026 UTC using verified TLS. The
existing production database did not have a Supabase CLI migration history table;
reconcile the live schema before a future full `supabase db push`.

Required existing environment variables are `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `LWM_SANITY_TOKEN`.
The service role key and Sanity write token must remain server-only.

## Verification

Run `npm run test:sunday-school`, `npm run test:youth-forms`, and `npx tsc --noEmit`
inside `member-portal`. On the exact production release, verify the signed-in
library and mobile menu, teacher upload/publish, member download, and rejection of
anonymous downloads and member uploads. A login redirect alone does not prove that
the protected page exists: middleware can redirect missing routes too.

Deploying the feature does not add lesson files. Teachers supply and publish the
actual curriculum through the upload form.
