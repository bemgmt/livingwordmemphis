import { defineType, defineField } from "sanity";
export const ministryProgram = defineType({
  name: "ministryProgram",
  title: "School of Ministry · Public information",
  type: "document",
  description:
    "Public overview copy only. Private teaching content belongs in the Ministry curriculum tool.",
  fields: [
    defineField({
      name: "title",
      title: "Program title",
      type: "string",
      initialValue: "School of Ministry",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "introduction",
      title: "Public introduction",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "calendarNotes",
      title: "Public calendar notes",
      type: "text",
      description:
        "Explain the approved calendar. Academic dates and fees are seeded in the school database and must be changed through a reviewed migration.",
    }),
    defineField({
      name: "schoolDescriptions",
      title: "School descriptions",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "school",
              title: "School",
              type: "string",
              options: {
                list: [
                  "apostles",
                  "prophets",
                  "evangelist",
                  "pastor",
                  "teacher",
                ],
              },
            },
            { name: "description", title: "Public description", type: "text" },
          ],
        },
      ],
    }),
  ],
});
