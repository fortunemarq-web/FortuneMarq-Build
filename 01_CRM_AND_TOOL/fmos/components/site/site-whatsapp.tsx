"use client";

// WhatsApp → bot CTAs for the marketing site. Every link targets the WABA *bot*
// number (NEXT_PUBLIC_WA_BOT_NUMBER, default 917975918980) with a prefilled,
// source-tagged message the bot/capture can read — mirroring the LP's waText.
// Clicks fire a `whatsapp_click` tracking event (inert until analytics env set).

import { trackEvent } from "@/components/site/site-analytics";

export const WA_BOT_NUMBER = process.env.NEXT_PUBLIC_WA_BOT_NUMBER || "917975918980";

/** Build a wa.me link to the bot with a source-tagged prefilled message. */
export function waBotLink(source: string, message?: string): string {
  const text =
    message ||
    `Hi FortuneMarq! 👋 I'm on your website and want to grow my business. Can we talk? (ref: website-${source})`;
  return `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(text)}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

interface CtaProps {
  source: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

/** Inline WhatsApp link (used in header, hero, contact, footer). */
export function WhatsAppCta({ source, message, children, className, showIcon = true }: CtaProps) {
  return (
    <a
      href={waBotLink(source, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("whatsapp_click", { source })}
    >
      {showIcon && <WhatsAppGlyph className="wa-glyph" />}
      {children}
    </a>
  );
}

/** Floating WhatsApp button (bottom-left). The website chat launcher (SiteChat,
 *  `.sc-fab`) stacks directly above it on the same edge. */
export function FloatingWhatsApp({ source = "floating" }: { source?: string }) {
  return (
    <a
      href={waBotLink(source)}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab"
      aria-label="Chat with us on WhatsApp"
      onClick={() => trackEvent("whatsapp_click", { source })}
    >
      <WhatsAppGlyph className="wa-fab-glyph" />
      <span className="wa-fab-pulse" aria-hidden="true" />
    </a>
  );
}
