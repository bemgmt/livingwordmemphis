import { BookIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const studyKnowledgeBase = defineType({
  name: "studyKnowledgeBase",
  title: "Study knowledge base",
  type: "document",
  icon: BookIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Doctrine", value: "doctrine" },
          { title: "Church history", value: "church_history" },
          { title: "Biblical studies", value: "biblical_studies" },
          { title: "Practical theology", value: "practical_theology" },
          { title: "Apologetics", value: "apologetics" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "blockContent",
      description:
        "This content is provided to the Study Assistant as context for answering member questions.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Inactive articles are excluded from the study assistant context.",
    }),
  ],
  preview: {
    select: { title: "title", category: "category", isActive: "isActive" },
    prepare({ title, category, isActive }) {
      return {
        title: title ?? "Article",
        subtitle: `${category ?? ""} ${isActive === false ? "(inactive)" : ""}`.trim(),
      };
    },
  },
});
