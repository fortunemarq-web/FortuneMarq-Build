"use client";

// Home contact form (#contact section, .fmq-form markup). Wired → FMOS inbound
// (source=website) via captureWebsiteLead, mirroring site-contact-page-form.
// FMOS is phone-first, so a required phone field was added; email is optional;
// the message becomes the lead note. Client + server validation, success/error.

import { useState } from "react";
import { captureWebsiteLead } from "@/lib/automations/inbound-leads";
import { trackEvent } from "@/components/site/site-analytics";

type Status = "idle" | "sending" | "sent" | "error";

export default function SiteContactForm() {
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
      message: String(fd.get("message") || "").trim(),
      landing_page: typeof window !== "undefined" ? window.location.href : undefined,
      referrer_url: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });

    if (res.success) {
      trackEvent("lead_submitted", { source: "home-contact" });
      setStatus("sent");
      form.reset();
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setErrorMsg(res.message || "Could not send your message. Please try again.");
    }
  }

  const btnLabel = status === "sending" ? "Sending..." : status === "sent" ? "Message Sent!" : "Send Message";

  return (
    <div className="contact-form-wrap">
      <form className="fmq-form" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="hc-name">Name</label>
          <input type="text" id="hc-name" name="name" placeholder="Your Name" required />
        </div>
        <div className="form-group">
          <label htmlFor="hc-phone">Phone</label>
          <input type="tel" id="hc-phone" name="phone" placeholder="98765 43210" required />
        </div>
        <div className="form-group">
          <label htmlFor="hc-email">Email</label>
          <input type="email" id="hc-email" name="email" placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label htmlFor="hc-message">Challenge</label>
          <textarea id="hc-message" name="message" rows={4} placeholder="Tell us about your goals..." />
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

        <button type="submit" className="fmq-submit-btn" disabled={status === "sending"}>
          <span>{btnLabel}</span>
          <span className="btn-arrow">→</span>
        </button>
      </form>
    </div>
  );
}
