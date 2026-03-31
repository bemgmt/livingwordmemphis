import { BookIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/**
 * Curated articles safe for public site and future AI / RAG export.
 * No pastoral secrets or prayer content — see docs/portal/data-ownership.md.
 */
export const knowledgeArticle = defineType({
  name: "knowledgeArticle",
  title: "Knowledge base article",
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
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Editorial status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "In review", value: "review" },
          { title: "Approved for publish", value: "approved" },
          { title: "Published", value: "published" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description: "Plain-language summary for listings and embeddings.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
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
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", status: "status" },
    prepare({ title, status }) {
      return {
        title: title ?? "Article",
        subtitle: status ? String(status) : "",
      };
    },
  },
});
