import { BellIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const announcement = defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  icon: BellIcon,
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
    }),
    defineField({
      name: "excerpt",
      title: "Short excerpt",
      type: "text",
      rows: 2,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
    }),
    defineField({
      name: "linkUrl",
      title: "Learn more URL",
      type: "url",
    }),
    defineField({
      name: "linkLabel",
      title: "Link label",
      type: "string",
      initialValue: "Learn more",
    }),
    defineField({
      name: "displayFrom",
      title: "Show from",
      type: "datetime",
    }),
    defineField({
      name: "displayUntil",
      title: "Show until",
      type: "datetime",
      validation: (rule) =>
        rule.custom((until, ctx) => {
          const from = ctx.document?.displayFrom as string | undefined;
          if (!until || !from) return true;
          if (new Date(until) < new Date(from)) {
            return "End must be after start";
          }
          return true;
        }),
    }),
    defineField({
      name: "priority",
      title: "Sort priority",
      type: "number",
      description: "Higher numbers appear first when multiple are active.",
      initialValue: 0,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", excerpt: "excerpt" },
    prepare({ title, excerpt }) {
      return {
        title: title ?? "Announcement",
        subtitle: excerpt,
      };
    },
  },
});
