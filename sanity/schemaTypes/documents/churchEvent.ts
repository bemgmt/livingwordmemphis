import { CalendarIcon } from "@sanity/icons";
import type { PreviewValue } from "@sanity/types";
import { createElement } from "react";
import { defineField, defineType } from "sanity";

/** List-preview thumbnail when the event has no image (served from studio `static/`). */
const defaultEventListThumbnail = createElement("img", {
  src: "/static/lwm-black.png",
  alt: "",
  style: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    backgroundColor: "#ffffff",
  },
});

function previewMedia(
  media: { asset?: unknown } | null | undefined,
): PreviewValue["media"] {
  if (media?.asset) return media as PreviewValue["media"];
  return defaultEventListThumbnail;
}

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
      name: "isRecurring",
      title: "Recurring event",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "recurrenceRule",
      title: "Repeats",
      type: "string",
      options: {
        list: [
          { title: "Every Sunday", value: "weekly-sunday" },
          { title: "Every Monday", value: "weekly-monday" },
          { title: "Every Tuesday", value: "weekly-tuesday" },
          { title: "Every Wednesday", value: "weekly-wednesday" },
          { title: "Every Thursday", value: "weekly-thursday" },
          { title: "Every Friday", value: "weekly-friday" },
          { title: "Every Saturday", value: "weekly-saturday" },
          { title: "Every 2 weeks", value: "biweekly" },
          { title: "Monthly (same day of month)", value: "monthly" },
        ],
        layout: "dropdown",
      },
      hidden: ({ document }) => !document?.isRecurring,
      validation: (rule) =>
        rule.custom((value, ctx) => {
          if (ctx.document?.isRecurring && !value) return "Required for recurring events";
          return true;
        }),
    }),
    defineField({
      name: "recurrenceEndDate",
      title: "Recurrence ends",
      type: "date",
      description: "Leave empty for ongoing events.",
      hidden: ({ document }) => !document?.isRecurring,
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
    select: {
      title: "title",
      startAt: "startAt",
      media: "image",
      isRecurring: "isRecurring",
      recurrenceRule: "recurrenceRule",
    },
    prepare({ title, startAt, media, isRecurring, recurrenceRule }) {
      const date = startAt
        ? new Date(startAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "";
      const suffix = isRecurring && recurrenceRule ? ` (${recurrenceRule.replace(/-/g, " ")})` : "";
      return {
        title: title ?? "Event",
        subtitle: `${date}${suffix}`,
        media: previewMedia(media),
      };
    },
  },
});
