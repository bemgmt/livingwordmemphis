import { defineField, defineType } from "sanity";
import { UsersIcon } from "@sanity/icons";

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
        accept: ".pdf,.doc,.docx,.ppt,.pptx",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "series",
      title: "Series Name",
      type: "string",
      description: "e.g., Wonder",
    }),
    defineField({
      name: "week",
      title: "Week Number",
      type: "number",
      description: "Week number within the series (e.g., 1, 2, 3)",
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
    },
    prepare({ title, series, week }) {
      const subtitle = [series, week ? `Week ${week}` : null]
        .filter(Boolean)
        .join(" - ");
      return {
        title,
        subtitle,
        media: UsersIcon,
      };
    },
  },
});
