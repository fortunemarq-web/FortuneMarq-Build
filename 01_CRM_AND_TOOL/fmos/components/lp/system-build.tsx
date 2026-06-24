"use client";

import { useState } from "react";
import CardSwap, { Card } from "@/components/lp/card-swap";

const DASH = "/site/images";
// fixed imagery per step (index-aligned with the copy passed in)
const IMAGES = ["card-website.webp", "card-maps.webp", "card-ads.webp", "card-crm.webp", "card-automation.webp"];

export type SbStep = { tag: string; title: string; desc: string };

export default function SystemBuild({ eyebrow, heading, steps }: { eyebrow: string; heading: string; steps: SbStep[] }) {
  const [active, setActive] = useState(0);
  const cards = steps.map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0"), img: `${DASH}/${IMAGES[i % IMAGES.length]}` }));

  return (
    <section className="lp-sec sb">
      <div className="lp-wrap sb-grid">
        <div className="sb-head">
          <span className="lp-eyebrow">{eyebrow}</span>
          <h2 className="lp-h2" data-reveal="lines">{heading}</h2>
        </div>

        <div className="sb-stage">
          <CardSwap
            width={400}
            height={270}
            cardDistance={52}
            verticalDistance={54}
            delay={3200}
            skewAmount={5}
            pauseOnHover
            easing="elastic"
            onActiveChange={setActive}
          >
            {cards.map((s) => (
              <Card key={s.n} className="sb-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.title} />
                <span className="sb-card-tag">{s.tag}</span>
              </Card>
            ))}
          </CardSwap>
        </div>

        <div className="sb-text">
          <div className="sb-switch">
            {cards.map((s, i) => (
              <div className={`sb-panel${i === active ? " is-on" : ""}`} key={s.n} aria-hidden={i !== active}>
                <span className="sb-panel-n">{s.n} · {s.tag}</span>
                <h3 className="sb-panel-t">{s.title}</h3>
                <p className="sb-panel-d">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="sb-dots">
            {cards.map((s, i) => (
              <span key={s.n} className={i === active ? "on" : ""} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
