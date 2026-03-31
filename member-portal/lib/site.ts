/**
 * Canonical public site URL for metadata, sitemap, and member-area “back to site” links.
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
