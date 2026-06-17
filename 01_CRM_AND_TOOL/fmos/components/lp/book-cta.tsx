"use client";

import { useMemo, useState } from "react";
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
  const slots = useMemo(genSlots, []);

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
    return {
      ...form,
      industry,
      city,
      niche_slug: nicheSlug,
      lang,
      ...attribution(),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (slot) {
        const res = await bookLpMeeting(payload(), slot);
        if (!res.success) {
          setError(res.message || "Something went wrong.");
        } else {
          trackLpEvent("lp_meeting_booked", { niche: nicheSlug, city });
          setState("booked");
        }
      } else {
        const res = await requestLpCall(payload());
        if (!res.success) {
          setError(res.message || "Something went wrong.");
        } else {
          trackLpEvent("lp_lead_submitted", { niche: nicheSlug, city });
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
      <div className="rounded-3xl border border-brand/25 bg-brand/10 p-8 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-slate-900 shadow-lg shadow-brand/30">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className="text-2xl font-bold text-white">{booked ? copy.formBookedTitle : copy.formSuccessTitle}</h3>
        <p className="max-w-xs text-emerald-100/70">{booked ? copy.formBookedBody : copy.formSuccessBody}</p>
        <button
          onClick={() => {
            setState("idle");
            setSlot(null);
            setForm({ company_name: "", contact_person: "", phone: "", email: "" });
          }}
          className="mt-2 text-sm font-bold text-brand hover:underline"
        >
          {copy.formAnother}
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-brand focus:bg-white/[0.07]";

  return (
    <form
      onSubmit={submit}
      id="book"
      className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-xl scroll-mt-24"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mb-5 space-y-1">
        <h3 className="text-xl font-bold text-white">{copy.formHeading}</h3>
        <p className="text-sm text-slate-400">{copy.formSub}</p>
      </div>

      <div className="relative space-y-3">
        <Field icon={<Building2 className="h-4 w-4" />}>
          <input required className={inputCls} placeholder={copy.formBusiness}
            value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </Field>
        <Field icon={<User className="h-4 w-4" />}>
          <input required className={inputCls} placeholder={copy.formName}
            value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field icon={<Phone className="h-4 w-4" />}>
            <input required type="tel" className={inputCls} placeholder={copy.formPhone}
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field icon={<Mail className="h-4 w-4" />}>
            <input type="email" className={inputCls} placeholder={copy.formEmail}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Slot picker */}
      <div className="relative mt-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <CalendarClock className="h-3.5 w-3.5 text-brand" /> {copy.formBooking}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => (
            <button
              key={s.iso}
              type="button"
              onClick={() => setSlot(slot === s.iso ? null : s.iso)}
              className={clsx(
                "rounded-xl border px-2 py-2 text-xs font-medium transition-all",
                slot === s.iso
                  ? "border-brand bg-brand text-slate-900"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-brand/40"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="relative mt-4 text-sm font-medium text-red-400">{error}</p>}

      <button
        disabled={busy}
        className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-slate-900 shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : slot ? copy.formConfirm : copy.formSubmit}
        {!busy && <ChevronRight className="h-5 w-5" />}
      </button>

      <a
        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackLpEvent("lp_whatsapp_click", { niche: nicheSlug, city })}
        className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3.5 font-semibold text-white transition-all hover:bg-white/10"
      >
        <MessageCircle className="h-4 w-4 text-brand" /> {copy.navWhatsapp}
      </a>

      <p className="relative mt-3 text-center text-[11px] text-slate-500">{copy.formPrivacy}</p>
    </form>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
      {children}
    </div>
  );
}
