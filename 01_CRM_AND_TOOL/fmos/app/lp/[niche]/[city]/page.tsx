import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  TrendingDown,
  Search,
  MapPin,
  MousePointerClick,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { getNiche, type Lang } from "@/lib/lp/niches";
import { getLpData, inFormat } from "@/lib/lp/data";
import { getLpCopy, fill } from "@/lib/lp/copy";
import BookCta from "@/components/lp/book-cta";
import LangToggle from "@/components/lp/lang-toggle";
import LpAnalytics from "@/components/lp/lp-analytics";
import Reveal from "@/components/lp/reveal";

type Params = Promise<{ niche: string; city: string }>;
type Search = Promise<{ lang?: string }>;

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_BOT_NUMBER || "917975918980";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://fortunemarq.com";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}): Promise<Metadata> {
  const { niche, city } = await params;
  const { lang } = await searchParams;
  const cfg = getNiche(niche, city);
  if (!cfg) return { title: "FortuneMarq" };
  const isKn = lang === "kn";
  const name = isKn ? cfg.nameKn : cfg.nameEn;
  const cityName = isKn ? cfg.cityKn : cfg.cityEn;
  const path = `/lp/${cfg.slug}/${cfg.citySlug}`;
  return {
    title: `${name} Marketing in ${cityName} — Real Search Data | FortuneMarq`,
    description: isKn
      ? `${cityName}ಯಲ್ಲಿ ${name}ಗಾಗಿ ಡೇಟಾ-ಆಧಾರಿತ ಮಾರ್ಕೆಟಿಂಗ್. ${cfg.monthlySearches.toLocaleString("en-IN")} ಮಾಸಿಕ ಸರ್ಚ್‌ಗಳು.`
      : `Data-led marketing for ${name.toLowerCase()} in ${cityName}. ${cfg.monthlySearches.toLocaleString("en-IN")} people search every month — capture them with FortuneMarq.`,
    alternates: {
      canonical: `${SITE}${path}`,
      languages: { en: `${SITE}${path}`, kn: `${SITE}${path}?lang=kn` },
    },
    openGraph: {
      title: `${name} Marketing in ${cityName} | FortuneMarq`,
      url: `${SITE}${path}`,
      type: "website",
    },
  };
}

