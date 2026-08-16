# Youth curriculum upload plan

## What is changing

Curriculum is organized by series and then by week. Shared files stay in a `series-resources` folder; materials taught in a specific session live in `week-01`, `week-02`, and so on. The member portal mirrors those folders, so leaders see each series with its own weekly sections.

Sanity remains the curriculum CMS and requires a series name and resource type. Lesson outlines, lesson guides, discussions, and handouts require a whole-number week. Files themselves are stored in the private Supabase `youth-curriculum` bucket; Sanity stores only the protected object path and file metadata.

## Folder convention

```text
curriculum/
  stick-together/
    manifest.json
    series-resources/
      overview-video.mp4
      shopping-prep-list.docx
      high-school-hacks.pdf
      middle-school-hacks.pdf
    week-01/
      lesson-outline.pdf
      lesson-guide.pdf
      discussion-questions.pdf
      handout-illustrated-influence.pdf
      handout-response.pdf
    week-02/
      ...
```

## Youth pastor upload checklist

1. In Sanity Studio, open **Member portal > Youth curriculum uploader**.
2. Create one document per file and use **Protected curriculum file** to upload it directly to private Supabase Storage. Enter the series exactly as it should display and choose its **Folder / resource type**.
3. For an outline, lesson guide, discussion questions, or handout, select the week number. Leave the week blank only for the overview, shopping/prep list, and high-school or middle-school hacks.
4. Confirm the preview subtitle shows `Series / Week N / Resource type` before publishing.
5. Publish the document, then open **Member > Youth Ministry** and confirm the new document appears in the correct week folder and downloads successfully.

Use the embedded Studio at `/admin/studio`. Its upload endpoint requires the same Supabase staff session that protects the rest of the admin portal. Youth members and parents can download curriculum but cannot upload or replace it.

The current Supabase Free-plan upload ceiling is 50 MB. Compress larger curriculum files below that limit before uploading, or raise the project-wide Storage limit after upgrading the Supabase plan.

## Bulk-upload plan

Use `sanity/upload-curriculum.ts` for a prepared series folder. It accepts exactly one series folder, reads its `manifest.json`, calculates the week from `week-##` in the path, uploads the binary to private Supabase Storage, and creates or updates the correctly labeled Sanity document.

```powershell
cd sanity
npm run curriculum:upload -- stick-together
```

Run the Supabase migration and deploy the Sanity schema before using the new field. The bulk uploader reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `member-portal/.env.local`; it never prints either value. Use it only after every linked asset is present locally.

For existing Sanity documents, run `npm run curriculum:migrate-legacy` from `sanity`. The migration is resumable: it reuses deterministic Supabase object paths, patches a document only after its upload succeeds, and leaves unsupported or oversized legacy assets unchanged for manual resolution. During the August 16, 2026 migration, one 190,513,333-byte `Find Your Way` handout exceeded the 50 MB project limit; it was rendered at 300 DPI, compressed to 3,056,258 bytes, checksum-verified after upload, and migrated separately. All 349 published youth curriculum documents now use protected Supabase paths.

## Verification plan

1. Apply `20260816212511_youth_curriculum_private_storage.sql` and verify the bucket remains private.
2. Deploy the updated Sanity schema.
3. Upload one shared resource and one Week 1 resource through the embedded Studio form.
4. Confirm the week validation blocks a lesson material without a week number.
5. Confirm regular members cannot create upload URLs or signed downloads.
6. Confirm `youth_ministry`, staff, executive, and apostle accounts can download protected files.
7. Run the bulk upload for the remaining files and verify every series/week/resource type combination in Sanity before publishing it to students.
