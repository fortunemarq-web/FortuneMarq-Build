"use client";

// Marketing-site navigation shim. The site is served at clean root paths via a
// host-split *rewrite* in proxy.ts (/about → internal /site/about). Next's App
// Router client-side (soft) navigation can't follow that rewrite — the RSC tree
// it gets back is rooted at /site/* while the URL is /*, so a <Link> click lands
// on a blank page. Full-page navigation goes through the rewrite server-side and
// works fine (and external links already do).
//
// This component intercepts internal link clicks in the capture phase and forces
// a full navigation, so every nav link / CTA works without converting each
// <Link> to <a>. Mounted once in app/site/layout.tsx. Remove if the host-split
// is ever reworked to support soft navigation (e.g. native clean-path routing).
import { useEffect } from "react";

export default function SiteHardNav() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Respect new-tab / modified / non-primary clicks and already-handled events.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      // Internal, same-origin paths only. Skip protocol/external (//, https:, mailto:, tel:)
      // and pure in-page hashes (#…) — those are handled by the smooth-anchor engine.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Force a real navigation so the host-split rewrite serves the right page.
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(href);
    };
    document.addEventListener("click", onClick, true); // capture: beat Next's <Link> handler
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
