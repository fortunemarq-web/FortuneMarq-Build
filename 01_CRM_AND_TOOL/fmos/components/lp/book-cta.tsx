"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  CalendarClock,
  MessageCircle,
} from "lucide-react";
import clsx from "clsx";
import { requestLpCall, bookLpMeeting, type LpLeadForm } from "@/actions/lp-book";
import { trackLpEvent } from "@/components/lp/lp-analytics";
import type { LpCopy } from "@/lib/lp/copy";

interface Props {
  copy: LpCopy;
  industry: string;
  city: string;
  nicheSlug: string;
  lang: "en" | "kn";
  waNumber: string; // bot WABA number, digits only
  waText: string;
}

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

export default function BookCta({ copy, industry, city, nicheSlug, lang, waNumber, waText }: Props) {
  const [form, setForm] = useState({ company_name: "", contact_person: "", phone: "", email: "" });
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "requested" | "booked">("idle");
  const [error, setError] = useState<string | null>(null);
  // Slots are "now"-relative and the LP is statically generated — computing them
  // during SSR bakes in build-time times that mismatch the client at hydration
  // (React #418, which can break form interactivity). Compute on the client only:
  // the server renders no slots, then we fill them in after mount.
  const [slots, setSlots] = useState<{ iso: string; label: string }[]>([]);
  useEffect(() => {
    setSlots(genSlots());
  }, []);

  function attribution(): Partial<LpLeadForm> {
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

  function payload(): LpLeadForm {
    return { ...form, industry, city, niche_slug: nicheSlug, lang, ...attribution() };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (slot) {
        const res = await bookLpMeeting(payload(), slot);
        if (!res.success) setError(res.message || "Something went wrong.");
        else { trackLpEvent("lp_meeting_booked", { niche: nicheSlug, city }); setState("booked"); }
      } else {
        const res = await requestLpCall(payload());
        if (!res.success) setError(res.message || "Something went wrong.");
        else { trackLpEvent("lp_lead_submitted", { niche: nicheSlug, city }); setState("requested"); }
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
      <div className="lpf-done">
        <div className="lpf-done-icon"><CheckCircle2 size={30} /></div>
        <h3>{booked ? copy.formBookedTitle : copy.formSuccessTitle}</h3>
        <p>{booked ? copy.formBookedBody : copy.formSuccessBody}</p>
        <button onClick={() => { setState("idle"); setSlot(null); setForm({ company_name: "", contact_person: "", phone: "", email: "" }); }}>
          {copy.formAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="lpf">
      <h3 className="lpf-title">{copy.formHeading}</h3>
      <p className="lpf-sub">{copy.formSub}</p>

      <div className="lpf-fields">
        <Field icon={<Building2 size={16} />}>
          <input required className="lpf-input" placeholder={copy.formBusiness}
            value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </Field>
        <Field icon={<User size={16} />}>
          <input required className="lpf-input" placeholder={copy.formName}
            value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
        </Field>
        <div className="lpf-row">
          <Field icon={<Phone size={16} />}>
            <input required type="tel" className="lpf-input" placeholder={copy.formPhone}
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field icon={<Mail size={16} />}>
            <input type="email" className="lpf-input" placeholder={copy.formEmail}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="lpf-slots-head"><CalendarClock size={14} /> {copy.formBooking}</div>
      <div className="lpf-slots">
        {slots.map((sl) => (
          <button key={sl.iso} type="button" onClick={() => setSlot(slot === sl.iso ? null : sl.iso)}
            className={clsx("lpf-slot", slot === sl.iso && "active")}>
            {sl.label}
          </button>
        ))}
      </div>

      {error && <p className="lpf-err">{error}</p>}

      <button disabled={busy} className="lpf-submit">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <>{slot ? copy.formConfirm : copy.formSubmit} <ChevronRight size={16} /></>}
      </button>

      <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer"
        onClick={() => trackLpEvent("lp_whatsapp_click", { niche: nicheSlug, city })} className="lpf-wa">
        <MessageCircle size={16} /> {copy.navWhatsapp}
      </a>

      <p className="lpf-priv">{copy.formPrivacy}</p>
    </form>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="lpf-field">
      {icon}
      {children}
    </div>
  );
}
