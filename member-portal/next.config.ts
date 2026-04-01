import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["sanity"],
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
