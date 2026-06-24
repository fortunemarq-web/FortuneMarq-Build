import "../../../site/site.css";
import "./lp.css";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNiche, enabledNiches, type Lang } from "@/lib/lp/niches";
import { getLpData } from "@/lib/lp/data";
import { getLpCopy, fill } from "@/lib/lp/copy";
import { getLpSections } from "@/lib/lp/lp-sections";
import BookCta from "@/components/lp/book-cta";
import ResponsiveShowcase from "@/components/lp/responsive-showcase";
import LpFunnel from "@/components/lp/lp-funnel";
import SplitHeading from "@/components/lp/split-heading";
import GapBars from "@/components/lp/gap-bars";
import SystemBuild from "@/components/lp/system-build";
import SideRays from "@/components/lp/side-rays";
import FloatingCall from "@/components/lp/floating-call";
import SiteChat from "@/components/site/site-chat";
import LpNav from "@/components/lp/lp-nav";
import LpAnalytics from "@/components/lp/lp-analytics";
import SiteMotion from "@/components/site/site-motion";
import SiteFooter from "@/components/site/site-footer";

type Params = Promise<{ niche: string; city: string }>;
type Search = Promise<{ lang?: string }>;

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_BOT_NUMBER || "917975918980";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";
const DASH = "/site/images";
const inr = (n: number) => n.toLocaleString("en-IN");

// partnership + certification logos (mirrors the marketing site)
const PARTNERS = [
  { src: "Google-Partner-logo.webp", alt: "Google Partner" },
  { src: "meta-business-partner-logo.webp", alt: "Meta Business Partner" },
  { src: "shopify-partner-logo.webp", alt: "Shopify Partner" },
  { src: "hubspot-solutions.webp", alt: "HubSpot Solutions Partner" },
  { src: "semrush.webp", alt: "Semrush", extra: "lp-logo-semrush" },
  { src: "linkedin-partner.webp", alt: "LinkedIn Partner" },
  { src: "GA-certified.webp", alt: "Google Analytics Certified" },
  { src: "microsoft-advertising-partner.webp", alt: "Microsoft Advertising Partner" },
];

// Pre-render every enabled niche×city combo (ISR-ready); others render on demand.
export function generateStaticParams() {
  return enabledNiches().map((n) => ({ niche: n.slug, city: n.citySlug }));
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const { niche, city } = await params;
  const { lang } = await searchParams;
  const cfg = getNiche(niche, city);
  if (!cfg) return { title: "FortuneMarq" };
  const isKn = lang === "kn";
  const name = isKn ? cfg.nameKn : cfg.nameEn;
  const cityName = isKn ? cfg.cityKn : cfg.cityEn;
  const path = `/lp/${cfg.slug}/${cfg.citySlug}`;
  // live search volume (cached → no extra DB hit; matches the number on the page)
  const data = await getLpData(cfg);
  return {
    title: `${name} Marketing in ${cityName} — Real Search Data | FortuneMarq`,
    description: `Data-led marketing for ${name.toLowerCase()} in ${cityName}. ${data.monthlySearches.toLocaleString("en-IN")} people search every month — capture them with FortuneMarq.`,
    alternates: { canonical: `${SITE}${path}`, languages: { en: `${SITE}${path}`, kn: `${SITE}${path}?lang=kn` } },
    openGraph: { title: `${name} Marketing in ${cityName} | FortuneMarq`, url: `${SITE}${path}`, type: "website", images: [{ url: "/site/images/og-default.png" }] },
  };
}

