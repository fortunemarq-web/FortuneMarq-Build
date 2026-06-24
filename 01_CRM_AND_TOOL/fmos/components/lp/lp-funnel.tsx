"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Stage = { n: string; t: string; d: string };

/**
 * Interactive funnel whose "active" glow shifts from card to card as the user
 * scrolls through the section (GSAP ScrollTrigger maps scroll progress -> active
 * index). CSS transitions on .is-active make each handoff smooth. Hover glow is
 * reserved for mouse devices so a tap on mobile doesn't leave a sticky highlight.
 */
export default function LpFunnel({ stages, caption, outcome }: { stages: Stage[]; caption: ReactNode; outcome: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".lp-funnel-stage");
      if (!cards.length) return;

      const setActive = (idx: number) => {
        cards.forEach((c, i) => c.classList.toggle("is-active", i === idx));
      };

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top 72%",
        end: "bottom 45%",
        onUpdate: (self) => {
          const idx = Math.max(0, Math.min(cards.length - 1, Math.floor(self.progress * cards.length)));
          setActive(idx);
        },
        onLeaveBack: () => setActive(0),
      });

      return () => st.kill();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="lp-funnel" ref={root}>
      <div className="lp-funnel-cap">{caption}</div>
      {stages.map((p, i) => (
        <div className="lp-funnel-stage reveal-fade" key={p.n} style={{ ["--w" as string]: `${100 - i * 11}%` } as CSSProperties}>
          <div className="lp-funnel-inner">
            <span className="lp-funnel-n">{p.n}</span>
            <div>
              <div className="lp-funnel-t">{p.t}</div>
              <div className="lp-funnel-d">{p.d}</div>
            </div>
          </div>
        </div>
      ))}
      <div className="lp-funnel-out reveal-fade">{outcome}</div>
    </div>
  );
}
