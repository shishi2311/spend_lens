import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PUBLIC_APP_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_APP_URL),
  title: {
    default: "SpendLens — A second opinion on your AI bill",
    template: "%s · SpendLens",
  },
  description:
    "Free audit for startup AI tool spend. Defensible, citation-backed recommendations on Cursor, Claude, Copilot, ChatGPT and more. No login.",
  applicationName: "SpendLens",
  authors: [{ name: "SpendLens" }],
  keywords: ["AI spend", "audit", "Cursor", "Claude", "Copilot", "ChatGPT", "startup tools"],
  openGraph: {
    type: "website",
    siteName: "SpendLens",
    title: "SpendLens — A second opinion on your AI bill",
    description:
      "Find out where your startup is overpaying for AI tools. Free audit, no login, no credit card.",
    url: PUBLIC_APP_URL,
    // Image auto-discovered from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendLens — A second opinion on your AI bill",
    description: "Free audit for startup AI tool spend.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh gradient-mesh">{children}</body>
    </html>
  );
}
