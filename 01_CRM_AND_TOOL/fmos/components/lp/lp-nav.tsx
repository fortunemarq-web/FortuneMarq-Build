"use client";

import { useEffect, useState } from "react";
import LangToggle from "@/components/lp/lang-toggle";
import type { Lang } from "@/lib/lp/niches";

/**
 * Sticky LP header. The "Book a call" CTA stays hidden while the hero is in view
 * (the hero already has its own CTAs) and fades in once the hero is scrolled
 * past — at which point the bar also gains a blurred background for legibility.
 */
export default function LpNav({ lang, langLabel, bookLabel }: { lang: Lang; langLabel: string; bookLabel: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".lp-hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? " is-scrolled" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lp-nav-logo" src="/site/images/FORTUNEMARQ-LOGO.webp" alt="FortuneMarq" />
      <div className="lp-nav-actions">
        <LangToggle lang={lang} label={langLabel} />
        <a href="#book" className="lp-btn lp-btn-primary lp-nav-book">{bookLabel}</a>
      </div>
    </nav>
  );
}
