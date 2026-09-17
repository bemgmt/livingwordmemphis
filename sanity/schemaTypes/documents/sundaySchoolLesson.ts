import { defineField, defineType } from "sanity";
import { BookIcon } from "@sanity/icons";
import { SCHOOL_CLASSES, validSchoolMonth, sundayDates } from "../../../member-portal/lib/sunday-school";

export const sundaySchoolLesson = defineType({
  name: "sundaySchoolLesson", title: "Sunday School Lesson", type: "document", icon: BookIcon,
  description: "Teachers upload files through Member portal → Sunday School → Upload curriculum. Manage lesson labels here.",
  fields: [
    defineField({ name: "title", title: "Lesson title", type: "string", validation: rule => rule.required().max(160) }),
    defineField({ name: "month", title: "Month (YYYY-MM)", type: "string", initialValue: "2026-10", validation: rule => rule.required().custom(value => typeof value === "string" && validSchoolMonth(value) ? true : "Choose a month from October 2026 onward (YYYY-MM).") }),
    defineField({ name: "classGroup", title: "Class", type: "string", options: { list: SCHOOL_CLASSES.map(c => ({ title: c.label, value: c.value })) }, validation: rule => rule.required() }),
    defineField({ name: "lessonDate", title: "Sunday lesson date", type: "date", validation: rule => rule.required().custom((value, context) => typeof context.document?.month === "string" && sundayDates(context.document.month).includes(value ?? "") ? true : "Choose a Sunday in the selected month.") }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, validation: rule => rule.max(2000) }),
    defineField({ name: "protectedFile", title: "Private curriculum file", type: "object", readOnly: true, description: "Uploaded through the Sunday School member portal. Files are never published as public Sanity assets.", fields: [
      defineField({ name: "storagePath", type: "string" }),
      defineField({ name: "originalFilename", type: "string" }),
      defineField({ name: "contentType", type: "string" }),
      defineField({ name: "size", type: "number" }),
    ], validation: rule => rule.required() }),
    defineField({ name: "uploadedBy", title: "Uploader account ID", type: "string", readOnly: true }),
  ],
  orderings: [{ title: "Lesson date", name: "lessonDate", by: [{ field: "lessonDate", direction: "desc" }] }],
  preview: {
    select: { title: "title", month: "month", classGroup: "classGroup", lessonDate: "lessonDate" },
    prepare({ title, month, classGroup, lessonDate }) {
      return { title, subtitle: [month, SCHOOL_CLASSES.find(c => c.value === classGroup)?.label, lessonDate].filter(Boolean).join(" / "), media: BookIcon };
    },
  },
});
