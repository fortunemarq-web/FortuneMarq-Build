import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/ui/layout-wrapper";

// UI typeface (2026-07 refresh). Drives --font-display/body/sans via globals.css.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FortuneMarq",
  description: "CRM and Project Management tool for Digital Marketing Agency",
};

import { SessionHeartbeat } from "@/components/session-heartbeat";
import { CommandPalette } from "@/components/ui/command-palette";
import { Toaster } from "@/components/ui/toast";
import { PromptHost } from "@/components/ui/prompt-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${plexMono.variable}`}
    >
      <body
        className="antialiased text-slate-900"
        suppressHydrationWarning
      >
        <SessionHeartbeat />
        <CommandPalette />
        <Toaster />
        <PromptHost />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
