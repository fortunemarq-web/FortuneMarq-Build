import type { Metadata } from "next";
import SiteFooter from "@/components/site/site-footer";
import SiteContactPageForm from "@/components/site/site-contact-page-form";
import ShinyText from "@/components/site/shiny-text";
import { WhatsAppCta } from "@/components/site/site-whatsapp";
import SiteBookCta from "@/components/site/site-book-cta";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "Contact Us | FortuneMarq - Get in Touch | Hubli",
  description:
    "Contact FortuneMarq digital marketing agency in Hubli. Call us at 9353082656 or email contact@fortunemarq.com. Visit us at Galaxy Mall, J.C Nagar, Hubli.",
  keywords: "contact FortuneMarq, digital marketing agency Hubli, contact digital agency, marketing consultation Hubli",
  authors: [{ name: "FortuneMarq" }],
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
    title: "Contact Us | FortuneMarq - Digital Marketing Agency",
    description: "We help businesses grow through Web Design, SEO, Google Ads, Meta Ads, and CRM solutions.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | FortuneMarq - Digital Marketing Agency",
    description: "Web Design, SEO, Google Ads, Meta Ads, and CRM solutions in Hubli.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
};

const INFO = [
  {
    label: "Email Us",
    value: "contact@fortunemarq.com",
    href: "mailto:contact@fortunemarq.com",
    icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    label: "Alternate Email",
    value: "fortunemarq@gmail.com",
    href: "mailto:fortunemarq@gmail.com",
    icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    label: "Call Us",
    value: "9353082656",
    href: "tel:+919353082656",
    icon: (
      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    ),
  },
  {
    label: "Visit Us",
    value: "Galaxy Mall First Floor Shop No. 43, J.C Nagar, Hubli - 580020",
    href: null,
    icon: (
      <>
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
];

const SOCIALS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/fortunemarq/", ext: true },
  { name: "Instagram", href: "https://www.instagram.com/fortunemarq", ext: true },
  { name: "Twitter", href: "#", ext: false },
];

const FAQ = [
  { num: "01", q: "How quickly can we start?", a: "Most projects kick off within 48-72 hours of agreement. We move fast because your growth shouldn't wait." },
  { num: "02", q: "What's your minimum engagement?", a: "We typically work with budgets starting at ₹25K/month for marketing and ₹50K+ for websites. Quality has a cost." },
  { num: "03", q: "Do you work with startups?", a: "Absolutely. Some of our best results come from hungry startups ready to disrupt their industry. Let's talk." },
  { num: "04", q: "What makes you different?", a: "Radical transparency, forensic data analysis, and we don't work with your competitors. Your advantage stays unfair." },
];

export default function SiteContact() {
  return (
    <main>
      {/* CONTACT HERO */}
      <section className="ct-hero">
        <div className="ct-hero-bg">
          <div className="ct-aurora-1" />
          <div className="ct-aurora-2" />
          <div className="ct-grid" />
          <div className="ct-particles" />
        </div>

        <div className="ct-hud">
          <div className="ct-hud-left">
            <span className="ct-hud-label">TRANSMISSION // OPEN</span>
            <div className="ct-hud-line" />
          </div>
          <div className="ct-hud-right">
            <div className="ct-status">
              <span className="ct-status-dot" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        <div className="ct-hero-content">
          <span className="ct-tag">
            <ShinyText text="GET IN TOUCH" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="ct-title">
            Let&apos;s Build <br />
            Something <span className="ct-accent">Legendary.</span>
          </h1>
          <p className="ct-subtitle">
            Ready to stop guessing and start growing? We&apos;re here to engineer your unfair advantage.
          </p>
        </div>
      </section>

      {/* CONTACT MAIN */}
      <section className="ct-main">
        <div className="ct-main-grid">
          {/* Left: info */}
          <div className="ct-info-col">
            {INFO.map((c) => (
              <div className="ct-info-card" key={c.label}>
                <div className="ct-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {c.icon}
                  </svg>
                </div>
                <div className="ct-info-content">
                  <span className="ct-info-label">{c.label}</span>
                  {c.href ? (
                    <a href={c.href} className="ct-info-value">
                      {c.value}
                    </a>
                  ) : (
                    <span className="ct-info-value">{c.value}</span>
                  )}
                </div>
                <div className="ct-info-arrow">→</div>
              </div>
            ))}

            <div className="ct-response">
              <div className="ct-response-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="ct-response-text">
                <strong>Average Response Time:</strong> Under 4 hours
              </div>
            </div>

            <WhatsAppCta source="contact" className="ct-wa-btn">
              Chat with us on WhatsApp
            </WhatsAppCta>

            <div className="ct-socials">
              <span className="ct-socials-label">Connect With Us</span>
              <div className="ct-socials-row">
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    className="ct-social-link"
                    {...(s.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className="ct-social-name">{s.name}</span>
                    <span className="ct-social-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="ct-form-col">
            <SiteContactPageForm />
          </div>
        </div>
      </section>

      {/* BOOK A MEETING */}
      <section className="sbk-section">
        <SiteBookCta />
      </section>

      {/* FAQ */}
      <section className="ct-faq">
        <div className="ct-faq-header">
          <span className="ct-section-tag">FREQUENTLY ASKED</span>
          <h2 className="ct-faq-title">
            Quick <span className="ct-accent">Answers.</span>
          </h2>
        </div>
        <div className="ct-faq-grid">
          {FAQ.map((f) => (
            <div className="ct-faq-item" key={f.num}>
              <div className="ct-faq-num">{f.num}</div>
              <h3 className="ct-faq-q">{f.q}</h3>
              <p className="ct-faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
