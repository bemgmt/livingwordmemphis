import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons";
import { SundaySchoolCurriculumFileInput } from "../../components/YouthCurriculumFileInput";
import { SCHOOL_CLASSES, validSchoolMonth, sundayDates } from "../../../member-portal/lib/sunday-school";

export const sundaySchoolLesson = defineType({
  name: "sundaySchoolLesson", title: "Sunday School Lesson", type: "document", icon: BookIcon,
  description: "Choose the month, class, and Sunday, upload the curriculum file here, then publish to the member portal.",
  fields: [
    defineField({ name: "title", title: "Lesson title", type: "string", validation: rule => rule.required().max(160) }),
    defineField({ name: "month", title: "Month (YYYY-MM)", type: "string", initialValue: "2026-10", validation: rule => rule.required().custom(value => typeof value === "string" && validSchoolMonth(value) ? true : "Choose a month from October 2026 onward (YYYY-MM).") }),
    defineField({ name: "classGroup", title: "Class", type: "string", options: { list: SCHOOL_CLASSES.map(c => ({ title: c.label, value: c.value })) }, validation: rule => rule.required() }),
    defineField({ name: "lessonDate", title: "Sunday lesson date", type: "date", validation: rule => rule.required().custom((value, context) => typeof context.document?.month === "string" && sundayDates(context.document.month).includes(value ?? "") ? true : "Choose a Sunday in the selected month.") }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, validation: rule => rule.max(2000) }),
    defineField({ name: "protectedFile", title: "Curriculum file", type: "object", description: "Choose a file, wait for the upload to finish, then publish. Signed-in members can download it from Sunday School.", components: { input: SundaySchoolCurriculumFileInput }, fields: [
      defineField({ name: "storagePath", type: "string", readOnly: true, hidden: true }),
      defineField({ name: "originalFilename", type: "string", readOnly: true, hidden: true }),
      defineField({ name: "contentType", type: "string", readOnly: true, hidden: true }),
      defineField({ name: "size", type: "number", readOnly: true, hidden: true }),
    ], validation: rule => rule.required().custom(value => value?.storagePath && value?.originalFilename ? true : "Upload a curriculum file before publishing.") }),
    defineField({ name: "uploadedBy", title: "Uploader account ID", type: "string", readOnly: true, hidden: true }),
  ],
  orderings: [{ title: "Lesson date", name: "lessonDate", by: [{ field: "lessonDate", direction: "desc" }] }],
  preview: {
    select: { title: "title", month: "month", classGroup: "classGroup", lessonDate: "lessonDate" },
    prepare({ title, month, classGroup, lessonDate }) {
      return { title, subtitle: [month, SCHOOL_CLASSES.find(c => c.value === classGroup)?.label, lessonDate].filter(Boolean).join(" / "), media: BookIcon };
    },
  },
});
