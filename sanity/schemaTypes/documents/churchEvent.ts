import { CalendarIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const churchEvent = defineType({
  name: "churchEvent",
  title: "Church event",
  type: "document",
  icon: CalendarIcon,
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
      name: "startAt",
      title: "Starts",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endAt",
      title: "Ends",
      type: "datetime",
      validation: (rule) =>
        rule.custom((endAt, ctx) => {
          const start = ctx.document?.startAt as string | undefined;
          if (!endAt || !start) return true;
          if (new Date(endAt) < new Date(start)) {
            return "End must be after start";
          }
          return true;
        }),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "e.g. Main sanctuary, Macon Rd campus.",
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "details",
      title: "Details",
      type: "blockContent",
    }),
    defineField({
      name: "registrationUrl",
      title: "Registration / info URL",
      type: "url",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featured",
      title: "Featured on site",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    {
      title: "Start date",
      name: "startAsc",
      by: [{ field: "startAt", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", startAt: "startAt", media: "image" },
    prepare({ title, startAt, media }) {
      return {
        title: title ?? "Event",
        subtitle: startAt
          ? new Date(startAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "",
        media,
      };
    },
  },
});
