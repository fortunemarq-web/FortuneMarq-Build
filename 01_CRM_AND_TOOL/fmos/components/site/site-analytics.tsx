"use client";

import Script from "next/script";

/**
 * Marketing-site tracking stack (Meta Pixel + GA4 + Microsoft Clarity),
 * generalized from components/lp/lp-analytics.tsx. All env-gated — completely
 * inert until the IDs are set, so it's safe to ship before the accounts exist
 * and makes ZERO network calls without env.
 *
 *   NEXT_PUBLIC_GA4_ID         e.g. G-XXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID  e.g. 1234567890
 *   NEXT_PUBLIC_CLARITY_ID     e.g. abcdefghij
 *
 * Mounted once in app/site/layout.tsx. Fire events anywhere with trackEvent().
 */
export default function SiteAnalytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;

  if (!ga4 && !pixel && !clarity) return null; // fully inert without env

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

/** Fire a conversion event to any tracker present. Never throws / no-ops when
 *  no tracker is loaded (env unset). Safe to call from anywhere on the client. */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", name, props || {});
    (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("trackCustom", name, props || {});
    (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity?.("event", name);
  } catch {
    /* tracking must never break the page */
  }
}
