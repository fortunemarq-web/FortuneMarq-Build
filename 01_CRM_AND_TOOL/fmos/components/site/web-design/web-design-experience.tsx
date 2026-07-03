"use client";

// /web-design — cinematic, scroll-driven sales page for FortuneMarq's website
// service. The page sells by demonstration: a WebGL hero, a pinned "site builds
// itself" sequence, a parallax work showcase, and animated proof (Lighthouse
// rings, load-time bars, a conversion funnel that fills as you scroll).
//
// Motion strategy mirrors site-motion.tsx: ScrollTrigger is already registered
// globally; generic reveals/parallax reuse the site's data-reveal / data-parallax
// conventions (handled by SiteMotion). Only the bespoke choreography lives here,
// scoped to a gsap.context and fully reverted on unmount. Reduced motion resolves
// every animated value to its final state.

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CONTACT = "/contact";
const WA = "https://wa.me/919353082656?text=" + encodeURIComponent("Hi FortuneMarq — I want a website that converts.");

// Premium stock placeholders (owner chose stock). Each falls back to a real
// local site asset if the CDN image fails, so the showcase never renders broken.
// Swap `src` for real client screenshots later — one line each.
const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const SHIPPED = { src: U("1559028012-481c04fa702d"), fallback: "/site/images/svc-web.jpg" };

// Illustrative sample design directions (NOT client results — per the §2.2 honesty
// rule). No real company names, no fabricated metrics. Real client results are shared
// on request (gated proof). Swap `src` for real screenshots once you have consent.
const WORK = [
  { src: U("1460925895917-afdab827c52f"), fallback: "/site/images/analytics.webp", type: "Healthcare clinic", style: "Booking-first site" },
  { src: U("1517245386807-bb43f82c33c4"), fallback: "/site/images/scroll-to-reveal-1.webp", type: "Interior studio", style: "Editorial portfolio" },
  { src: U("1556742049-0cfed4f6a45d"), fallback: "/site/images/scroll-to-reveal-2.webp", type: "Real estate", style: "Lead-capture funnel" },
  { src: U("1467232004584-a241de8bcf5d"), fallback: "/site/images/scroll-to-reveal-3.webp", type: "Fitness brand", style: "High-tempo landing page" },
];

const RINGS = [
  { name: "Performance", value: 100 },
  { name: "SEO", value: 100 },
  { name: "Accessibility", value: 98 },
  { name: "Best Practices", value: 100 },
];

const FUNNEL = [
  { label: "Visitors", value: 10000, cls: "wd-f1" },
  { label: "Engaged", value: 6400, cls: "wd-f2" },
  { label: "Leads", value: 1200, cls: "wd-f3" },
  { label: "Customers", value: 340, cls: "wd-f4" },
];

const STACK = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel Edge", "Supabase", "Core Web Vitals"];

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>, fallback: string) => {
  const el = e.currentTarget;
  if (el.src.indexOf(fallback) === -1) el.src = fallback;
};

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

