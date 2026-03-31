import { DocumentTextIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const sermon = defineType({
  name: "sermon",
  title: "Sermon",
  type: "document",
  icon: DocumentTextIcon,
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
      name: "preachedAt",
      title: "Preached at",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "speakerName",
      title: "Speaker",
      type: "string",
      description: "Display name (e.g. Apostle Derek Talbird).",
    }),
    defineField({
      name: "series",
      title: "Series",
      type: "reference",
      to: [{ type: "sermonSeries" }],
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description: "YouTube or other watch URL.",
      validation: (rule) =>
        rule.uri({ scheme: ["http", "https"] }).warning("Use a full https URL"),
    }),
    defineField({
      name: "audioUrl",
      title: "Audio URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: "scriptureReferences",
      title: "Scripture references",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "notes",
      title: "Sermon notes",
      type: "blockContent",
      description: "Teaching notes and outline (public when published).",
    }),
    defineField({
      name: "coverImage",
      title: "Cover / thumbnail",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    {
      title: "Preached at, newest",
      name: "preachedAtDesc",
      by: [{ field: "preachedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      preachedAt: "preachedAt",
      media: "coverImage",
    },
    prepare({ title, preachedAt, media }) {
      const date = preachedAt
        ? new Date(preachedAt).toLocaleDateString()
        : "";
      return {
        title: title ?? "Untitled",
        subtitle: date,
        media,
      };
    },
  },
});
