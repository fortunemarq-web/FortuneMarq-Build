import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import JsonLd from "@/components/site/json-ld";
import { breadcrumbLd } from "@/lib/site/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";
const IMG = "/site/images";

export const metadata: Metadata = {
  title: "About Us | FortuneMarq - Digital Marketing Agency in Hubli",
  description:
    "Learn about FortuneMarq, a digital marketing agency in Hubli. We're not another agency - we're your unfair advantage in competing with industry giants.",
  keywords: "about FortuneMarq, digital marketing agency Hubli, marketing team, digital agency Karnataka",
  authors: [{ name: "FortuneMarq" }],
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/about`,
    title: "About Us | FortuneMarq - Digital Marketing Agency",
    description: "We help businesses grow through Web Design, SEO, Google Ads, Meta Ads, and CRM solutions.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | FortuneMarq - Digital Marketing Agency",
    description: "Web Design, SEO, Google Ads, Meta Ads, and CRM solutions in Hubli.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
};

const PILLARS = [
  {
    num: "01",
    icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    title: "Strategy Over Spend",
    desc: "A ₹10K budget with surgical precision will outperform ₹1L of spray-and-pray advertising. We prove it daily.",
  },
  {
    num: "02",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    title: "Radical Transparency",
    desc: "No hidden fees. No mysterious algorithms. You see what we see. Every click, every conversion, every rupee—in real time.",
  },
  {
    num: "03",
    icon: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
    title: "Market Exclusivity",
    desc: "We don't work with your competitors. Period. Your market intelligence stays yours. Your advantage stays unfair.",
  },
];

const METRICS = [
  { count: 50, suffix: "+", label: "Websites Launched" },
  { count: 4, suffix: "X", label: "Average ROAS" },
  { count: 97, suffix: "%", label: "Client Retention" },
  { count: 0, suffix: "", label: "Hidden Fees" },
];

const STEPS = [
  { num: "01", title: "Discovery", desc: "Deep dive into your business, audience, and competition." },
  { num: "02", title: "Strategy", desc: "Custom roadmap built around your specific goals and budget." },
  { num: "03", title: "Execution", desc: "Launch, monitor, and optimize with military precision." },
  { num: "04", title: "Scale", desc: "Double down on what works. Eliminate what doesn't." },
];

export default function SiteAbout() {
  return (
    <main>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      {/* ABOUT HERO */}
      <section className="abt-hero">
        <div className="abt-hero-bg">
          <div className="abt-aurora-1" />
          <div className="abt-aurora-2" />
          <div className="abt-grid" />
        </div>
        <div className="abt-hero-content">
          <span className="abt-hero-tag">
            <ShinyText text="ABOUT FORTUNEMARQ" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="abt-hero-title">
            We&apos;re Not Another <br />
            <span className="abt-accent">Agency.</span>
          </h1>
          <p className="abt-hero-sub">We&apos;re your unfair advantage in a crowded digital battlefield.</p>
        </div>
        <div className="abt-scroll-indicator">
          <span>Scroll to discover</span>
          <div className="abt-scroll-line" />
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="abt-story">
        <div className="abt-story-visual">
          <div className="abt-story-img-wrap" data-parallax="0.12">
            <Image
              src={`${IMG}/about-origin.jpg`}
              alt="Our Origin"
              className="abt-story-img"
              width={1600}
              height={1068}
              sizes="(max-width: 991px) 90vw, 45vw"
            />
            <div className="abt-img-overlay" />
          </div>
          <div className="abt-story-badge">
            <span className="badge-year">2020</span>
            <span className="badge-text">Founded</span>
          </div>
        </div>
        <div className="abt-story-content">
          <span className="abt-section-tag">01 // THE ORIGIN</span>
          <h2 className="abt-section-title">
            Born From <span className="italic-accent">Frustration.</span>
          </h2>
          <p className="abt-story-text">
            We watched businesses hemorrhage money on agencies that delivered vanity metrics instead of revenue. Fancy
            reports. Zero accountability. Sound familiar?
          </p>
          <p className="abt-story-text">
            FortuneMarq was built different. Every strategy we deploy, every pixel we design, every ad we run—it&apos;s all
            engineered for one outcome: <strong>measurable growth.</strong>
          </p>
          <div className="abt-story-stat">
            <span className="stat-big">₹12M+</span>
            <span className="stat-desc">Ad spend managed with full transparency</span>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="abt-philosophy">
        <div className="abt-philosophy-bg">
          <div className="abt-phil-grid" />
        </div>
        <div className="abt-philosophy-header">
          <span className="abt-section-tag">02 // OUR PHILOSOPHY</span>
          <h2 className="abt-phil-title">
            Three Pillars of <span className="abt-accent">Dominance.</span>
          </h2>
        </div>
        <div className="abt-pillars">
          {PILLARS.map((p) => (
            <div className="abt-pillar" key={p.num}>
              <div className="pillar-num">{p.num}</div>
              <div className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {p.icon}
                </svg>
              </div>
              <h3 className="pillar-title">{p.title}</h3>
              <p className="pillar-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section className="abt-metrics">
        <div className="abt-metrics-header">
          <span className="abt-section-tag">03 // THE PROOF</span>
          <h2 className="abt-metrics-title">
            Numbers Don&apos;t <span className="italic-accent">Lie.</span>
          </h2>
        </div>
        <div className="abt-metrics-grid">
          {METRICS.map((m) => (
            <div className="abt-metric-card" key={m.label}>
              <div className="metric-value">
                <span className="metric-num" data-count={m.count}>
                  0
                </span>
                <span className="metric-suffix">{m.suffix}</span>
              </div>
              <span className="metric-label">{m.label}</span>
              <div className="metric-bar" />
            </div>
          ))}
        </div>
      </section>

      {/* APPROACH */}
      <section className="abt-approach">
        <div className="abt-approach-left">
          <span className="abt-section-tag">04 // OUR APPROACH</span>
          <h2 className="abt-approach-title">
            We Don&apos;t Just <br />
            Execute. We <br />
            <span className="abt-accent">Educate.</span>
          </h2>
          <p className="abt-approach-text">
            Most agencies keep you in the dark. We bring you into the war room. Understand your growth. Own your strategy.
            We&apos;re building partners, not dependencies.
          </p>
          <Link href="/contact" className="abt-approach-cta" data-magnetic>
            <span>Start the conversation</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="abt-approach-right">
          {STEPS.map((s) => (
            <div className="abt-process-step" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-content">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="abt-cta">
        <div className="abt-cta-bg">
          <div className="abt-cta-glow" />
        </div>
        <div className="abt-cta-content">
          <h2 className="abt-cta-title">
            Ready to Stop <span className="abt-accent">Guessing?</span>
          </h2>
          <p className="abt-cta-text">Let&apos;s build a growth system that actually works.</p>
          <Link href="/contact" className="abt-cta-btn" data-magnetic>
            <span className="btn-text">Book a Strategy Call</span>
            <span className="btn-icon">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
