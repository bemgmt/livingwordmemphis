import type { MetadataRoute } from "next";

/**
 * Android / Chrome install & PWA icons. Raster PNG is used because browsers
 * cannot load Adobe Illustrator (.ai) files; keep `lwm-black.png` in sync
 * with exports from `LWM Black.ai` at the repo root.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Living Word Memphis",
    short_name: "LWM",
    description:
      "Living Word Memphis — Love God. Love People. Live in Dominion. Worship, community, and spiritual growth in Memphis, TN.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
