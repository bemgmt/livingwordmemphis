import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/member/", "/admin/", "/auth/callback"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
