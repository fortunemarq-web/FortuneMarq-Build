"use client";

// Contact-page form (.ct-form) — markup ported from contact.html, with a phone
// field added (FMOS leads are phone-first) and the mailto submit replaced by the
// real inbound pipeline: captureWebsiteLead({ source: website }). Field focus
// micro-interactions (underline + scale) are preserved (CSS + initContactPage).

import { useState } from "react";
import { captureWebsiteLead } from "@/lib/automations/inbound-leads";

const SERVICES = [
  { value: "web", label: "Website" },
  { value: "marketing", label: "Marketing" },
  { value: "seo", label: "SEO" },
  { value: "crm", label: "CRM" },
  { value: "other", label: "Other" },
];

type Status = "idle" | "sending" | "sent" | "error";

export default function SiteContactPageForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();

    // Client-side guard (server re-validates) — keep the messaging friendly.
    if (!name) {
      setStatus("error");
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!/^[+\d][\d\s\-()]{6,19}$/.test(phone)) {
      setStatus("error");
      setErrorMsg("Please enter a valid phone number so we can reach you.");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    const res = await captureWebsiteLead({
      name,
      email,
      phone,
      company: String(fd.get("company") || "").trim(),
      budget: String(fd.get("budget") || "").trim(),
      services: fd.getAll("service").map(String),
      message: String(fd.get("message") || "").trim(),
      landing_page: typeof window !== "undefined" ? window.location.href : undefined,
      referrer_url: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });

    if (res.success) {
      setStatus("sent");
      form.reset();
      // Return the button to its resting state after a beat.
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setErrorMsg(res.message || "Could not send your message. Please try again.");
    }
  }

  const btnLabel = status === "sending" ? "Sending..." : status === "sent" ? "Message Sent!" : "Send Message";

  return (
    <div className="ct-form-wrapper">
      <div className="ct-form-header">
        <span className="ct-form-tag">// START PROJECT</span>
        <h2 className="ct-form-title">Send a Message</h2>
      </div>

      <form className="ct-form" id="contactForm" onSubmit={onSubmit} noValidate>
        <div className="ct-form-row">
          <div className="ct-input-group">
            <label htmlFor="ct-name">Full Name</label>
            <input type="text" id="ct-name" name="name" placeholder="John Doe" required />
            <div className="ct-input-line" />
          </div>
          <div className="ct-input-group">
            <label htmlFor="ct-email">Email Address</label>
            <input type="email" id="ct-email" name="email" placeholder="john@company.com" required />
            <div className="ct-input-line" />
          </div>
        </div>

        <div className="ct-form-row">
          <div className="ct-input-group">
            <label htmlFor="ct-phone">Phone</label>
            <input type="tel" id="ct-phone" name="phone" placeholder="98765 43210" required />
            <div className="ct-input-line" />
          </div>
          <div className="ct-input-group">
            <label htmlFor="ct-company">Company</label>
            <input type="text" id="ct-company" name="company" placeholder="Your Company" />
            <div className="ct-input-line" />
          </div>
        </div>

        <div className="ct-input-group ct-full-width">
          <label htmlFor="ct-budget">Budget Range</label>
          <select id="ct-budget" name="budget" defaultValue="">
            <option value="">Select Budget</option>
            <option value="25k-50k">₹25K - ₹50K</option>
            <option value="50k-1l">₹50K - ₹1L</option>
            <option value="1l-3l">₹1L - ₹3L</option>
            <option value="3l+">₹3L+</option>
          </select>
          <div className="ct-input-line" />
        </div>

        <div className="ct-input-group ct-full-width">
          <label htmlFor="ct-service">What do you need?</label>
          <div className="ct-service-chips">
            {SERVICES.map((s) => (
              <label className="ct-chip" key={s.value}>
                <input type="checkbox" name="service" value={s.value} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="ct-input-group ct-full-width">
          <label htmlFor="ct-message">Project Details</label>
          <textarea id="ct-message" name="message" rows={4} placeholder="Tell us about your project, goals, and timeline..." />
          <div className="ct-input-line" />
        </div>

        {status === "error" && (
          <p className="ct-form-error" role="alert">
            {errorMsg}
          </p>
        )}
        {status === "sent" && (
          <p className="ct-form-success" role="status">
            Thanks — your message is in. We typically reply within 4 hours.
          </p>
        )}

        <button type="submit" className="ct-submit" disabled={status === "sending"}>
          <span className="ct-submit-text">{btnLabel}</span>
          <span className="ct-submit-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </span>
          <div className="ct-submit-bg" />
        </button>
      </form>
    </div>
  );
}
