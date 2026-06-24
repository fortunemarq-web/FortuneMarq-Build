"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Bar = { label: string; pct: number; lead?: boolean };

/**
 * Gap-section bars. Each bar fills from 0% to its target on scroll-in, at a
 * constant speed (duration ∝ percentage) so the longer bars take proportionally
 * longer — they "grow according to their percentage" — with the number counting
 * up in sync. SSR renders the final values; reduced-motion shows them static.
 */
export default function GapBars({ bars }: { bars: Bar[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".gb-row");
      // hide to 0 before the section scrolls into view (it starts below the fold)
      rows.forEach((row) => {
        gsap.set(row.querySelector(".lp-bar-fill"), { width: "0%" });
        const num = row.querySelector(".lp-bar-num");
        if (num) num.textContent = "0%";
      });

      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      rows.forEach((row, i) => {
        const pct = Number(row.dataset.pct || 0);
        const fill = row.querySelector(".lp-bar-fill");
        const num = row.querySelector(".lp-bar-num");
        const dur = Math.max(0.7, pct / 22); // constant fill speed
        tl.to(fill, { width: `${pct}%`, duration: dur, ease: "power2.out" }, i * 0.16);
        const counter = { v: 0 };
        tl.to(counter, { v: pct, duration: dur, ease: "power2.out", onUpdate: () => { if (num) num.textContent = `${Math.round(counter.v)}%`; } }, i * 0.16);
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="lp-bars" ref={root}>
      {bars.map((b) => (
        <div className="gb-row" key={b.label} data-pct={b.pct}>
          <div className={`lp-bar-top${b.lead ? " lead" : ""}`}>
            <span className="n">{b.label}</span>
            <span className="p lp-bar-num">{b.pct}%</span>
          </div>
          <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: `${b.pct}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
