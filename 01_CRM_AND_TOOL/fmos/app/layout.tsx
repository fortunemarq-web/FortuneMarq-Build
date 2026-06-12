import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/ui/layout-wrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
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
      className={`${dmSans.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body
        className="antialiased bg-slate-50 text-slate-900"
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
