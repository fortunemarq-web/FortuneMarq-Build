"use client";

// Home contact form — markup ported 1:1 from index.html.
// TODO(FMOS): wire submit → captureInboundLead({ source: "website" }) (inbound
// pipeline already exists at lib/automations/inbound-leads.ts). For the parallel
// rebuild this is intentionally a no-op preventDefault so nothing posts yet.

import { useState } from "react";

export default function SiteContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <div className="contact-form-wrap">
      <form
        className="fmq-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
          setTimeout(() => setSent(false), 2500);
        }}
      >
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your Name" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="your@email.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="message">Challenge</label>
          <textarea id="message" name="message" rows={4} placeholder="Tell us about your goals..." required />
        </div>
        <button type="submit" className="fmq-submit-btn">
          <span>{sent ? "Message Sent!" : "Send Message"}</span>
          <span className="btn-arrow">→</span>
        </button>
      </form>
    </div>
  );
}
