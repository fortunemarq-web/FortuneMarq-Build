import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/ui/layout-wrapper";



export const metadata: Metadata = {
  title: "FortuneMarq",
  description: "CRM and Project Management tool for Digital Marketing Agency",
};

import { SessionHeartbeat } from "@/components/session-heartbeat";
import { CommandPalette } from "@/components/ui/command-palette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased bg-slate-50 text-slate-900"
        suppressHydrationWarning
      >
        <SessionHeartbeat />
        <CommandPalette />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
