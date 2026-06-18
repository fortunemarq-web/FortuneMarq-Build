import Image from "next/image";
import Link from "next/link";
import { WhatsAppCta } from "@/components/site/site-whatsapp";

// Static markup ported 1:1 from public_html/index.html chrome (preloader,
// header, mobile menu, scroll indicator, lightbox). Behaviour is driven by
// <SiteMotion/>. Internal routes are staged under /site for the parallel
// rebuild; in-page anchors keep their original hashes.

export const SITE_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Contact", href: "/contact" },
];

export function SitePreloader() {
  // Minimal, premium preloader: logo + letter-spaced wordmark + a thin progress
  // line, on the dark surface, then a clean fade-and-lift reveal. (#preloader and
  // #progress-fill ids are driven by site-motion's initPreloader.)
  return (
    <div className="fm-preloader" id="preloader">
      <div className="fm-pre-inner">
        <Image src="/site/images/FORTUNEMARQ-LOGO.webp" alt="FortuneMarq" className="fm-pre-logo" width={500} height={500} priority />
        <div className="fm-pre-word">FORTUNEMARQ</div>
        <div className="fm-pre-bar">
          <span className="fm-pre-bar-fill" id="progress-fill" />
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="fmq-header">
      <Link href="/" className="header-logo">
        <Image src="/site/images/FORTUNEMARQ-LOGO.webp" alt="FortuneMarq" className="logo-img" width={500} height={500} priority />
      </Link>
      <div className="header-menu-chip">
        <nav className="header-nav">
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <WhatsAppCta source="header" className="header-wa" />
        <Link href="/contact#book" className="header-cta">
          Book a Meeting
        </Link>
        <button className="header-toggle" aria-label="Menu" aria-expanded={false} aria-controls="mobile-menu">
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export function SiteMobileMenu() {
  return (
    <div className="mobile-menu" id="mobile-menu">
      <div className="mm-bg">
        <div className="mm-aurora" />
        <div className="mm-grid" />
        <div className="mm-noise" />
      </div>
      <div className="mm-content">
        <nav className="mobile-nav">
          {SITE_NAV.map((n, i) => (
            <Link href={n.href} className="m-link" key={n.href}>
              <span className="m-link-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="m-link-text">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mm-footer">
          <div className="mm-socials">
            <a href="https://www.linkedin.com/company/fortunemarq/" className="mm-social" target="_blank" rel="noopener noreferrer">Li</a>
            <a href="https://www.instagram.com/fortunemarq" className="mm-social" target="_blank" rel="noopener noreferrer">Ig</a>
          </div>
          <div className="mm-cta">
            <span className="mm-cta-label">Ready to grow?</span>
            <Link href="/contact#book" className="mm-cta-btn">Book a Meeting →</Link>
          </div>
        </div>
      </div>
      <div className="mm-decor">
        <div className="mm-line mm-line-1" />
        <div className="mm-line mm-line-2" />
        <div className="mm-corner mm-corner-tl" />
        <div className="mm-corner mm-corner-br" />
      </div>
    </div>
  );
}

export function SiteLightbox() {
  return (
    <div className="res-lightbox" id="resLightbox" aria-hidden="true">
      <div className="res-lightbox-overlay" />
      <div className="res-lightbox-content">
        <button className="res-lightbox-close" aria-label="Close lightbox">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* src/alt injected by the lightbox handler in site-motion */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img className="res-lightbox-image" alt="" />
        <div className="res-lightbox-title" />
      </div>
    </div>
  );
}

export function SiteScrollIndicator() {
  return (
    <div className="scroll-indicator" id="scrollIndicator" aria-hidden="true">
      <button className="scroll-indicator-btn" aria-label="Scroll to top">
        <svg className="scroll-indicator-circle" viewBox="0 0 100 100">
          <circle className="scroll-indicator-bg" cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <circle className="scroll-indicator-progress" cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="283" strokeDashoffset="283" />
        </svg>
        <div className="scroll-indicator-content">
          <span className="scroll-indicator-label">SCROLL</span>
          <span className="scroll-indicator-percent">0</span>
        </div>
      </button>
    </div>
  );
}
