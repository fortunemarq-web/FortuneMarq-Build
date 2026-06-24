"use server";

import { processInboundLead, type InboundLeadInput } from "@/lib/inbound/capture";
import { bookMeeting } from "@/actions/book-meeting";

// Public marketing-site booking entry points (channel "website"). Mirrors
// actions/lp-book.ts: anonymous visitor → service-role inbound pipeline (dedup +
// attribution + auto-assign), then optionally a Google Meet booking. Validation
// matches lib/automations/inbound-leads.ts.

const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 200;

export interface SiteLeadForm {
  contact_person: string;
  phone: string;
  email?: string;
  company_name?: string;
  message?: string;
  landing_page?: string;
  referrer_url?: string;
  utm?: InboundLeadInput["utm"];
  gclid?: string;
  fbclid?: string;
  // Set when the chat is embedded on a niche LP, so the lead is tagged with the
  // niche (industry) + city instead of being indistinguishable from a homepage chat.
  industry?: string;
  city?: string;
}

function validate(form: SiteLeadForm): string | null {
  if (!(form.contact_person || "").trim()) return "Please enter your name.";
  if (!PHONE_REGEX.test((form.phone || "").trim())) return "Please enter a valid phone number.";
  if (form.email && !EMAIL_REGEX.test(form.email.trim())) return "Please enter a valid email address.";
  return null;
}

function toInput(form: SiteLeadForm): InboundLeadInput {
  const name = (form.contact_person || "").trim().slice(0, MAX);
  return {
    channel: "website",
    company_name: (form.company_name || "").trim().slice(0, MAX) || name,
    contact_person: name,
    email: (form.email || "").trim().slice(0, MAX),
    phone: (form.phone || "").trim(),
    message: (form.message || "").trim().slice(0, 800) || undefined,
    industry: (form.industry || "").trim().slice(0, MAX) || undefined,
    city: (form.city || "").trim().slice(0, MAX) || undefined,
    utm: form.utm,
    gclid: form.gclid,
    fbclid: form.fbclid,
    landing_page: form.landing_page,
    referrer_url: form.referrer_url,
  };
}

/** Lead-only capture (no time chosen) — "request a call". */
export async function requestSiteCall(form: SiteLeadForm): Promise<{ success: boolean; message?: string }> {
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
export async function bookSiteMeeting(
  form: SiteLeadForm,
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

  const booked = await bookMeeting({ leadId: res.leadId, startIso });
  if (!booked.ok && !booked.meetLink) {
    // Lead captured; booking infra failed — degrade to a call request.
    return { success: true, message: "Saved — we'll confirm your meeting time shortly." };
  }
  return { success: true, meetLink: booked.meetLink };
}
