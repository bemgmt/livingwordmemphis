import { BookIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const approvedBible = defineType({
  name: "approvedBible",
  title: "Approved Bible",
  type: "document",
  icon: BookIcon,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'Full name, e.g. "Christian Standard Bible".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "abbreviation",
      title: "Abbreviation",
      type: "string",
      description: 'Short code, e.g. "CSB".',
      validation: (rule) => rule.required().max(10),
    }),
    defineField({
      name: "apiBibleId",
      title: "API.Bible ID",
      type: "string",
      description: "The Bible ID from scripture.api.bible for this version.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Deactivate to hide from members without deleting.",
    }),
  ],
  preview: {
    select: { title: "name", abbreviation: "abbreviation", isActive: "isActive" },
    prepare({ title, abbreviation, isActive }) {
      return {
        title: `${title ?? "Bible"} (${abbreviation ?? "?"})`,
        subtitle: isActive === false ? "Inactive" : "Active",
      };
    },
  },
});
