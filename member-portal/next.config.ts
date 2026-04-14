import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo: repo root also has package-lock.json; pin tracing to this app.
  outputFileTracingRoot: configDir,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["sanity"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/events.html", destination: "/events", permanent: true },
      { source: "/giving.html", destination: "/giving", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/visitors.html", destination: "/visitors", permanent: true },
    ];
  },
};

export default nextConfig;
