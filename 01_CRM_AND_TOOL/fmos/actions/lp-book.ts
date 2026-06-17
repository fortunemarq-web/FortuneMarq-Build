"use server";

import { processInboundLead, type InboundLeadInput } from "@/lib/inbound/capture";
import { bookMeeting } from "@/actions/book-meeting";

// Public LP entry points. Anonymous visitors → service-role inbound pipeline
// (dedup + attribution + auto-assign), then optionally a Google Meet booking.
// Mirrors the validation in lib/automations/inbound-leads.ts.

const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 200;

export interface LpLeadForm {
  company_name: string;
  contact_person: string;
  email?: string;
  phone: string;
  industry: string;
  city: string;
  niche_slug?: string;
  lang?: string;
  utm?: InboundLeadInput["utm"];
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer_url?: string;
}

function validate(form: LpLeadForm): string | null {
  if (!(form.company_name || "").trim()) return "Business name is required.";
  if (!PHONE_REGEX.test((form.phone || "").trim())) return "Please enter a valid phone number.";
  if (form.email && !EMAIL_REGEX.test(form.email.trim())) return "Please enter a valid email address.";
  return null;
}

function toInput(form: LpLeadForm): InboundLeadInput {
  return {
    channel: "lp",
    company_name: (form.company_name || "").trim().slice(0, MAX),
    contact_person: (form.contact_person || "").trim().slice(0, MAX),
    email: (form.email || "").trim().slice(0, MAX),
    phone: (form.phone || "").trim(),
    industry: (form.industry || "").trim().slice(0, MAX),
    city: (form.city || "").trim().slice(0, MAX),
    utm: { ...form.utm, content: form.utm?.content || form.niche_slug },
    gclid: form.gclid,
    fbclid: form.fbclid,
    landing_page: form.landing_page,
    referrer_url: form.referrer_url,
  };
}

/** Lead-only capture (no time chosen) — "request a call". */
export async function requestLpCall(
  form: LpLeadForm
): Promise<{ success: boolean; message?: string }> {
  const err = validate(form);
  if (err) return { success: false, message: err };

  const res = await processInboundLead(toInput(form));
  if (res.status === "duplicate") {
    return { success: true, message: "We already have your details — our team will reach out shortly." };
  }
  if (!res.success) return { success: false, message: res.message || "Could not save your details." };
  return { success: true };
}

/** Capture + book a Google Meet at the chosen slot. */
export async function bookLpMeeting(
  form: LpLeadForm,
  startIso: string
): Promise<{ success: boolean; message?: string; meetLink?: string }> {
  const err = validate(form);
  if (err) return { success: false, message: err };

  const when = new Date(startIso);
  if (isNaN(when.getTime()) || when.getTime() < Date.now()) {
    return { success: false, message: "Please choose a valid upcoming time." };
  }

  const res = await processInboundLead(toInput(form));
  if (!res.leadId) {
    return { success: false, message: res.message || "Could not save your details." };
  }

  const booked = await bookMeeting({ leadId: res.leadId, startIso, lang: form.lang || "en" });
  if (!booked.ok && !booked.meetLink) {
    // Lead is captured; booking infra failed — degrade to a call request.
    return {
      success: true,
      message: "Saved — we'll confirm your meeting time shortly.",
    };
  }
  return { success: true, meetLink: booked.meetLink };
}