export default function WebDesignExperience() {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const q = <T extends Element = HTMLElement>(sel: string) => Array.from(el.querySelectorAll<T>(sel));
    const setStage = (n: number) => {
      q(".wd-build-stage").forEach((s, i) => s.classList.toggle("is-active", i === n));
      q(".wd-device-stage").forEach((s, i) => s.classList.toggle("is-active", i === n));
      q(".wd-build-rail i").forEach((r, i) => r.classList.toggle("is-active", i <= n));
      const device = el.querySelector(".wd-device");
      if (device) device.classList.toggle("stage-3", n === 2);
    };

    const countTo = (node: Element | null, to: number, fmt: (v: number) => string) => {
      if (!node) return;
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => { node.textContent = fmt(o.v); } });
    };
    const intFmt = (v: number) => Math.round(v).toLocaleString("en-IN");

    if (reduce) {
      // Resolve everything to its end state — no scroll choreography.
      setStage(2);
      q<SVGCircleElement>(".wd-ring-fill").forEach((c, i) => {
        const val = RINGS[i].value;
        c.style.strokeDasharray = String(RING_C);
        c.style.strokeDashoffset = String(RING_C * (1 - val / 100));
      });
      q(".wd-ring-num").forEach((n, i) => (n.textContent = String(RINGS[i].value)));
      q(".wd-funnel-num").forEach((n, i) => (n.textContent = intFmt(FUNNEL[i].value)));
      return;
    }

    const ctx = gsap.context(() => {
      setStage(0);

      // ── pinned build sequence (CSS sticky drives the pin; we read progress) ──
      const track = el.querySelector(".wd-build-track");
      if (track) {
        ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const n = Math.min(2, Math.floor(self.progress * 3));
            setStage(n);
          },
        });
      }

      // ── Lighthouse rings — sweep to score + count up ─────────────────────────
      const rings = q<SVGCircleElement>(".wd-ring-fill");
      rings.forEach((c) => {
        c.style.strokeDasharray = String(RING_C);
        c.style.strokeDashoffset = String(RING_C);
      });
      ScrollTrigger.create({
        trigger: ".wd-rings",
        start: "top 80%",
        once: true,
        onEnter: () => {
          rings.forEach((c, i) => {
            gsap.to(c, { strokeDashoffset: RING_C * (1 - RINGS[i].value / 100), duration: 1.8, ease: "power2.out", delay: i * 0.12 });
          });
          q(".wd-ring-num").forEach((n, i) => countTo(n, RINGS[i].value, (v) => String(Math.round(v))));
        },
      });

      // ── load-time bars ───────────────────────────────────────────────────────
      ScrollTrigger.create({
        trigger: ".wd-bars",
        start: "top 85%",
        once: true,
        onEnter: () => {
          q(".wd-bar-fill").forEach((b) => {
            const final = (b as HTMLElement).dataset.final || "60";
            gsap.to(b, { width: final + "%", duration: 1.4, ease: "power2.out" });
          });
        },
      });

      // ── conversion funnel — fill + count as it enters ────────────────────────
      ScrollTrigger.create({
        trigger: ".wd-funnel",
        start: "top 82%",
        once: true,
        onEnter: () => {
          q(".wd-funnel-fill").forEach((f, i) => {
            gsap.fromTo(f, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.out", delay: i * 0.14 });
          });
          q(".wd-funnel-num").forEach((n, i) => countTo(n, FUNNEL[i].value, intFmt));
        },
      });

      // ── work cards rise in ───────────────────────────────────────────────────
      q(".wd-work-card").forEach((card) => {
        gsap.from(card, {
          y: 56, opacity: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        });
      });

      // ── stack chips pop ──────────────────────────────────────────────────────
      gsap.from(".wd-chip", {
        y: 22, opacity: 0, duration: 0.5, stagger: 0.05, ease: "back.out(1.6)",
        scrollTrigger: { trigger: ".wd-stack-chips", start: "top 88%", once: true },
      });

      const r = setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => clearTimeout(r);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="wd-page" ref={root}>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="wd-hero">
        <div className="wd-hero-bg">
          <div className="wd-hero-aurora wd-a1" />
          <div className="wd-hero-aurora wd-a2" />
          <div className="wd-grid-bg" />
        </div>
        <div className="wd-hero-vignette" />
        <div className="wd-hero-inner">
          <span className="wd-eyebrow"><span className="wd-eyebrow-num">FortuneMarq</span> · Website Design &amp; Development</span>
          <h1 className="wd-hero-title" data-reveal="lines">
            Websites that <span className="wd-italic">sell while you sleep.</span>
          </h1>
          <p className="wd-hero-sub reveal-fade">
            Pixel-perfect design meets <b>bulletproof code</b>. We engineer fast, search-ready
            sites that turn scrollers into customers — the kind that make people think
            <b> &ldquo;damn, who built this?&rdquo;</b>
          </p>
          <div className="wd-actions reveal-fade">
            <a className="wd-btn wd-btn-primary" href={CONTACT}>Start your project</a>
            <a className="wd-btn wd-btn-ghost" href="#wd-work">See the work</a>
            <a className="wd-btn wd-btn-wa" href={WA} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
        <div className="wd-hero-scroll"><span>SCROLL</span><span className="wd-mouse" /></div>
      </section>

      {/* ───────────────────────── PROBLEM ───────────────────────── */}
      <section className="wd-section wd-problem">
        <div className="wd-aurora" />
        <div className="wd-container">
          <span className="wd-eyebrow" style={{ marginBottom: 28 }}><span className="wd-eyebrow-num">01</span> · The gap</span>
          <p className="wd-statement" data-reveal="lines">
            Most websites are <span className="wd-dim">digital brochures.</span> Yours should be a <span className="wd-accent">growth engine.</span>
          </p>
          <p className="wd-lead reveal-fade" style={{ margin: "28px auto 0", textAlign: "center" }}>
            A pretty site that doesn&rsquo;t convert is an expensive business card. We design
            for the one number that matters: customers won.
          </p>
        </div>
      </section>

      {/* ───────────────────────── BUILD (pinned) ───────────────────────── */}
      <section className="wd-build">
        <div className="wd-build-track">
          <div className="wd-build-pin">
            <div className="wd-build-grid" />
            <div className="wd-build-rail"><i /><i /><i /></div>
            <div className="wd-build-inner">
              <div className="wd-build-copy">
                <div className="wd-build-stage">
                  <div className="wd-build-step">STAGE 01 · WIREFRAME</div>
                  <h3 className="wd-build-h">Structure before style.</h3>
                  <p className="wd-build-p">Every page is mapped to a journey — what the visitor sees, feels, and clicks — before a single pixel is designed.</p>
                </div>
                <div className="wd-build-stage">
                  <div className="wd-build-step">STAGE 02 · DESIGN</div>
                  <h3 className="wd-build-h">A look that earns trust.</h3>
                  <p className="wd-build-p">Bold typography, real brand colour, intentional motion. The kind of design that makes a small business look like the market leader.</p>
                </div>
                <div className="wd-build-stage">
                  <div className="wd-build-step">STAGE 03 · SHIP</div>
                  <h3 className="wd-build-h">Fast, ranked, live.</h3>
                  <p className="wd-build-p">Hand-coded, Core-Web-Vitals-green, SEO-built and deployed on edge infrastructure. Loads in under a second, anywhere.</p>
                </div>
              </div>

              <div className="wd-device">
                <div className="wd-device-bar"><i /><i /><i /><span className="wd-device-url">fortunemarq.com</span></div>
                <span className="wd-ship-badge">● Live</span>
                {/* stage 1 — wireframe */}
                <div className="wd-device-stage">
                  <div className="wd-wire">
                    <div className="bar w1" /><div className="bar w2" /><div className="bar w3" />
                    <div className="blocks"><span /><span /><span /></div>
                  </div>
                </div>
                {/* stage 2 — design */}
                <div className="wd-device-stage wd-design">
                  <div className="hero-row">
                    <span className="pill">● GROWTH-READY</span>
                    <div className="htxt" /><div className="htxt s" />
                  </div>
                  <div className="cards"><span /><span /><span /></div>
                </div>
                {/* stage 3 — shipped */}
                <div className="wd-device-stage wd-shipped">
                  <img src={SHIPPED.src} alt="Sample of a shipped website" loading="lazy" onError={(e) => onImgError(e, SHIPPED.fallback)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── WORK ───────────────────────── */}
      <section className="wd-section wd-work" id="wd-work">
        <div className="wd-aurora" />
        <div className="wd-container">
          <div className="wd-head">
            <span className="wd-eyebrow"><span className="wd-eyebrow-num">02</span> · Sample directions</span>
            <h2 className="wd-h2" data-reveal="lines">Design built around the goal.</h2>
            <p className="wd-lead reveal-fade">Illustrative directions across the industries we serve — sample layouts, not client results. <a className="wd-inline-link" href={CONTACT}>See real client results on request →</a></p>
          </div>
          <div className="wd-work-grid">
            {WORK.map((w) => (
              <article className="wd-work-card" key={w.type}>
                <div className="wd-work-shot" data-parallax="0.1">
                  <img src={w.src} alt={`${w.type} — sample design`} loading="lazy" onError={(e) => onImgError(e, w.fallback)} />
                  <span className="wd-work-flag">Illustrative</span>
                </div>
                <div className="wd-work-meta">
                  <h3 className="wd-work-name">{w.type}</h3>
                  <span className="wd-work-tag">{w.style}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── PROOF ───────────────────────── */}
      <section className="wd-section wd-proof">
        <div className="wd-aurora" />
        <div className="wd-container">
          <div className="wd-head">
            <span className="wd-eyebrow"><span className="wd-eyebrow-num">03</span> · The standard</span>
            <h2 className="wd-h2" data-reveal="lines">Beautiful is the baseline. We engineer for the metrics.</h2>
            <p className="wd-lead reveal-fade">The Lighthouse scores and load budget every site we ship is built to hit — measured, not promised.</p>
          </div>
          <div className="wd-proof-grid">
            <div>
              <div className="wd-rings">
                {RINGS.map((ring) => (
                  <div className="wd-ring" key={ring.name}>
                    <svg className="wd-ring-svg" viewBox="0 0 120 120">
                      <circle className="wd-ring-track" cx="60" cy="60" r={RING_R} />
                      <circle className="wd-ring-fill" cx="60" cy="60" r={RING_R} />
                    </svg>
                    <div className="wd-ring-label">
                      <span className="wd-ring-num">0</span>
                      <span className="wd-ring-name">{ring.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="wd-ring-cap">Lighthouse targets every build ships to — we don&rsquo;t go live until they&rsquo;re green.</p>
              <div className="wd-bars">
                <div className="wd-bar-row">
                  <div className="wd-bar-top"><span>FortuneMarq build target</span><b>&lt; 1.0s</b></div>
                  <div className="wd-bar-track"><div className="wd-bar-fill" data-final="23" /></div>
                </div>
                <div className="wd-bar-row">
                  <div className="wd-bar-top"><span>Industry average</span><b>~3.5s</b></div>
                  <div className="wd-bar-track"><div className="wd-bar-fill is-slow" data-final="100" /></div>
                </div>
                <p className="wd-work-tag" style={{ marginTop: 4 }}>Page load time — our build budget vs industry average · illustrative</p>
              </div>
            </div>

            <div>
              <span className="wd-eyebrow" style={{ marginBottom: 22 }}>Conversion funnel · illustrative</span>
              <div className="wd-funnel">
                {FUNNEL.map((f) => (
                  <div className={`wd-funnel-row ${f.cls}`} key={f.label}>
                    <span className="wd-funnel-fill" />
                    <span className="wd-funnel-label">{f.label}</span>
                    <span className="wd-funnel-val"><span className="wd-funnel-num">0</span></span>
                  </div>
                ))}
              </div>
              <p className="wd-lead reveal-fade" style={{ marginTop: 22, fontSize: 14 }}>
                Typical funnel math — not a client result. We don&rsquo;t just send you traffic; we design the path from first visit to paying customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── STACK ───────────────────────── */}
      <section className="wd-section wd-stack">
        <div className="wd-container">
          <div className="wd-head">
            <span className="wd-eyebrow"><span className="wd-eyebrow-num">04</span> · Under the hood</span>
            <h2 className="wd-h2" data-reveal="lines">The same stack that powers this site.</h2>
            <p className="wd-lead reveal-fade">No drag-and-drop templates. Hand-built on the modern web stack — so your site is fast, secure, and yours.</p>
          </div>
          <div className="wd-stack-chips">
            {STACK.map((s) => (
              <span className="wd-chip" key={s}><span className="dot">▹</span>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="wd-section wd-cta">
        <div className="wd-aurora" />
        <div className="wd-container">
          <div className="wd-cta-price">Websites from ₹8,000 · one-time</div>
          <h2 className="wd-cta-h" data-reveal="lines">Let&rsquo;s build your <span className="wd-italic">best salesperson.</span></h2>
          <p className="wd-cta-sub reveal-fade">Tell us about your business. We&rsquo;ll come back with a plan, a timeline, and a site that earns its keep.</p>
          <div className="wd-actions">
            <a className="wd-btn wd-btn-primary" href={CONTACT}>Start your project</a>
            <a className="wd-btn wd-btn-wa" href={WA} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}
