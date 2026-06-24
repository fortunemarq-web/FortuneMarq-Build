"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const IMG = "/site/lp/img";

/**
 * Scroll-scrubbed "any size" website showcase (GSAP ScrollTrigger).
 * A single screen frame morphs phone → tablet → desktop as you scroll,
 * crossfading three real responsive screenshots of THIS niche's mock site
 * (`shots` = base name → {base}-{mobile,tablet,desktop}.png). Pinned in place
 * like gsap.com/scroll. Falls back to a static frame when JS is off / reduced-motion.
 */
export default function ResponsiveShowcase({ eyebrow, heading, body, tagMobile, tagTablet, tagDesktop, shots }: { eyebrow: string; heading: string; body: string; tagMobile: string; tagTablet: string; tagDesktop: string; shots: string }) {
  const mobileSrc = `${IMG}/${shots}-mobile.png`;
  const tabletSrc = `${IMG}/${shots}-tablet.png`;
  const desktopSrc = `${IMG}/${shots}-desktop.png`;
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fallback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || !frame.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // available drawing area
        const vh = () => window.innerHeight;
        const vw = () => window.innerWidth;
        const H = () => Math.min(vh() * 0.6, 540);

        const phone = () => {
          const h = H() * 1.05;
          return { w: h * (390 / 844), h };
        };
        const tablet = () => {
          const h = H() * 1.02;
          return { w: h * (834 / 1112), h };
        };
        const desktop = () => {
          const w = Math.min(H() * 1.6, vw() * 0.9);
          return { w, h: w * (900 / 1440) };
        };

        // start state = phone
        const p = phone();
        gsap.set(frame.current, { width: p.w, height: p.h });
        gsap.set("#rs-img-mobile", { opacity: 1 });
        gsap.set(["#rs-img-tablet", "#rs-img-desktop"], { opacity: 0 });
        gsap.set("#rs-tag-mobile", { opacity: 1 });
        gsap.set(["#rs-tag-tablet", "#rs-tag-desktop"], { opacity: 0 });

        if (stage.current) stage.current.style.opacity = "1";
        if (fallback.current) fallback.current.style.display = "none";

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".rs-viewport",
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * 1.1),
            scrub: 1,
            pin: ".rs-viewport",
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // phase A: phone -> tablet
        tl.addLabel("a", 0)
          .to(frame.current, { width: () => tablet().w, height: () => tablet().h, duration: 1 }, "a")
          .to("#rs-img-mobile", { opacity: 0, duration: 0.4 }, "a+=0.3")
          .to("#rs-img-tablet", { opacity: 1, duration: 0.4 }, "a+=0.3")
          .to("#rs-tag-mobile", { opacity: 0, duration: 0.3 }, "a+=0.35")
          .to("#rs-tag-tablet", { opacity: 1, duration: 0.3 }, "a+=0.35")
          // phase B: tablet -> desktop
          .addLabel("b", 1)
          .to(frame.current, { width: () => desktop().w, height: () => desktop().h, duration: 1 }, "b")
          .to("#rs-img-tablet", { opacity: 0, duration: 0.4 }, "b+=0.3")
          .to("#rs-img-desktop", { opacity: 1, duration: 0.4 }, "b+=0.3")
          .to("#rs-tag-tablet", { opacity: 0, duration: 0.3 }, "b+=0.35")
          .to("#rs-tag-desktop", { opacity: 1, duration: 0.3 }, "b+=0.35");
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="lp-sec rs" ref={root}>
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <span className="lp-eyebrow">{eyebrow}</span>
          <h2 className="lp-h2" data-reveal="lines">{heading}</h2>
          <p className="lp-desc">{body}</p>
        </div>
      </div>

      <div className="rs-viewport">
        {/* animated stage (revealed by JS) */}
        <div className="rs-stage" ref={stage}>
          <div className="rs-frame" ref={frame}>
            {/* eslint-disable @next/next/no-img-element */}
            <img id="rs-img-desktop" className="rs-img" src={desktopSrc} alt="Website on desktop" />
            <img id="rs-img-tablet" className="rs-img" src={tabletSrc} alt="Website on tablet" />
            <img id="rs-img-mobile" className="rs-img" src={mobileSrc} alt="Website on mobile" />
            {/* eslint-enable @next/next/no-img-element */}
          </div>
          <div className="rs-tags">
            <span id="rs-tag-mobile" className="rs-tag">{tagMobile}</span>
            <span id="rs-tag-tablet" className="rs-tag">{tagTablet}</span>
            <span id="rs-tag-desktop" className="rs-tag">{tagDesktop}</span>
          </div>
        </div>

        {/* static fallback (no JS / reduced motion) */}
        <div className="rs-fallback" ref={fallback}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rs-fallback-img m" src={mobileSrc} alt="Website on mobile" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rs-fallback-img d" src={desktopSrc} alt="Website on desktop" />
        </div>
      </div>
    </section>
  );
}
