import Link from "next/link";
import ShinyText from "@/components/site/shiny-text";
import { WhatsAppCta } from "@/components/site/site-whatsapp";

// Premium footer — shared across every /site page (extracted verbatim from the
// home page so all routes get the same polished footer: CTA, 3 columns, giant
// ghost wordmark, socials, legal). Animated by initFooterAnimations in
// site-motion (gated by .fm-footer presence).

const FOOTER_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const FOOTER_SERVICES = [
  { label: "Web & Development", href: "/services#svc-1" },
  { label: "Performance Marketing", href: "/services#svc-2" },
  { label: "SEO & Content", href: "/services#svc-3" },
  { label: "CRM & Automations", href: "/services#svc-4" },
];

export default function SiteFooter() {
  return (
    <footer className="fm-footer">
      <div className="fm-footer-glow" />
      <div className="fm-footer-inner">
        <div className="fm-footer-top">
          <div className="fm-footer-lead">
            <span className="fm-footer-eyebrow">
              <span className="badge-icon">●</span>{" "}
              <ShinyText text="MARKETING THAT PAYS YOU BACK" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
            </span>
            <h2 className="fm-footer-cta">
              Ready to <span className="italic-accent">grow?</span>
            </h2>
            <Link href="/contact#book" className="fm-footer-cta-btn">
              Book a Strategy Call <span>→</span>
            </Link>
          </div>
          <div className="fm-footer-cols">
            <div className="fm-footer-col">
              <span className="fm-footer-col-title">Navigate</span>
              {FOOTER_NAV.map((n) => (
                <Link key={n.href} href={n.href} className="footer-min-link">
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="fm-footer-col">
              <span className="fm-footer-col-title">Services</span>
              {FOOTER_SERVICES.map((s) => (
                <Link key={s.href} href={s.href} className="footer-min-link">{s.label}</Link>
              ))}
            </div>
            <div className="fm-footer-col">
              <span className="fm-footer-col-title">Contact</span>
              <a href="mailto:contact@fortunemarq.com">contact@fortunemarq.com</a>
              <a href="tel:+919353082656">+91 93530 82656</a>
              <WhatsAppCta source="footer" className="fm-footer-wa">
                WhatsApp us
              </WhatsAppCta>
              <p>Galaxy Mall, 1st Floor, Shop 43, J.C Nagar, Hubli — 580020</p>
            </div>
          </div>
        </div>

        <div className="fm-footer-wordmark" aria-hidden="true">FortuneMarq</div>

        <div className="fm-footer-bottom">
          <span className="fm-footer-copy">© 2026 FortuneMarq Media &amp; Marketing. All rights reserved.</span>
          <div className="fm-footer-socials">
            <a href="https://www.linkedin.com/company/fortunemarq/" className="fm-footer-social footer-min-social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" fill="currentColor" />
              </svg>
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="https://www.instagram.com/fortunemarq" className="fm-footer-social footer-min-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor" />
              </svg>
              <span className="sr-only">Instagram</span>
            </a>
          </div>
          <div className="fm-footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span>/</span>
            <Link href="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
