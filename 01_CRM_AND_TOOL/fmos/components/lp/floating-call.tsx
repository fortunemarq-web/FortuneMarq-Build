"use client";

import { trackLpEvent } from "@/components/lp/lp-analytics";

const CALL_NUMBER = "+919353082656";

/** Floating call button (bottom-right). Pairs with the SiteChat launcher, which
 *  sits bottom-left, so the two don't collide. Calls aren't tracked as leads
 *  (no call-tracking number), but every tap fires an analytics event tagged with
 *  the niche+city so call-intent is measurable per page in GA4/Meta Pixel. */
export default function FloatingCall({ label = "Call FortuneMarq", niche, city }: { label?: string; niche?: string; city?: string }) {
  return (
    <a
      href={`tel:${CALL_NUMBER}`}
      className="lp-call-fab"
      aria-label={label}
      onClick={() => trackLpEvent("lp_call_click", { niche, city })}
    >
      <svg className="lp-call-glyph" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
      <span className="lp-call-pulse" aria-hidden="true" />
    </a>
  );
}
