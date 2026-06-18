import "./site.css";
import type { Metadata } from "next";
import {
  SitePreloader,
  SiteHeader,
  SiteMobileMenu,
  SiteLightbox,
  SiteScrollIndicator,
} from "@/components/site/site-chrome";
import SiteMotion from "@/components/site/site-motion";
import { FloatingWhatsApp } from "@/components/site/site-whatsapp";
import SiteAnalytics from "@/components/site/site-analytics";
import SiteChat from "@/components/site/site-chat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fonts. Custom faces self-hosted via @font-face in site.css (preloaded
          below); Inter + JetBrains Mono from Google with display=swap (no FOUT). */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <link rel="preload" href="/site/fonts/degarism-alliance-no1-light.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      <link rel="preload" href="/site/fonts/degarism-alliance-no2-light.otf" as="font" type="font/otf" crossOrigin="anonymous" />

      {/* Tracking stack (GA4 + Meta Pixel + Clarity) — fully inert until the
          NEXT_PUBLIC_* IDs are set, so it makes zero network calls otherwise. */}
      <SiteAnalytics />
      <SitePreloader />
      <div className="global-noise" />
      <SiteHeader />
      <SiteMobileMenu />
      {children}
      <SiteLightbox />
      <SiteScrollIndicator />
      <FloatingWhatsApp />
      <SiteChat />
      <SiteMotion />
    </>
  );
}
