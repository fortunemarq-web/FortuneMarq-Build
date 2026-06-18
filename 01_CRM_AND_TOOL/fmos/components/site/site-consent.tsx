"use client";

// Cookie/analytics consent for the marketing site. DPDP/GDPR posture: analytics
// trackers load ONLY after the visitor accepts. The banner is shown only when at
// least one tracker is configured AND no choice has been stored yet — so with no
// tracker IDs set the whole thing stays inert (matches SiteAnalytics).

import { useEffect, useState } from "react";

const KEY = "fmq_consent";
export type Consent = "granted" | "denied" | null;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "granted" || v === "denied" ? v : null;
}

function writeConsent(v: "granted" | "denied") {
  try {
    window.localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent("fmq-consent", { detail: v }));
  } catch {
    /* storage blocked — fail safe (no tracking) */
  }
}

/** Reactive consent value (null until the visitor chooses). */
export function useConsent(): Consent {
  const [c, setC] = useState<Consent>(null);
  useEffect(() => {
    setC(getConsent());
    const on = () => setC(getConsent());
    window.addEventListener("fmq-consent", on);
    return () => window.removeEventListener("fmq-consent", on);
  }, []);
  return c;
}

/** Bottom consent prompt. Renders only when trackers exist and no decision yet. */
export function SiteConsentBanner({ hasTrackers }: { hasTrackers: boolean }) {
  const [decision, setDecision] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDecision(getConsent());
  }, []);

  if (!hasTrackers || !mounted || decision) return null;

  const choose = (v: "granted" | "denied") => {
    writeConsent(v);
    setDecision(v);
  };

  return (
    <div className="sconsent" role="dialog" aria-label="Cookie consent">
      <p className="sconsent-text">
        We use cookies for analytics to understand and improve your experience. You can accept or decline — see our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
      <div className="sconsent-actions">
        <button type="button" className="sconsent-btn sconsent-decline" onClick={() => choose("denied")}>
          Decline
        </button>
        <button type="button" className="sconsent-btn sconsent-accept" onClick={() => choose("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
