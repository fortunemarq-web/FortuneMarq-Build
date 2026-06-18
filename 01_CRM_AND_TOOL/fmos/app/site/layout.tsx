import "./site.css";
import type { Metadata, Viewport } from "next";
import {
  SitePreloader,
  SiteHeader,
  SiteMobileMenu,
  SiteLightbox,
  SiteScrollIndicator,
} from "@/components/site/site-chrome";
import SiteMotion from "@/components/site/site-motion";
import SiteAnalytics from "@/components/site/site-analytics";
import SiteChat from "@/components/site/site-chat";
import SiteHardNav from "@/components/site/site-hardnav";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  themeColor: "#030303",
  // Let the on-screen keyboard shrink the viewport so the chat panel (sized in
  // dvh) stays above the keypad instead of being pushed off the top.
  interactiveWidget: "resizes-content",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fonts. Custom faces self-hosted via @font-face in site.css (preloaded
          below): Alliance No1/No2 + JetBrains Mono (woff2). Only Inter comes from
          Google now (display=swap, no FOUT) — JetBrains Mono is no longer double-loaded. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link rel="preload" href="/site/fonts/degarism-alliance-no1-light.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      <link rel="preload" href="/site/fonts/degarism-alliance-no2-light.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      <link rel="preload" href="/site/fonts/JetBrainsMono-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

      {/* Tracking stack (GA4 + Meta Pixel + Clarity) — fully inert until the
          NEXT_PUBLIC_* IDs are set, so it makes zero network calls otherwise. */}
      <SiteAnalytics />
      <SiteHardNav />
      <SitePreloader />
      <div className="global-noise" />
      <a href="#site-main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <SiteMobileMenu />
      <div id="site-main" tabIndex={-1}>{children}</div>
      <SiteLightbox />
      <SiteScrollIndicator />
      <SiteChat />
      <SiteMotion />
    </>
  );
}