export default async function NicheLandingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { niche, city } = await params;
  const { lang: langParam } = await searchParams;
  const cfg = getNiche(niche, city);
  if (!cfg || !cfg.enabled) notFound();

  const lang: Lang = langParam === "kn" ? "kn" : "en";
  const c = getLpCopy(lang);
  const data = await getLpData(cfg);

  const name = lang === "kn" ? cfg.nameKn : cfg.nameEn;
  const cityName = lang === "kn" ? cfg.cityKn : cfg.cityEn;
  const customer = lang === "kn" ? cfg.customerKn : cfg.customerEn;
  const pain = lang === "kn" ? cfg.painKn : cfg.painEn;
  const hook = lang === "kn" ? cfg.hookKn : cfg.hookEn;

  const vars = {
    niche: name,
    city: cityName,
    customer,
    volume: inFormat(data.monthlySearches),
    leak: inFormat(data.directoryLeakage),
    topName: cfg.topCompetitorName,
    topTraffic: inFormat(cfg.topCompetitorTraffic),
    visitors: inFormat(data.projection.monthlyVisitors),
    enquiries: inFormat(data.projection.monthlyEnquiries),
    reached: inFormat(data.projection.reachableSearches),
  };
  const t = (s: string) => fill(s, vars);

  const waText = t(
    lang === "kn"
      ? `ಹಲೋ FortuneMarq — ${cityName}ಯಲ್ಲಿ ${name} ಕುರಿತ ನಿಮ್ಮ ಪುಟ ನೋಡಿದೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು.`
      : `Hi FortuneMarq — I saw your page on ${name} in ${cityName}. I'd like to know more.`
  );

  const splitBars = [
    { label: c.splitDirectories, pct: data.split.directories, accent: true },
    { label: c.splitGmb, pct: data.split.gmb, accent: false },
    { label: c.splitRealSites, pct: data.split.realSites, accent: false },
    { label: c.splitSocial, pct: data.split.socialOther, accent: false },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `Digital marketing for ${name}`,
    areaServed: cityName,
    provider: { "@type": "Organization", name: "FortuneMarq", url: SITE },
    description: t(c.heroSubhead),
  };

  return (
    <div className="min-h-screen bg-[#05070d] font-sans text-white selection:bg-brand selection:text-slate-900">
      <LpAnalytics />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[45%] w-[45%] rounded-full bg-brand/10 blur-[140px]" />
        <div className="absolute -right-[10%] top-[40%] h-[35%] w-[35%] rounded-full bg-emerald-500/[0.06] blur-[140px]" />
      </div>

      {/* nav */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-[#05070d]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <img src="/Logo.png" alt="FortuneMarq" className="h-7 w-auto brightness-200" />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> {c.exclusivity}
            </span>
            <LangToggle lang={lang} label={c.langLabel} />
            <a href="#book" className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-slate-900 transition-colors hover:bg-brand-hover">
              {c.navBookCta}
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        {/* HERO — Aware */}
        <section className="grid items-start gap-14 pb-24 pt-14 lg:grid-cols-2">
          <div className="space-y-7">
            <Reveal className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              {t(c.heroEyebrow)}
            </Reveal>
            <Reveal as="h1" delay={60} className="text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              {hook}
            </Reveal>
            <Reveal as="p" delay={120} className="max-w-lg text-lg leading-relaxed text-slate-400">
              {t(c.heroSubhead)}
            </Reveal>
            <Reveal delay={180} className="flex flex-col gap-3 sm:flex-row">
              <a href="#book" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-bold text-slate-900 shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover active:scale-[0.98]">
                {c.heroBook}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10">
                <MessageCircle className="h-4 w-4 text-brand" /> {c.heroWhatsapp}
              </a>
            </Reveal>
            <Reveal delay={240} className="flex items-center gap-2 pt-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand" /> {t(c.heroTrust)}
            </Reveal>

            {/* live data stat strip */}
            <Reveal delay={300} className="grid grid-cols-3 gap-3 pt-4">
              {[
                { v: vars.volume, l: lang === "kn" ? "ಮಾಸಿಕ ಸರ್ಚ್‌ಗಳು" : "monthly searches" },
                { v: vars.leak, l: c.fomoLeakLabel.split("/")[0] || "to directories" },
                { v: vars.topTraffic, l: lang === "kn" ? "ಅಗ್ರ ಸ್ಪರ್ಧಿ ಭೇಟಿಗಳು" : "top rival's visits" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-2xl font-bold text-brand" data-numeric>{s.v}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{s.l}</div>
                </div>
              ))}
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24">
            <BookCta copy={c} industry={cfg.industry} city={cfg.city} nicheSlug={cfg.slug} lang={lang} waNumber={WA_NUMBER} waText={waText} />
          </div>
        </section>

        {/* FOMO — directory leakage + 4-bucket split */}
        <Section eyebrow={c.fomoEyebrow} heading={c.fomoHeading} icon={<TrendingDown className="h-4 w-4" />}>
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal className="space-y-6">
              <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/15 to-transparent p-8">
                <div className="text-5xl font-bold text-brand md:text-6xl" data-numeric>{vars.leak}</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-400">{c.fomoLeakLabel}</div>
              </div>
              <p className="text-lg leading-relaxed text-slate-400">{t(c.fomoBody)}</p>
            </Reveal>

            <Reveal delay={120} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              {splitBars.map((b) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className={b.accent ? "font-semibold text-white" : "text-slate-400"}>{b.label}</span>
                    <span className={b.accent ? "font-bold text-brand" : "text-slate-500"} data-numeric>{b.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div className={b.accent ? "h-full rounded-full bg-brand" : "h-full rounded-full bg-white/20"} style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
              <p className="pt-2 text-xs text-slate-500">{t(c.splitCaption)}</p>
            </Reveal>
          </div>
        </Section>

        {/* PREVIEW — what we'd build (illustrative, never fabricated) */}
        <Section eyebrow={c.previewEyebrow} heading={c.previewHeading} icon={<Sparkles className="h-4 w-4" />}>
          <Reveal as="p" className="-mt-4 mb-8 max-w-2xl text-slate-400">{t(c.previewBody)}</Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            <PreviewCard label={c.previewAdLabel} sample={c.previewSample} icon={<Search className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="inline-block rounded bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold text-brand">Ad</div>
                <div className="h-2.5 w-3/4 rounded bg-white/30" />
                <div className="h-2 w-full rounded bg-white/10" />
                <div className="h-2 w-5/6 rounded bg-white/10" />
                <div className="mt-2 inline-block rounded-md bg-brand px-2 py-1 text-[9px] font-bold text-slate-900">Call now</div>
              </div>
            </PreviewCard>
            <PreviewCard label={c.previewGmbLabel} sample={c.previewSample} icon={<MapPin className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="h-2.5 w-2/3 rounded bg-white/30" />
                <div className="flex gap-1 text-brand">{"★★★★★".split("").map((_, i) => <span key={i} className="text-[10px]">★</span>)}</div>
                <div className="h-2 w-full rounded bg-white/10" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-6 flex-1 rounded bg-white/10" />
                  <div className="h-6 flex-1 rounded bg-white/10" />
                </div>
              </div>
            </PreviewCard>
            <PreviewCard label={c.previewConvLabel} sample={c.previewSample} icon={<MousePointerClick className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="h-2.5 w-3/4 rounded bg-white/30" />
                <div className="h-2 w-full rounded bg-white/10" />
                <div className="h-8 w-full rounded-lg bg-white/[0.07]" />
                <div className="mt-1 h-7 w-full rounded-lg bg-brand/80" />
              </div>
            </PreviewCard>
          </div>
          <Reveal delay={120} className="mt-6">
            <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t(lang === "kn" ? "ನಿಜವಾದ ಗ್ರಾಹಕ ಫಲಿತಾಂಶಗಳನ್ನು ಕಳುಹಿಸಿ" : "Please send me real client results / proof."))}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
              {c.proofLink}
            </a>
          </Reveal>
        </Section>

        {/* PROJECTION — labelled illustrative */}
        <Section eyebrow={c.projEyebrow} heading={c.projHeading} icon={<TrendingDown className="h-4 w-4 rotate-180" />}>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { v: vars.reached, l: c.projReached },
              { v: vars.visitors, l: c.projVisitors },
              { v: vars.enquiries, l: c.projEnquiries },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 90} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
                <div className="text-4xl font-bold text-brand md:text-5xl" data-numeric>{s.v}</div>
                <div className="mt-2 text-sm text-slate-400">{s.l}</div>
              </Reveal>
            ))}
          </div>
          <Reveal as="p" delay={200} className="mt-5 text-center text-xs italic text-slate-500">{t(c.projDisclaimer)}</Reveal>
        </Section>

        {/* DIFFERENTIATION */}
        <Section eyebrow={c.diffEyebrow} heading={c.diffHeading} icon={<ShieldCheck className="h-4 w-4" />}>
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.03] text-sm font-bold uppercase tracking-wide">
              <div className="p-4 text-slate-500">{c.diffTypical}</div>
              <div className="flex items-center gap-2 p-4 text-brand">{c.diffUs}</div>
            </div>
            {c.diffRows.map((row, i) => (
              <Reveal key={i} delay={i * 60} className="grid grid-cols-2 border-b border-white/5 last:border-0">
                <div className="flex items-start gap-2 p-4 text-sm text-slate-500">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" /> {t(row.typical)}
                </div>
                <div className="flex items-start gap-2 bg-brand/[0.04] p-4 text-sm text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {t(row.us)}
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* PATH — how we'd start (upsell path) */}
        <Section eyebrow={c.pathEyebrow} heading={c.pathHeading} icon={<ArrowRight className="h-4 w-4" />}>
          <Reveal as="p" className="-mt-4 mb-8 max-w-2xl text-slate-400">{c.pathBody}</Reveal>
          <div className="flex flex-wrap items-stretch gap-3">
            {cfg.upsellPath.map((step, i) => (
              <Reveal key={step} delay={i * 80} className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-brand">Step {i + 1}</div>
                  <div className="mt-1 font-semibold text-white">{step}</div>
                </div>
                {i < cfg.upsellPath.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />}
              </Reveal>
            ))}
          </div>
          <Reveal as="p" delay={120} className="mt-6 text-sm text-slate-500">
            <span className="font-semibold text-slate-300">{lang === "kn" ? "ಮುಖ್ಯ ಸವಾಲು: " : "Your main challenge: "}</span>{pain}
          </Reveal>
        </Section>

        {/* FINAL CTA */}
        <section className="my-12 overflow-hidden rounded-[2rem] border border-brand/20 bg-gradient-to-br from-brand/15 via-brand/[0.06] to-transparent p-10 text-center md:p-16">
          <Reveal as="h2" className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">{t(c.ctaHeading)}</Reveal>
          <Reveal as="p" delay={80} className="mx-auto mt-4 max-w-xl text-slate-400">{t(c.ctaBody)}</Reveal>
          <Reveal delay={160} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#book" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-7 py-4 font-bold text-slate-900 shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover active:scale-[0.98]">
              {c.ctaBook} <ArrowRight className="h-4 w-4" />
            </a>
            <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition-all hover:bg-white/10">
              <MessageCircle className="h-4 w-4 text-brand" /> {c.ctaWhatsapp}
            </a>
          </Reveal>
        </section>
      </main>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="FortuneMarq" className="h-6 w-auto opacity-60" />
            <span className="text-sm text-slate-500">{c.footerTagline}</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 FortuneMarq · Hubli, Karnataka · +91 93530 82656</p>
        </div>
      </footer>

      {/* mobile sticky CTA */}
      <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
        <a href="#book" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-slate-900 shadow-2xl shadow-brand/40">
          {c.navBookCta} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  heading,
  icon,
  children,
}: {
  eyebrow: string;
  heading: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/5 py-20">
      <Reveal className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand">
          {icon} {eyebrow}
        </div>
        <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">{heading}</h2>
      </Reveal>
      {children}
    </section>
  );
}

function PreviewCard({
  label,
  sample,
  icon,
  children,
}: {
  label: string;
  sample: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-brand">{icon}</div>
      <div className="rounded-2xl border border-white/10 bg-[#0a0e16] p-4">{children}</div>
      <div className="mt-3 text-sm font-semibold text-white">{label}</div>
      <div className="mt-1 text-[11px] italic text-slate-600">{sample}</div>
    </Reveal>
  );
}
