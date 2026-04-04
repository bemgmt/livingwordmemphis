import { DocumentTextIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const sermonForumTopic = defineType({
  name: "sermonForumTopic",
  title: "Sermon forum topic",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "title",
      title: "Discussion title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sermon",
      title: "Sermon",
      type: "reference",
      to: [{ type: "sermon" }],
      description: "The sermon this discussion is about.",
    }),
    defineField({
      name: "discussionPrompt",
      title: "Discussion prompt",
      type: "blockContent",
      description:
        "Questions or talking points for members to discuss after the sermon.",
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Deactivate to hide from the member forum.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      sermonTitle: "sermon.title",
      isActive: "isActive",
    },
    prepare({ title, sermonTitle, isActive }) {
      return {
        title: title ?? "Untitled topic",
        subtitle: `${sermonTitle ?? "No sermon"} ${isActive === false ? "(inactive)" : ""}`,
      };
    },
  },
});
