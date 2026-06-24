"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Heading that splits into words and animates each in from a random offset when
 * scrolled into view, then revert()s to restore the original innerHTML (keeps the
 * DOM light + accessible once the animation is done). Reduced-motion safe.
 */
export default function SplitHeading({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger, SplitText);

    const ctx = gsap.context(() => {
      const split = SplitText.create(el, { type: "words" });
      gsap.from(split.words, {
        x: "random(-90, 90)",
        y: "random(-70, 70)",
        opacity: 0,
        rotation: "random(-12, 12)",
        ease: "power3.out",
        duration: 0.8,
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
        onComplete: () => split.revert(), // restore original innerHTML
      });
    }, ref);

    return () => ctx.revert();
  }, [text]);

  return (
    <h2 ref={ref} className={className}>
      {text}
    </h2>
  );
}
