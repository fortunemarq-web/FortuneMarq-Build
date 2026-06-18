import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteContactForm from "@/components/site/site-contact-form";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import RotatingText from "@/components/site/rotating-text";
import { WhatsAppCta } from "@/components/site/site-whatsapp";
import JsonLd from "@/components/site/json-ld";
import { localBusinessLd } from "@/lib/site/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export const metadata: Metadata = {
  title: "FortuneMarq | Digital Marketing Agency in Hubli - Web Design, SEO, Google Ads",
  description:
    "FortuneMarq is a leading digital marketing agency in Hubli offering Web Design, SEO, Google Ads, Meta Ads, and CRM solutions. Marketing that pays you back.",
  keywords:
    "digital marketing, web design, SEO, Google Ads, Meta Ads, CRM, Hubli, Karnataka, digital agency, online marketing, social media marketing, local SEO",
  authors: [{ name: "FortuneMarq" }],
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/` },
  icons: { icon: "/site/images/FORTUNEMARQ-LOGO.webp", apple: "/site/images/FORTUNEMARQ-LOGO.webp" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    title: "FortuneMarq - Digital Marketing Agency",
    description: "We help businesses grow through Web Design, SEO, Google Ads, Meta Ads, and CRM solutions.",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "FortuneMarq - Digital Marketing Agency",
    description: "Web Design, SEO, Google Ads, Meta Ads, and CRM solutions in Hubli.",
    images: [`${SITE_URL}/site/images/og-default.png`],
  },
};

const IMG = "/site/images";
const VID = "/site/videos";

const PARTNERS = [
  { src: "Google-Partner-logo.webp", alt: "Google Partner", w: 795, h: 375 },
  { src: "meta-business-partner-logo.webp", alt: "Meta Business Partner", w: 400, h: 205 },
  { src: "shopify-partner-logo.webp", alt: "Shopify Partner", w: 559, h: 205 },
  { src: "hubspot-solutions.webp", alt: "Hubspot Solutions", w: 2000, h: 701 },
  { src: "semrush.webp", alt: "Semrush", w: 538, h: 565, extra: " mp-logo-semrush" },
  { src: "linkedin-partner.webp", alt: "LinkedIn Partner", w: 575, h: 222 },
  { src: "GA-certified.webp", alt: "GA Certified", w: 500, h: 200 },
  { src: "google-tag.webp", alt: "Google Tag", w: 700, h: 350 },
];

const SERVICES = [
  { num: "01", img: "website.webp", alt: "Web Dev", title: ["Web &", "Development"], list: ["Custom UI/UX", "E-Commerce (Shopify/Woo)", "WebGL & 3D Experiences", "Speed Optimization"], mobileTitle: "Web & Development", mobileList: ["Custom UI/UX", "E-Commerce", "WebGL & 3D Experiences", "Speed Optimization"] },
  { num: "02", img: "performance.webp", alt: "Marketing", title: ["Performance", "Marketing"], list: ["Google Ads (PPC)", "Meta / Instagram Ads", "Retargeting Campaigns", "A/B Testing"], mobileTitle: "Performance Marketing", mobileList: ["Google Ads (PPC)", "Meta / Instagram Ads", "Retargeting Campaigns", "A/B Testing"] },
  { num: "03", img: "seo.webp", alt: "SEO", title: ["SEO &", "Content"], list: ["Technical Audits", "On-Page Optimization", "Link Building", "Content Strategy"], mobileTitle: "SEO & Content", mobileList: ["Technical Audits", "On-Page Optimization", "Link Building", "Content Strategy"] },
  { num: "04", img: "crm.webp", alt: "Automations", title: ["CRM &", "Automations"], list: ["HubSpot Implementation", "Email Flows (Klaviyo)", "Lead Scoring", "Sales Pipelines"], mobileTitle: "CRM & Automations", mobileList: ["HubSpot Implementation", "Email Flows (Klaviyo)", "Lead Scoring", "Sales Pipelines"] },
];

const SVC_DIM = { w: 2400, h: 1792 };

const PROJECTS_HERO = [
  { cat: "Gym", date: "05/31/24", name: "Gym Website", tag: "Web design & development", video: "screen-capture-2.webm" },
  { cat: "Restaurant", date: "08/08/24", name: "Restaurant", tag: "Web design & development", video: "ronin.webm" },
];
const PROJECTS_3 = [
  { cat: "Real Estate", date: "06/20/24", name: "Real Estate", tag: "Website design", video: "screen-capture-1.webm" },
  { cat: "Interior Design", date: "07/13/24", name: "Interior Fitout", tag: "Web design & development", video: "fitout.webm" },
  { cat: "Hospitality", date: "09/01/24", name: "Event Planner", tag: "Web design & development", video: "eraaya.webm" },
];

const RESULTS = [
  { img: "gads.webp", title: "Google Ads", statLabel: "ROAS", statVal: "4.1x", w: 1920, h: 877 },
  { img: "meta.webp", title: "Meta Ads", statLabel: "Leads", statVal: "+2.7x", w: 1920, h: 878 },
  { img: "gmb.webp", title: "Local SEO", statLabel: "Organic", statVal: "+188%", w: 1920, h: 873 },
  { img: "analytics.webp", title: "Analytics", statLabel: "LTV", statVal: "+36%", w: 1919, h: 715 },
];

const JOURNAL = [
  { src: "scroll-to-reveal-1.webp", w: 736, h: 736 },
  { src: "scroll-to-reveal-2.webp", w: 736, h: 736 },
  { src: "scroll-to-reveal-3.webp", w: 736, h: 920 },
  { src: "scroll-to-reveal-4.webp", w: 735, h: 919 },
  { src: "scroll-to-reveal-5.webp", w: 736, h: 736 },
  { src: "bag.webp", w: 736, h: 736 },
  { src: "cctv.webp", w: 736, h: 736 },
  { src: "repair.webp", w: 736, h: 736 },
  { src: "laptop.webp", w: 736, h: 736 },
];

// Honest "principle" cards (replacing fabricated testimonials). These are the
// agency's own stated commitments — no invented people or client quotes. Swap
// in real testimonials here once they exist (keep the same card shape).
const PRINCIPLES_LEFT = [
  { num: "01", title: "Market Exclusivity", statement: "We never work with your direct competitors. Take your niche in your city and it's yours alone.", tag: "Our commitment" },
  { num: "02", title: "Strategy Over Budget", statement: "We win with positioning and precision — not by outspending. Smart beats big.", tag: "How we operate" },
  { num: "03", title: "Radical Transparency", statement: "Simple, jargon-free reporting. You'll always know exactly where every rupee goes.", tag: "Always" },
];
const PRINCIPLES_RIGHT = [
  { num: "04", title: "Education, Not Dependency", statement: "We explain what we're doing and why — so you understand and own your growth.", tag: "Our promise" },
  { num: "05", title: "Data Before Opinions", statement: "Every plan starts with real search data for your market, not guesswork.", tag: "How we start" },
  { num: "06", title: "Built To Convert", statement: "Fast, beautiful, measurable — engineered to book customers, not chase vanity metrics.", tag: "What we build" },
];

function ServiceCardInner({ s, mobile }: { s: (typeof SERVICES)[number]; mobile?: boolean }) {
  return (
    <>
      <div className="sp-card-num">{s.num}</div>
      <div className="sp-card-visual">
        <Image src={`${IMG}/${s.img}`} alt={s.alt} className="sp-card-img" width={SVC_DIM.w} height={SVC_DIM.h} sizes="(max-width: 991px) 90vw, 40vw" />
        <div className="sp-card-overlay" />
      </div>
      <div className="sp-card-content">
        {mobile ? (
          <h3>{s.mobileTitle}</h3>
        ) : (
          <h3>
            {s.title[0]} <br />
            {s.title[1]}
          </h3>
        )}
        <ul className="sp-card-list">
          {(mobile ? s.mobileList : s.list).map((li) => (
            <li key={li}>{li}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function ProjectCard({ p, hero }: { p: { cat: string; date: string; name: string; tag: string; video: string }; hero?: boolean }) {
  const base = p.video.replace(/\.webm$/, "");
  return (
    <article className={hero ? "fp-card fp-card--hero" : "fp-card"}>
      <div className="fp-meta">
        <span className="fp-cat">
          <i className="fp-sq" aria-hidden="true" /> {p.cat}
        </span>
        <span className="fp-date">{p.date}</span>
      </div>
      <h3 className="fp-name">{p.name}</h3>
      <p className="fp-tag">{p.tag}</p>
      <div className="fp-media">
        {/* optimized H.264 mp4 (hardware-decoded on mobile) + instant poster frame */}
        <video className="fp-video" preload="metadata" poster={`${VID}/posters/${base}.jpg`} playsInline muted loop>
          <source src={`${VID}/${base}.mp4`} type="video/mp4" />
          <source src={`${VID}/${base}.webm`} type="video/webm" />
        </video>
      </div>
    </article>
  );
}

export default function SiteHome() {
  return (
    <>
      <JsonLd data={localBusinessLd()} />
      <main>
        {/* HERO / VISION */}
        <section id="fmq-home-vision">
          <div className="vh-aurora-1" />
          <div className="vh-aurora-2" />
          <div className="vh-noise" />
          <div className="vh-grid" />
          <div className="vh-container">
            <div className="vh-content">
              <div className="vh-badge">
                <span className="badge-icon">●</span>
                <span className="badge-txt">
                  <ShinyText text="ONE NICHE. ONE MARKET. NO COMPROMISE." color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
                </span>
              </div>
              <h1 className="vh-title">
                Compete With <br />
                <RotatingText
                  texts={["Industry Giants.", "Market Leaders.", "Bigger Budgets.", "The Old Guard."]}
                  mainClassName="vh-rotate"
                  staggerFrom="last"
                  staggerDuration={0.025}
                  rotationInterval={2600}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                />
              </h1>
              <div className="vh-body">
                <div className="vh-line" />
                <p className="vh-desc">
                  We create a <span className="txt-white">level playing field</span> for ambitious businesses. By leveraging
                  smart strategy over raw budget, we empower you to rise above limitations and not just survive, but lead.
                </p>
              </div>
              <div className="vh-actions">
                <Link href="/contact#book" className="vh-btn-main">
                  <span className="btn-bg" />
                  <span className="btn-content">
                    <span className="btn-text">Book a Strategy Call</span>
                    <span className="btn-icon">→</span>
                  </span>
                  <span className="btn-shine" />
                </Link>
                <a href="#featured-projects" className="vh-btn-sub">
                  <span className="sub-text">See How We Win</span>
                  <span className="sub-line" />
                </a>
                <WhatsAppCta source="hero" className="vh-btn-wa">
                  WhatsApp us
                </WhatsAppCta>
              </div>
              <div className="vh-trust">
                <span className="trust-label">TRUSTED BY LEADERS IN:</span>
                <div className="trust-ticker-mask" aria-hidden="true">
                  <div className="trust-ticker-wrapper">
                    <div className="trust-ticker-track">
                      {[0, 1].map((dup) =>
                        ["E-Commerce", "SaaS", "FinTech", "HealthTech", "EdTech"].map((t, i) => (
                          <Fragment key={`${dup}-${i}`}>
                            <span>{t}</span>
                            <span className="sep">•</span>
                          </Fragment>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="vh-visual">
              <div className="sphere-scene" id="sphere-scene">
                <div className="globe-wrap">
                  <div className="ring v-ring r1" />
                  <div className="ring v-ring r2" />
                  <div className="ring v-ring r3" />
                  <div className="ring v-ring r4" />
                  <div className="ring h-ring r5" />
                  <div className="ring h-ring r6" />
                  <div className="ring h-ring r7" />
                  <div className="globe-core" />
                  <div className="satellite-orbit">
                    <div className="satellite" />
                  </div>
                </div>
              </div>
              <div className="visual-cap">HUB OF STRATEGIC DOMINANCE</div>
            </div>
          </div>
          <div className="vh-scroll">
            <span className="scroll-txt">DISCOVER THE DIFFERENCE</span>
            <div className="scroll-track">
              <div className="scroll-pill" />
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section id="fmq-mission" className="mp-section">
          <div className="mp-aurora-1" />
          <div className="mp-aurora-2" />
          <div className="mp-noise" />
          <div className="mp-grid" />
          <div className="mp-container">
            <h2 className="mp-statement">
              Our mission is simple: <span className="txt-accent">Marketing that pays you back.</span> We treat every rupee as
              an investment, not an expense. Zero jargon. Zero false promises.
            </h2>
          </div>
          <div className="mp-logos-grid">
            {PARTNERS.map((p) => (
              <div className="logo-chip" key={p.src}>
                <Image src={`${IMG}/${p.src}`} alt={p.alt} className={`mp-logo${p.extra || ""}`} width={p.w} height={p.h} sizes="160px" />
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section id="fmq-about" className="about-section">
          <div className="about-aurora-1" />
          <div className="about-noise" />
          <div className="about-bg-grid" />
          <div className="about-container">
            <div className="about-grid">
              <div className="about-col">
                <span className="about-label">01 // CORE BELIEF</span>
                <h3 className="about-head" data-reveal="lines">
                  Strategy Over <span className="italic-accent">Budget.</span>
                </h3>
                <p className="about-desc">
                  Strategic storytelling and positioning can outperform raw spending power. We don&apos;t just buy ads; we buy
                  attention through precision and perception.
                </p>
              </div>
              <div className="about-col">
                <span className="about-label">02 // OUR PROMISE</span>
                <h3 className="about-head" data-reveal="lines">
                  Education & <span className="italic-accent">Exclusivity.</span>
                </h3>
                <p className="about-desc">
                  We educate while we execute so you understand your growth. Plus, we commit to{" "}
                  <strong>Market Exclusivity</strong>—we will never work with your direct competitors.
                </p>
              </div>
            </div>
            <div className="stats-minimal">
              <div className="stat-item">
                <div className="stat-num" data-target="50">0</div>
                <span className="stat-suffix">+</span>
                <span className="stat-label">Websites Launched</span>
              </div>
              <div className="stat-item">
                <div className="stat-num" data-target="4">0</div>
                <span className="stat-suffix">X</span>
                <span className="stat-label">Avg. ROAS Delivered</span>
              </div>
              <div className="stat-item">
                <div className="stat-num" data-target="12">0</div>
                <span className="stat-suffix">M+</span>
                <span className="stat-label">Ad Spend Managed</span>
              </div>
              <div className="stat-item">
                <div className="stat-num" data-target="97">0</div>
                <span className="stat-suffix">%</span>
                <span className="stat-label">Client Retention</span>
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES — desktop horizontal */}
        <section id="capabilities" className="sp-horiz-section">
          <div className="sp-horiz-track">
            <div className="sp-horiz-panel intro-panel">
              <h2 className="sp-horiz-head">
                Core <br /> <span className="txt-stroke">Offerings</span>
              </h2>
              <p className="sp-horiz-sub">Drag or scroll to explore our ecosystem.</p>
              <div className="sp-arrow-icon">→</div>
            </div>
            {SERVICES.map((s) => (
              <div className="sp-horiz-panel" key={s.num}>
                <div className="sp-card">
                  <ServiceCardInner s={s} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CAPABILITIES — mobile stack */}
        <section id="capabilities-mobile" className="fm-mobile-stack-section">
          <div className="fm-mobile-intro">
            <h2 className="sp-horiz-head">
              Core <br /> <span className="txt-stroke">Offerings</span>
            </h2>
            <p className="sp-horiz-sub">Scroll to explore services.</p>
          </div>
          <div className="fm-stack-wrapper">
            {SERVICES.map((s) => (
              <div className="fm-stack-card" key={s.num}>
                <ServiceCardInner s={s} mobile />
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED PROJECTS */}
        <section className="fp-sec" id="featured-projects" aria-labelledby="fpTitle">
          <div className="fp-aurora-1" />
          <div className="fp-noise" />
          <div className="fp-bg-grid" />
          <header className="fp-head">
            <h2 id="fpTitle" className="fp-title">
              Featured <span>Projects</span>
            </h2>
            <p className="fp-sub">Minimal, premium builds engineered for speed, UX and measurable growth.</p>
          </header>
          <div className="fp-grid fp-grid--2">
            {PROJECTS_HERO.map((p) => (
              <ProjectCard key={p.name} p={p} hero />
            ))}
          </div>
          <div className="fp-grid fp-grid--3">
            {PROJECTS_3.map((p) => (
              <ProjectCard key={p.name} p={p} />
            ))}
          </div>
          <div className="fp-cta-row">
            <Link href="/work" className="fp-cta">
              View all projects →
            </Link>
          </div>
        </section>

        {/* RESULTS */}
        <section id="fmq-results" className="res-section">
          <div className="res-aurora-1" />
          <div className="res-noise" />
          <div className="res-grid" />
          <div className="res-glow-bg" />
          <div className="res-content-wrapper">
            <div className="res-header">
              <span className="res-label">05 // FULL VISIBILITY</span>
              <h2 className="res-title" data-reveal="lines">
                Simplified <span className="italic-accent">Growth.</span>
              </h2>
              <div className="res-divider" />
              <p className="res-sub">
                We don&apos;t hide behind complex spreadsheets. We provide simplified, jargon-free reports showing exactly how
                your investment is compounding.
              </p>
            </div>
            <div className="res-sticky-viewport">
              <div className="res-track">
                {RESULTS.map((r) => (
                  <div className="res-card" data-image={`${IMG}/${r.img}`} data-title={r.title} key={r.img}>
                    <div className="res-device-frame">
                      <div className="res-screen">
                        <Image src={`${IMG}/${r.img}`} alt={r.title} width={r.w} height={r.h} sizes="(max-width: 991px) 80vw, 30vw" />
                      </div>
                      <div className="res-overlay">
                        <span className="res-tag">{r.title}</span>
                        <div className="res-stats">
                          <div className="res-stat">
                            {r.statLabel} <span className="acc">{r.statVal}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="res-mobile-progress">
              <div className="res-bar" />
            </div>
          </div>
        </section>

        {/* CREATIVE JOURNAL */}
        <section id="fmq-creative-journal" className="cj-section">
          <div className="cj-container">
            <div className="cj-content">
              <div className="cj-header">
                <span className="cj-label">CREATIVE JOURNAL</span>
                <h2 className="cj-headline">
                  Visual <br />
                  <span className="cj-accent">Expression.</span>
                </h2>
                <p className="cj-description">
                  A curated collection of our visual work, showcasing creativity and attention to detail across diverse
                  projects and industries.
                </p>
              </div>
            </div>
            <div className="cj-pin-wrapper">
              <div className="cj-images">
                {JOURNAL.map((j, i) => (
                  <div className="cj-image-wrap" key={j.src}>
                    <Image src={`${IMG}/${j.src}`} alt={`Creative Journal ${i + 1}`} className="cj-img" width={j.w} height={j.h} sizes="(max-width: 991px) 75vw, 40vw" />
                    <div className="cj-overlay" />
                  </div>
                ))}
              </div>
              <div className="cj-progress">
                <div className="cj-bar-track">
                  <div className="cj-bar-fill" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="fmq-testimonials" className="testi-section">
          <div className="testi-aurora-1" />
          <div className="testi-noise" />
          <div className="testi-grid" />
          <div className="testi-container">
            <div className="testi-content">
              <span className="testi-label">06 // WHY FORTUNEMARQ</span>
              <h2 className="testi-title" data-reveal="lines">
                Why founders <br />
                <span className="italic-accent">choose us.</span>
              </h2>
              <p className="testi-desc">
                No borrowed logos or invented quotes — just the commitments we hold to on every account we take on.
              </p>
            </div>
            <div className="testi-visual">
              <div className="testi-marquee-row">
                <div className="testi-track track-left">
                  {[0, 1].flatMap((dup) =>
                    PRINCIPLES_LEFT.map((p, i) => (
                      <div className="testi-card" key={`${dup}-${i}`} aria-hidden={dup === 1 || undefined}>
                        <p className="testi-quote">{p.statement}</p>
                        <div className="testi-user">
                          <div className="testi-avatar">{p.num}</div>
                          <div className="testi-meta">
                            <h4>{p.title}</h4>
                            <span>{p.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="testi-marquee-row">
                <div className="testi-track track-right">
                  {[0, 1].flatMap((dup) =>
                    PRINCIPLES_RIGHT.map((p, i) => (
                      <div className="testi-card" key={`${dup}-${i}`} aria-hidden={dup === 1 || undefined}>
                        <p className="testi-quote">{p.statement}</p>
                        <div className="testi-user">
                          <div className="testi-avatar">{p.num}</div>
                          <div className="testi-meta">
                            <h4>{p.title}</h4>
                            <span>{p.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="contact-section">
          <div className="contact-aurora-1" />
          <div className="contact-noise" />
          <div className="contact-grid" />
          <div className="contact-container">
            <div className="contact-info">
              <span className="contact-label">07 // GET IN TOUCH</span>
              <h2 className="contact-title">
                Ready to <span className="italic-accent">talk?</span>
              </h2>
              <p className="contact-desc">
                Let&apos;s discuss how we can build your revenue engine. <br />
                No fluff. No obligation. Just strategy.
              </p>
              <div className="contact-details">
                <a href="mailto:contact@fortunemarq.com" className="contact-link">contact@fortunemarq.com</a>
                <a href="mailto:fortunemarq@gmail.com" className="contact-link">fortunemarq@gmail.com</a>
                <a href="tel:+919353082656" className="contact-link">9353082656</a>
                <p className="contact-addr">Galaxy Mall First Floor Shop No. 43, J.C Nagar, Hubli - 580020</p>
              </div>
            </div>
            <SiteContactForm />
          </div>
        </section>

        {/* FOOTER */}
        <SiteFooter />
      </main>
    </>
  );
}
