import { defineField, defineType } from "sanity";
import { UsersIcon } from "@sanity/icons";

const resourceTypes = [
  { title: "Overview", value: "overview" },
  { title: "Shopping / prep list", value: "shopping-prep" },
  { title: "High school hacks", value: "high-school-hacks" },
  { title: "Middle school hacks", value: "middle-school-hacks" },
  { title: "Lesson outline", value: "lesson-outline" },
  { title: "Lesson guide", value: "lesson-guide" },
  { title: "Discussion questions", value: "discussion-questions" },
  { title: "Handout", value: "handout" },
];

const seriesResourceTypes = new Set([
  "overview",
  "shopping-prep",
  "high-school-hacks",
  "middle-school-hacks",
]);

export const youthMinistryDocument = defineType({
  name: "youthMinistryDocument",
  title: "Youth Ministry Document",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "file",
      title: "Document File",
      type: "file",
      options: {
        accept: ".pdf,.doc,.docx,.ppt,.pptx,.mp4",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "series",
      title: "Series Name",
      type: "string",
      description: "Use the exact series name shown to students (for example, Stick Together).",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "resourceType",
      title: "Folder / resource type",
      type: "string",
      description:
        "Choose a shared series folder or the material that belongs inside a weekly folder.",
      options: {
        list: resourceTypes,
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "week",
      title: "Week Number",
      type: "number",
      description:
        "Required for lesson materials. Leave blank only for Overview, Shopping / prep list, and Hacks.",
      validation: (rule) =>
        rule.custom((week, context) => {
          const resourceType = context.document?.resourceType;

          if (typeof resourceType === "string" && !seriesResourceTypes.has(resourceType) && !week) {
            return "Select the week this material belongs to.";
          }

          if (typeof week === "number" && (!Number.isInteger(week) || week < 1)) {
            return "Week number must be a whole number starting at 1.";
          }

          return true;
        }),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: "title",
      series: "series",
      week: "week",
      resourceType: "resourceType",
    },
    prepare({ title, series, week, resourceType }) {
      const resourceLabel = resourceTypes.find(
        (item) => item.value === String(resourceType),
      )?.title;
      const subtitle = [series, week ? `Week ${week}` : "Series resources", resourceLabel]
        .filter(Boolean)
        .join(" / ");
      return {
        title,
        subtitle,
        media: UsersIcon,
      };
    },
  },
});