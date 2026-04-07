import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { Toaster } from "sonner";

import { getPublicSiteUrl } from "@/lib/site";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  title: {
    default: "Living Word Memphis",
    template: "%s | Living Word Memphis",
  },
  description:
    "Living Word Memphis — Love God. Love People. Live in Dominion. Worship, community, and spiritual growth in Memphis, TN.",
  appleWebApp: {
    capable: true,
    title: "Living Word Memphis",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${newsreader.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
