import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import JsonLd from "@/components/site/json-ld";
import { servicesLd, faqLd, breadcrumbLd } from "@/lib/site/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";
const IMG = "/site/images";

export const metadata: Metadata = {
  title: "Services | FortuneMarq - Web Design, SEO, Google Ads, CRM in Hubli",
  description:
    "FortuneMarq offers comprehensive digital marketing services: Web Design & Development, SEO, Google Ads, Meta Ads, and CRM solutions in Hubli, Karnataka.",
  keywords:
    "web design Hubli, SEO services Hubli, Google Ads Hubli, Meta Ads Hubli, CRM solutions, digital marketing services, website development Hubli",
  authors: [{ name: "FortuneMarq" }],
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/services`,
    title: "Services | FortuneMarq - Digital Marketing Agency",
    description: "We help businesses grow through Web Design, SEO, Google Ads, Meta Ads, and CRM solutions.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | FortuneMarq - Digital Marketing Agency",
    description: "Web Design, SEO, Google Ads, Meta Ads, and CRM solutions in Hubli.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
};

const SHOWCASE = [
  {
    id: "svc-1",
    num: "01",
    title: ["Website Design ", "& Development."],
    desc: "Pixel-perfect designs meet bulletproof code. We craft high-converting websites that load fast, rank high, and turn browsers into buyers.",
    tags: ["Custom Development", "E-Commerce", "Web Applications"],
    img: "svc-web.jpg",
    alt: "Web Design",
    w: 1200,
    h: 1500,
  },
  {
    id: "svc-2",
    num: "02",
    title: ["Performance ", "Marketing."],
    desc: "Every rupee accountable. We deploy precision-targeted campaigns across Google and Meta that generate qualified leads while maximizing your ROAS.",
    tags: ["Google Ads", "Meta Ads", "Conversion Tracking"],
    img: "svc-performance.jpg",
    alt: "Performance Marketing",
    w: 1200,
    h: 855,
  },
  {
    id: "svc-3",
    num: "03",
    title: ["SEO & ", "Content."],
    desc: "Own page one. We blend technical SEO mastery with strategic content that builds authority and drives organic traffic that converts.",
    tags: ["Technical SEO", "Content Strategy", "Link Building"],
    img: "svc-seo.jpg",
    alt: "SEO & Content",
    w: 1200,
    h: 797,
  },
  {
    id: "svc-4",
    num: "04",
    title: ["CRM & ", "Automations."],
    desc: "Work smarter, not harder. We implement systems that nurture leads, automate follow-ups, and scale your revenue while you focus on closing.",
    tags: ["HubSpot / Zoho", "Email Automation", "Sales Pipelines"],
    img: "svc-crm.jpg",
    alt: "CRM & Automations",
    w: 1200,
    h: 800,
  },
];

const PROCESS = [
  { num: "01", title: "Discovery", desc: "We audit your current standing, identify leaks in your funnel, and map out the competitive landscape." },
  { num: "02", title: "Strategy", desc: "We build a custom roadmap. No templates. Just a tailored plan focusing on high-impact levers." },
  { num: "03", title: "Execution", desc: "Our team deploys the assets. Code is written, ads are launched, and automation workflows go live." },
  { num: "04", title: "Optimization", desc: "We analyze the data, kill what doesn't work, and scale what does. Constant iteration for max ROI." },
];

const ACCORDION = [
  {
    num: "01",
    title: "Website Tech Stack",
    body: "We don't use generic templates. We build on lightweight frameworks like Astro, Next.js, or customized WordPress/Shopify themes. Every line of code is optimized for Core Web Vitals.",
    tags: ["HTML5", "GSAP", "Tailwind", "React"],
  },
  {
    num: "02",
    title: "Ad Strategy Setup",
    body: "Full competitor analysis, keyword research, and ad copy creation. We set up server-side tracking (CAPI) to bypass iOS privacy restrictions and ensure accurate data.",
    tags: ["GTM", "GA4", "Looker Studio"],
  },
  {
    num: "03",
    title: "SEO Implementation",
    body: "We fix broken links, optimize schema markup, improve site speed, and create a content calendar that targets high-intent keywords.",
    tags: ["Semrush", "Ahrefs", "Screaming Frog"],
  },
];

const PRICING = [
  {
    tier: "Starter",
    amount: "₹20000",
    period: "/mo",
    desc: "Perfect for small businesses ready to establish a professional digital presence.",
    features: ["Custom Website Design", "Basic SEO Setup", "Google Ads Management", "Monthly Reporting"],
    cta: "Get Started",
    featured: false,
  },
  {
    tier: "Growth",
    amount: "₹35000",
    period: "/mo",
    desc: "For ambitious brands looking to scale revenue aggressively through multiple channels.",
    features: [
      "Advanced Web Development",
      "Full SEO & Content Strategy",
      "Multi-Channel Ads (Google + Meta)",
      "CRM Automation Setup",
      "Bi-Weekly Strategy Calls",
    ],
    cta: "Scale Now",
    featured: true,
  },
  {
    tier: "Enterprise",
    amount: "Custom",
    period: "",
    desc: "Full-service partnership for large organizations requiring bespoke solutions.",
    features: ["Enterprise Web Applications", "International SEO", "Advanced Data Analytics", "Dedicated Account Manager", "24/7 Support Priority"],
    cta: "Contact Us",
    featured: false,
  },
];

export default function SiteServices() {
  return (
    <main>
      <JsonLd
        data={[
          ...servicesLd(SHOWCASE.map((s) => ({ name: s.title.join("").trim(), description: s.desc }))),
          faqLd(ACCORDION.map((a) => ({ q: a.title, a: a.body }))),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ]}
      />
      {/* SERVICES HERO */}
      <section className="sp-hero">
        <div className="sp-hero-bg">
          <div className="sp-grid" />
          <div className="sp-aurora" />
          <div className="sp-aurora-2" />
          <div className="sp-particles" />
        </div>
        <div className="sp-hero-container">
          <span className="sp-label" data-reveal="fade">
            <ShinyText text="SYSTEM // CAPABILITIES" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="sp-title" data-reveal="lines">
            Engineered for <br />
            <span className="txt-accent">Maximum Impact.</span>
          </h1>
          <div className="sp-desc-row">
            <p className="sp-desc" data-reveal="fade">
              We don&apos;t just &quot;do marketing.&quot; We build revenue engines. From the first line of code to the final
              conversion, every step is calculated.
            </p>
          </div>
        </div>
        <div className="sp-scroll-indicator">
          <span>SCROLL TO EXPLORE</span>
          <div className="sp-line" />
        </div>
      </section>

      {/* HORIZONTAL / CINEMATIC SHOWCASE */}
      <section id="fmq-premium-services" className="c-svc-section">
        <div className="c-svc-bg">
          <div className="c-svc-grid" />
          <div className="c-svc-glow" />
        </div>
        <div className="c-svc-pin-wrapper">
          <div className="c-svc-hud-left">
            <span className="c-hud-label">SYSTEM // CAPABILITIES</span>
            <div className="c-hud-line" />
          </div>
          <div className="c-svc-hud-right">
            <span className="c-svc-counter">01</span>
            <span className="c-svc-total">/ 04</span>
          </div>
          {SHOWCASE.map((s) => (
            <div className="c-svc-slide" id={s.id} key={s.id}>
              <div className="c-svc-content">
                <div className="c-svc-num">{s.num}</div>
                <h2 className="c-svc-title">
                  {s.title[0]}
                  <br />
                  <span className="c-accent">{s.title[1]}</span>
                </h2>
                <p className="c-svc-desc">{s.desc}</p>
                <ul className="c-svc-tags">
                  {s.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="c-svc-visual">
                <div className="c-svc-img-mask">
                  <Image
                    src={`${IMG}/${s.img}`}
                    alt={s.alt}
                    className="c-svc-img"
                    width={s.w}
                    height={s.h}
                    sizes="(max-width: 991px) 90vw, 45vw"
                    priority={s.id === "svc-1"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS / BLUEPRINT */}
      <section className="sp-process">
        <div className="sp-process-bg">
          <div className="sp-process-particles" />
        </div>
        <div className="sp-process-container">
          <div className="sp-process-head">
            <h2>
              The <span className="italic-accent">Blueprint.</span>
            </h2>
            <p>How we take you from concept to market dominance.</p>
          </div>
          <div className="sp-process-grid">
            {PROCESS.map((p) => (
              <div className="sp-step" data-reveal="fade" key={p.num}>
                <span className="step-num">{p.num}</span>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEEP DIVE ACCORDION */}
      <section className="sp-accordion-sec">
        <div className="sp-acc-container">
          <div className="sp-acc-header">
            <h2>
              Technical <span className="italic-accent">Deep Dive</span>
            </h2>
            <p>What exactly do you get? Here is the breakdown.</p>
          </div>
          <div className="sp-accordion">
            {ACCORDION.map((a) => (
              <div className="sp-acc-item" key={a.num}>
                <button className="sp-acc-btn">
                  <span className="sp-acc-num">{a.num}</span>
                  <span className="sp-acc-title">{a.title}</span>
                  <span className="sp-acc-icon">+</span>
                </button>
                <div className="sp-acc-panel">
                  <div className="sp-acc-inner">
                    <p>{a.body}</p>
                    <div className="sp-tags-row">
                      {a.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="sp-pricing">
        <div className="sp-pricing-bg">
          <div className="sp-pricing-particles" />
        </div>
        <div className="sp-pricing-container">
          <div className="sp-pricing-header">
            <span className="sp-pricing-label">INVESTMENT MODELS</span>
            <h2 className="sp-pricing-title">
              Simple, Transparent <br /> <span className="txt-accent">Pricing.</span>
            </h2>
            <p className="sp-pricing-subtitle">No hidden fees. Choose the tier that matches your growth velocity.</p>
          </div>
          <div className="sp-pricing-grid">
            {PRICING.map((p) => (
              <div className={p.featured ? "sp-pricing-card featured" : "sp-pricing-card"} data-reveal="fade" key={p.tier}>
                {p.featured && <div className="pricing-badge">Most Popular</div>}
                <div className="pricing-card-header">
                  <span className="pricing-tier">{p.tier}</span>
                  <div className="pricing-price">
                    <span className="price-amount">{p.amount}</span>
                    {p.period && <span className="price-period">{p.period}</span>}
                  </div>
                  <p className="pricing-desc">{p.desc}</p>
                </div>
                <ul className="pricing-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="feature-icon">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/site/contact" className="pricing-cta">
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="sp-pricing-note">
            <p>* All plans include our market exclusivity guarantee.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sp-cta">
        <div className="sp-cta-bg" />
        <div className="sp-cta-content">
          <h2 className="sp-cta-title">
            Ready to <span className="txt-stroke">Scale?</span>
          </h2>
          <Link href="/site/contact" className="sp-cta-btn" data-magnetic>
            <span>Start Your Project</span>
            <div className="sp-btn-arrow">→</div>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
