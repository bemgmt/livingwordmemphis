# Youth curriculum upload plan

## What is changing

Curriculum is organized by series and then by week. Shared files stay in a `series-resources` folder; materials taught in a specific session live in `week-01`, `week-02`, and so on. The member portal mirrors those folders, so leaders see each series with its own weekly sections.

Sanity now requires a series name and resource type. Lesson outlines, lesson guides, discussions, and handouts require a whole-number week. This prevents a weekly resource from being published into the general series area by accident.

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
2. Create one document per file, upload the file, enter the series exactly as it should display, and choose its **Folder / resource type**.
3. For an outline, lesson guide, discussion questions, or handout, select the week number. Leave the week blank only for the overview, shopping/prep list, and high-school or middle-school hacks.
4. Confirm the preview subtitle shows `Series / Week N / Resource type` before publishing.
5. Open **Member > Youth Ministry** and confirm the new document appears in the correct week folder.

## Bulk-upload plan

Use `sanity/upload-curriculum.ts` for a prepared series folder. It accepts exactly one series folder, reads its `manifest.json`, calculates the week from `week-##` in the path, uploads the asset, and creates the correctly labeled Sanity document.

```powershell
cd sanity
npm run curriculum:upload -- stick-together
```

Run the schema deploy before using the new fields, then use the bulk uploader only after every linked asset is present locally. The supplied Stick Together source refers to an Overview PDF as "Check Email" and does not include a downloadable link, so that one file must be obtained before the series is considered complete.

## Verification plan

1. Deploy the updated Sanity schema.
2. Upload one shared resource and one Week 1 resource through the Studio form.
3. Confirm the week validation blocks a lesson material without a week number.
4. Confirm the portal separates series resources from Week 1.
5. Run the bulk upload for the remaining files and verify every series/week/resource type combination in Sanity before publishing it to students.