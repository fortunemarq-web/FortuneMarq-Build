"use client";

// Book-a-meeting widget for the marketing site — adapted from
// components/lp/book-cta.tsx, restyled to the site theme (.sbk-*). Lead form +
// upcoming-slot picker + WhatsApp fallback + tracking. Picking a slot books a
// real Google Meet via bookSiteMeeting (channel "website"); no slot = request a
// call. SSR-safe (client), reduced-motion-friendly (no heavy animation).

import { useMemo, useState } from "react";
import { requestSiteCall, bookSiteMeeting, type SiteLeadForm } from "@/actions/site-book";
import { trackEvent } from "@/components/site/site-analytics";
import { waBotLink } from "@/components/site/site-whatsapp";

const IST = "Asia/Kolkata";

function genSlots(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const hours = [11, 16, 18]; // 11am, 4pm, 6pm IST
  const now = new Date();
  let added = 0;
  for (let day = 1; day <= 6 && added < 6; day++) {
    const d = new Date(now);
    d.setDate(now.getDate() + day);
    if (d.getDay() === 0) continue; // skip Sunday
    for (const h of hours) {
      const slot = new Date(d);
      slot.setHours(h, 0, 0, 0);
      if (slot.getTime() < Date.now()) continue;
      out.push({
        iso: slot.toISOString(),
        label: slot.toLocaleString("en-IN", {
          timeZone: IST,
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
      added++;
      if (added >= 6) break;
    }
  }
  return out;
}

function attribution(): Partial<SiteLeadForm> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm: {
      source: p.get("utm_source") || undefined,
      medium: p.get("utm_medium") || undefined,
      campaign: p.get("utm_campaign") || undefined,
      content: p.get("utm_content") || undefined,
      term: p.get("utm_term") || undefined,
    },
    gclid: p.get("gclid") || undefined,
    fbclid: p.get("fbclid") || undefined,
    landing_page: window.location.pathname + window.location.search,
    referrer_url: document.referrer || undefined,
  };
}

export default function SiteBookCta() {
  const [form, setForm] = useState({ contact_person: "", phone: "", email: "", company_name: "" });
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "requested" | "booked">("idle");
  const [meetLink, setMeetLink] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const slots = useMemo(genSlots, []);

  function payload(): SiteLeadForm {
    return { ...form, ...attribution() };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation — the form is noValidate, so guard here for instant
    // feedback (the server validates again).
    if (!form.contact_person.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[+\d][\d\s\-()]{6,19}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }
    // Past-slot guard: slots are generated once at mount, so a chosen slot can
    // lapse if the page sits open. Never let a past time be booked.
    if (slot && new Date(slot).getTime() < Date.now()) {
      setSlot(null);
      setError("That time has just passed — please pick another slot.");
      return;
    }

    setBusy(true);
    try {
      if (slot) {
        const res = await bookSiteMeeting(payload(), slot);
        if (!res.success) {
          setError(res.message || "Something went wrong.");
        } else if (res.meetLink) {
          // A real Google Meet exists — only now is it truly "booked".
          trackEvent("meeting_booked", { source: "site-book" });
          setMeetLink(res.meetLink);
          setState("booked");
        } else {
          // Lead saved but no Meet was created — tell the truth, don't fire
          // meeting_booked.
          trackEvent("lead_submitted", { source: "site-book" });
          setState("requested");
        }
      } else {
        const res = await requestSiteCall(payload());
        if (!res.success) {
          setError(res.message || "Something went wrong.");
        } else {
          trackEvent("lead_submitted", { source: "site-book" });
          setState("requested");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (state !== "idle") {
    const booked = state === "booked";
    return (
      <div className="sbk-card">
        <div className="sbk-glow" />
        <div className="sbk-done">
          <div className="sbk-done-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3>{booked ? "You're booked." : "Request received."}</h3>
          <p>
            {booked
              ? "Your Google Meet is confirmed — we've sent the details and a reminder. See you then."
              : "Thanks — our team will confirm your time on WhatsApp shortly."}
          </p>
          {booked && meetLink && (
            <a className="sbk-meetlink" href={meetLink} target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Join Google Meet
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="sbk-card" id="book" onSubmit={submit} noValidate>
      <div className="sbk-glow" />
      <div className="sbk-head">
        <span className="sbk-eyebrow">// BOOK A STRATEGY CALL</span>
        <h2 className="sbk-title">Grab a 30-minute slot.</h2>
        <p className="sbk-sub">Pick a time and we&apos;ll send a Google Meet instantly. No obligation — just strategy.</p>
      </div>

      <div className="sbk-grid">
        <div className="sbk-field">
          <label htmlFor="sbk-name">Name</label>
          <input id="sbk-name" required placeholder="Your name" value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
        </div>
        <div className="sbk-field">
          <label htmlFor="sbk-phone">Phone</label>
          <input id="sbk-phone" type="tel" required placeholder="98765 43210" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="sbk-field">
          <label htmlFor="sbk-email">Email</label>
          <input id="sbk-email" type="email" placeholder="you@company.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="sbk-field">
          <label htmlFor="sbk-company">Company</label>
          <input id="sbk-company" placeholder="Your company" value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </div>
      </div>

      <div className="sbk-slots-label">
        <span className="dot" /> Choose a time (IST) — or leave blank to request a call
      </div>
      <div className="sbk-slots">
        {slots.map((s) => (
          <button
            type="button"
            key={s.iso}
            className={slot === s.iso ? "sbk-slot is-active" : "sbk-slot"}
            onClick={() => setSlot(slot === s.iso ? null : s.iso)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="sbk-error">{error}</p>}

      <button className="sbk-submit" disabled={busy}>
        {busy ? "Working…" : slot ? "Confirm meeting →" : "Request a call →"}
      </button>

      <a
        className="sbk-wa"
        href={waBotLink("book")}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { source: "book" })}
      >
        Prefer WhatsApp? Message us
      </a>

      <p className="sbk-privacy">We never share your details. Market exclusivity guaranteed.</p>
    </form>
  );
}
