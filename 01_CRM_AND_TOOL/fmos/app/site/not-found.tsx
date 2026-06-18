import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";

// Branded 404 for the marketing host. Rendered inside app/site/layout.tsx, so it
// carries the full site chrome (header, footer, theme). This is also what the
// host-split serves when the app surface is sealed off (any non-marketing path
// on the marketing host → /site/<path> → here).

export const metadata: Metadata = {
  title: "Page Not Found | FortuneMarq",
  description: "The page you're looking for doesn't exist or has moved.",
  robots: "noindex, follow",
};

export default function SiteNotFound() {
  return (
    <main>
      <section className="lg-hero nf-hero">
        <div className="lg-hero-bg">
          <div className="wk-aurora" />
          <div className="wk-grid" />
        </div>
        <div className="lg-hero-inner">
          <span className="lg-kicker">
            <ShinyText text="ERROR 404" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="lg-title">
            Page not <span className="lg-accent">found.</span>
          </h1>
          <p className="lg-sub">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
          </p>
          <div className="nf-actions">
            <Link href="/" className="fm-footer-cta-btn">
              Back to home <span>→</span>
            </Link>
            <Link href="/contact" className="fm-footer-cta-btn nf-btn-ghost">
              Contact us
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
