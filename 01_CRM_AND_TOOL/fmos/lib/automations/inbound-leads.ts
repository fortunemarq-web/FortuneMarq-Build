"use server";

import { processInboundLead } from "@/lib/inbound/capture";

// Public entry point (landing pages) — visitors are anonymous, so this
// runs on the service-role client. Validate strictly: this is the only
// unauthenticated write path into the CRM besides token-verified webhooks.
// All capture logic lives in lib/inbound/capture.ts (PHASE F pipeline).

const MAX_FIELD_LENGTH = 200;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function captureInboundLead(formData: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    industry: string;
    city: string;
    utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
    gclid?: string;
    fbclid?: string;
    landing_page?: string;
    referrer_url?: string;
}) {
    // Validate before touching the database
    const company_name = (formData.company_name || "").trim().slice(0, MAX_FIELD_LENGTH);
    const phone = (formData.phone || "").trim();
    const email = (formData.email || "").trim().slice(0, MAX_FIELD_LENGTH);

    if (!company_name) {
        return { success: false, message: "Business name is required." };
    }
    if (!PHONE_REGEX.test(phone)) {
        return { success: false, message: "Please enter a valid phone number." };
    }
    if (email && !EMAIL_REGEX.test(email)) {
        return { success: false, message: "Please enter a valid email address." };
    }

    const result = await processInboundLead({
        channel: "lp",
        company_name,
        contact_person: formData.contact_person,
        email,
        phone,
        industry: formData.industry,
        city: formData.city,
        utm: formData.utm,
        gclid: formData.gclid,
        fbclid: formData.fbclid,
        landing_page: formData.landing_page,
        referrer_url: formData.referrer_url,
    });

    if (result.status === "duplicate") {
        // Visitor-facing: a re-enquiry is a success, not an error
        return { success: true, message: "We already have your details — our team will reach out shortly." };
    }
    if (!result.success) {
        return { success: false, message: result.message || "Could not save your details. Please try again." };
    }
    return { success: true };
}

// Public marketing-site contact form → inbound pipeline (source=website).
// Mirrors captureInboundLead but carries the contact form's richer fields
// (company, budget, services, message) into the lead note. Same strict,
// service-role-only validation: this is an unauthenticated write path.
export async function captureWebsiteLead(formData: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    budget?: string;
    services?: string[];
    message?: string;
    landing_page?: string;
    referrer_url?: string;
}) {
    const name = (formData.name || "").trim().slice(0, MAX_FIELD_LENGTH);
    const phone = (formData.phone || "").trim();
    const email = (formData.email || "").trim().slice(0, MAX_FIELD_LENGTH);
    const company = (formData.company || "").trim().slice(0, MAX_FIELD_LENGTH);

    if (!name) {
        return { success: false, message: "Please enter your name." };
    }
    if (!PHONE_REGEX.test(phone)) {
        return { success: false, message: "Please enter a valid phone number." };
    }
    if (email && !EMAIL_REGEX.test(email)) {
        return { success: false, message: "Please enter a valid email address." };
    }

    // Fold the extra contact-form context into the lead note (the pipeline
    // stores `message` on the lead's notes for the telecaller to read).
    const services = (formData.services || []).filter(Boolean);
    const detailParts: string[] = [];
    if (formData.budget) detailParts.push(`Budget: ${formData.budget}`);
    if (services.length) detailParts.push(`Interested in: ${services.join(", ")}`);
    if (formData.message) detailParts.push(`Details: ${formData.message.trim().slice(0, 800)}`);
    const message = detailParts.join("\n") || undefined;

    const result = await processInboundLead({
        channel: "website",
        company_name: company || name,
        contact_person: name,
        email,
        phone,
        message,
        landing_page: formData.landing_page,
        referrer_url: formData.referrer_url,
    });

    if (result.status === "duplicate") {
        return { success: true, message: "We already have your details — our team will reach out shortly." };
    }
    if (!result.success) {
        return { success: false, message: result.message || "Could not send your message. Please try again." };
    }
    return { success: true };
}