export default async function NicheLandingPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { niche, city } = await params;
  const { lang: langParam } = await searchParams;
  const cfg = getNiche(niche, city);
  if (!cfg || !cfg.enabled) notFound();

  const lang: Lang = langParam === "kn" ? "kn" : "en";
  const c = getLpCopy(lang);
  const data = await getLpData(cfg);
  // Low/no real demand (< 1000 searches) → "lead the market via Meta ads" angle
  // instead of the search-capture angle (and never show a fabricated search number).
  const presence = !data.hasData || data.monthlySearches < 1000;

  const isKn = lang === "kn";
  const name = isKn ? cfg.nameKn : cfg.nameEn;
  const cityName = isKn ? cfg.cityKn : cfg.cityEn;
  const singular = isKn ? cfg.singularKn ?? cfg.singularEn : cfg.singularEn;
  const customer = isKn ? cfg.customerKn : cfg.customerEn;

  const s = getLpSections(lang);

  // SERP split = single source of truth. The directories-leak number is derived
  // from the SAME % shown on its bar, so the headline figure and the bar always agree.
  const SPLIT = { gbp: 40, directories: 30, niche: 20, social: 10 };
  const leakNum = Math.round((data.monthlySearches * SPLIT.directories) / 100);

  const tk = { city: cityName, singular, niche: name, customer, volume: inr(data.monthlySearches), leak: inr(leakNum) };
  const f = (str: string) => fill(str, tk);

  // WA prefill keeps English names (internal routing/readability)
  const waText = `Hi FortuneMarq — I saw your page on ${cfg.nameEn} in ${cfg.cityEn}. I'd like the full data.`;
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;

  const bars = [
    { label: f(s.gap.barGbp), pct: SPLIT.gbp, lead: true },
    { label: f(s.gap.barDirectories), pct: SPLIT.directories, lead: false },
    { label: f(s.gap.barNiche), pct: SPLIT.niche, lead: false },
    { label: f(s.gap.barSocial), pct: SPLIT.social, lead: false },
  ];

  const whyUs = s.why.items.map((it, i) => ({ n: String(i + 1).padStart(2, "0"), t: f(it.title), d: f(it.desc) }));
  const buildSteps = s.build.steps.map((st) => ({ tag: f(st.tag), title: f(st.title), desc: f(st.desc) }));

  return (
    <div className="lp-root">
      <LpAnalytics />
      <SiteMotion />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="global-noise" />
      <div className="lp-atmos" aria-hidden="true" />
      <div className="lp-aurora lp-aurora-1" aria-hidden="true" />
      <div className="lp-aurora lp-aurora-2" aria-hidden="true" />
      <div className="lp-aurora lp-aurora-3" aria-hidden="true" />

      {/* NAV */}
      <LpNav lang={lang} langLabel={c.langLabel} bookLabel={s.navBook} />

      <main>
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-rays" aria-hidden="true">
            <SideRays origin="top-right" rayColor1="#42CA80" rayColor2="#1E7A4F" speed={2} spread={1.4} intensity={1.7} falloff={1.7} saturation={1.3} blend={0.7} opacity={0.62} />
          </div>
          <div className="lp-hero-veil" aria-hidden="true" />
          <div className="lp-wrap lp-hero-solo">
            <span className="lp-eyebrow">{name} · {cityName}</span>
            <h1 className="lp-h1 reveal-fade" style={{ marginTop: 24 }}>{f(presence ? s.presence.heroH1a : s.hero.h1a)}<em>{f(presence ? s.presence.heroH1b : s.hero.h1b)}</em></h1>
            <p className="lp-desc reveal-fade" style={{ marginTop: 24 }}>{f(presence ? s.presence.heroSub : s.hero.sub)}</p>
            <div className="lp-hero-actions reveal-fade">
              <a href="#book" className="lp-btn lp-btn-primary" data-magnetic>{s.hero.book}</a>
              <a href={waHref} target="_blank" rel="noreferrer" className="lp-btn">{s.hero.whatsapp}</a>
            </div>
            <div className="lp-hero-trust reveal-fade">
              <span className="lp-stars" aria-hidden="true">★★★★★</span>
              <span>{f(s.hero.trust)}</span>
            </div>
            {presence ? (
              <div className="lp-stats reveal-fade">
                {s.presence.chips.map((ch, i) => (
                  <div className={`lp-stat${i === 0 ? " accent" : ""}`} key={i}><div className="lp-stat-num">{ch.n}</div><div className="lp-stat-label">{ch.l}</div></div>
                ))}
              </div>
            ) : (
              <div className="lp-stats reveal-fade">
                <div className="lp-stat"><div className="lp-stat-num">{inr(data.monthlySearches)}</div><div className="lp-stat-label">{s.hero.statSearches}</div></div>
                <div className="lp-stat accent"><div className="lp-stat-num">{inr(leakNum)}</div><div className="lp-stat-label">{s.hero.statLost}</div></div>
                <div className="lp-stat"><div className="lp-stat-num">{inr(data.projection.reachableSearches)}</div><div className="lp-stat-label">{s.hero.statReach}</div></div>
              </div>
            )}
          </div>

          {/* partnership + certification carousel */}
          <div className="lp-wrap reveal-fade">
            <div className="lp-marquee-label">{s.hero.logos}</div>
            <div className="lp-marquee">
              <div className="lp-marquee-track">
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                  <div className="lp-logo-chip" key={i} aria-hidden={i >= PARTNERS.length}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${DASH}/${p.src}`} alt={i < PARTNERS.length ? p.alt : ""} className={`lp-logo${p.extra ? " " + p.extra : ""}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lp-hero-divider" aria-hidden="true" />
        </section>

        {/* THE GAP / THE OPPORTUNITY */}
        <section className="lp-sec">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <span className="lp-eyebrow">{presence ? s.presence.gapEyebrow : s.gap.eyebrow}</span>
              <SplitHeading className="lp-h2" text={f(presence ? s.presence.gapHeading : s.gap.heading)} />
              <p className="lp-desc">{f(presence ? s.presence.gapBody : s.gap.body)}</p>
            </div>
            {presence ? (
              <div className="lp-pts">
                {s.presence.points.map((p, i) => (
                  <div className="lp-pt reveal-fade" key={i}>
                    <div className="lp-pt-n">{String(i + 1).padStart(2, "0")}</div>
                    <div className="lp-pt-t">{f(p.t)}</div>
                    <div className="lp-pt-d">{f(p.d)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="lp-gap-grid">
                <div className="reveal-fade">
                  <div className="lp-bignum">{inr(data.monthlySearches)}</div>
                  <div className="lp-bignum-label">{f(s.gap.totalLabel)}</div>
                  <div className="lp-bignum-sub">{f(s.gap.leakNote)}</div>
                </div>
                <GapBars bars={bars} />
              </div>
            )}
          </div>
        </section>

        {/* HOW IT'S BUILT — CardSwap system showcase */}
        <SystemBuild eyebrow={s.build.eyebrow} heading={s.build.heading} steps={buildSteps} />

        {/* RESPONSIVE WEBSITE SHOWCASE — GSAP scroll-resize */}
        <ResponsiveShowcase
          eyebrow={s.responsive.eyebrow}
          heading={s.responsive.heading}
          body={s.responsive.body}
          tagMobile={s.responsive.tagMobile}
          tagTablet={s.responsive.tagTablet}
          tagDesktop={s.responsive.tagDesktop}
          shots={cfg.siteShots ?? "dental-site"}
        />

        {/* WHY CHOOSE US — interactive funnel design */}
        <section className="lp-sec">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <span className="lp-eyebrow">{s.why.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="lines">{s.why.heading}</h2>
              <p className="lp-desc">{f(s.why.body)}</p>
            </div>
            <LpFunnel stages={whyUs} caption={<><b>{f(s.why.captionLead)}</b> {f(s.why.captionRest)}</>} outcome={f(s.why.outcome)} />
          </div>
        </section>

        {/* BOOK */}
        <section className="lp-sec" id="book">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <span className="lp-eyebrow">{s.book.eyebrow}</span>
              <h2 className="lp-h2" data-reveal="lines">{f(s.book.heading)}</h2>
            </div>
            <div className="lp-book-grid">
              <div className="reveal-fade">
                <p className="lp-desc">{f(s.book.body)}</p>
                <a href={waHref} target="_blank" rel="noreferrer" className="lp-btn" style={{ marginTop: 28 }}>{s.book.whatsapp}</a>
                <div className="lp-trust">{f(s.book.trust)}</div>
              </div>
              <div className="lp-book-form">
                <BookCta copy={c} industry={cfg.industry} city={cfg.city} nicheSlug={cfg.slug} lang={lang} waNumber={WA_NUMBER} waText={waText} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* same chatbot as the marketing site (bottom-left) + floating call (bottom-right) */}
      <SiteChat industry={cfg.industry} city={cfg.city} />
      <FloatingCall label={s.callAria} niche={cfg.slug} city={cfg.city} />
    </div>
  );
}
