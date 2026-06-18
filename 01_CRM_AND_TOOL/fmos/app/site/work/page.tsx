import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site/site-footer";
import ShinyText from "@/components/site/shiny-text";
import JsonLd from "@/components/site/json-ld";
import { breadcrumbLd } from "@/lib/site/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";
const VID = "/site/videos";

export const metadata: Metadata = {
  title: "Our Work | FortuneMarq - Web Design & Marketing Portfolio | Hubli",
  description:
    "Selected work from FortuneMarq — premium websites and growth campaigns engineered for speed, UX, and measurable revenue across industries.",
  keywords: "FortuneMarq portfolio, web design work Hubli, marketing case studies, website portfolio Karnataka",
  authors: [{ name: "FortuneMarq" }],
  robots: "index, follow",
  alternates: { canonical: `${SITE_URL}/work` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/work`,
    title: "Our Work | FortuneMarq - Digital Marketing Agency",
    description: "Premium websites and growth campaigns engineered for measurable revenue.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Work | FortuneMarq",
    description: "Premium websites and growth campaigns engineered for measurable revenue.",
    images: [`${SITE_URL}/site/images/FORTUNEMARQ-LOGO.webp`],
  },
};

const STATS = [
  { to: 50, decimals: 0, prefix: "", suffix: "+", label: "Projects Shipped" },
  { to: 4.1, decimals: 1, prefix: "", suffix: "x", label: "Avg. ROAS", acc: true },
  { to: 97, decimals: 0, prefix: "", suffix: "%", label: "Client Retention" },
  { to: 2, decimals: 0, prefix: "<", suffix: "s", label: "Load Targets" },
];

const PROJECTS_HERO = [
  { cat: "Gym", date: "05/31/24", name: "Gym Website", tag: "Web design & development", video: "screen-capture-2.webm" },
  { cat: "Restaurant", date: "08/08/24", name: "Restaurant", tag: "Web design & development", video: "ronin.webm" },
];
const PROJECTS_3 = [
  { cat: "Real Estate", date: "06/20/24", name: "Real Estate", tag: "Website design", video: "screen-capture-1.webm" },
  { cat: "Interior Design", date: "07/13/24", name: "Interior Fitout", tag: "Web design & development", video: "fitout.webm" },
  { cat: "Hospitality", date: "09/01/24", name: "Event Planner", tag: "Web design & development", video: "eraaya.webm" },
];

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
        <video className="fp-video" preload="metadata" poster={`${VID}/posters/${base}.jpg`} playsInline muted loop>
          <source src={`${VID}/${base}.mp4`} type="video/mp4" />
          <source src={`${VID}/${base}.webm`} type="video/webm" />
        </video>
      </div>
    </article>
  );
}

export default function SiteWork() {
  return (
    <main>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])} />
      {/* WORK HERO */}
      <section className="wk-hero">
        <div className="wk-hero-bg">
          <div className="wk-aurora" />
          <div className="wk-grid" />
        </div>
        <div className="wk-hero-content">
          <span className="wk-tag">
            <ShinyText text="SELECTED WORK" color="#42CA80" shineColor="#ffffff" speed={4} delay={1} />
          </span>
          <h1 className="wk-title">
            Work That <span className="wk-accent">Compounds.</span>
          </h1>
          <p className="wk-sub">
            Minimal, premium builds and growth campaigns engineered for speed, UX, and measurable revenue — not vanity
            metrics.
          </p>
        </div>
        <div className="wk-hero-stats">
          {STATS.map((s) => (
            <div className="wk-stat" key={s.label}>
              <span className={s.acc ? "wk-stat-num wk-stat-acc" : "wk-stat-num"}>
                {s.prefix}
                <span className="wk-count" data-to={s.to} data-decimals={s.decimals}>
                  0
                </span>
                {s.suffix}
              </span>
              <span className="wk-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section className="fp-sec" id="featured-projects" aria-labelledby="wkTitle">
        <div className="fp-aurora-1" />
        <div className="fp-noise" />
        <div className="fp-bg-grid" />
        <header className="fp-head">
          <h2 id="wkTitle" className="fp-title">
            Featured <span>Projects</span>
          </h2>
          <p className="fp-sub">A cross-section of recent builds across gyms, hospitality, real estate, and more.</p>
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
          <Link href="/contact" className="fp-cta">
            Start your project →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
