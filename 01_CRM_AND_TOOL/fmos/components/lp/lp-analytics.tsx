"use client";

import Script from "next/script";

/**
 * Tracking stack for the public LPs (decided: Meta Pixel + GA4 + Microsoft
 * Clarity). All env-gated — completely inert until the IDs are set, so this
 * is safe to ship before the accounts exist.
 *
 *   NEXT_PUBLIC_GA4_ID         e.g. G-XXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID  e.g. 1234567890
 *   NEXT_PUBLIC_CLARITY_ID     e.g. abcdefghij
 */
export default function LpAnalytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <>
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
      {clarity && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarity}");`}
        </Script>
      )}
    </>
  );
}

// Map our granular custom LP events → the STANDARD conversion events Google Ads
// and Meta recognize for reporting + bid optimization. We fire BOTH: the custom
// name (in-house analysis) AND the standard event (so the ad platforms can
// optimize toward leads the moment the accounts are linked — no rework needed).
const STANDARD_EVENTS: Record<string, { ga?: string; fb?: string }> = {
  lp_lead_submitted: { ga: "generate_lead", fb: "Lead" },
  lp_meeting_booked: { ga: "generate_lead", fb: "Schedule" },
  lp_whatsapp_click: { fb: "Contact" },
  lp_call_click: { fb: "Contact" },
};

/** Fire a conversion event to any tracker present (custom + standard mapping). */
export function trackLpEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  try {
    // granular custom event (in-house analysis)
    w.gtag?.("event", name, props || {});
    w.fbq?.("trackCustom", name, props || {});
    w.clarity?.("event", name);
    // standard conversion event (ad-platform reporting + optimization)
    const std = STANDARD_EVENTS[name];
    if (std?.ga) w.gtag?.("event", std.ga, props || {});
    if (std?.fb) w.fbq?.("track", std.fb, props || {});
  } catch {
    /* tracking must never break the page */
  }
}
