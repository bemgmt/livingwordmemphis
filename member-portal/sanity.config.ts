"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "@studio/schemaTypes";
import { structure } from "@studio/structure";
import { generateRegistrationUrlAction } from "@studio/actions/generateRegistrationUrl";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  basePath: "/admin/studio",
  name: "living-word-memphis",
  title: "Living Word Memphis",
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === "churchEvent") {
        return [...prev, generateRegistrationUrlAction];
      }
      return prev;
    },
  },
});
