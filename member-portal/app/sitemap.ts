import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  const paths = [
    "/",
    "/about",
    "/events",
    "/giving",
    "/contact",
    "/visitors",
    "/portal",
  ] as const;
  const now = new Date();

  return paths.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
