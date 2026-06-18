"use client";

// Website chat widget — same brain as the WhatsApp bot via /api/webchat
// (lib/bot/engine.ts generateBotReply). Floating launcher stacks above the
// WhatsApp FAB (both bottom-left). On booking/contact intent it offers a
// name+phone capture (→ website inbound pipeline, source=website) plus a
// WhatsApp handoff to the live bot. Client-only / SSR-safe; the panel animation
// is disabled under prefers-reduced-motion (see .sc-* in site.css).

import { useEffect, useRef, useState } from "react";
import { requestSiteCall } from "@/actions/site-book";
import { trackEvent } from "@/components/site/site-analytics";
import { waBotLink } from "@/components/site/site-whatsapp";

type Turn = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! 👋 I'm FortuneMarq's assistant. Ask me about web design, SEO, Google/Meta Ads, or CRM — or I can set up a strategy call. How can I help?";

export default function SiteChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lead, setLead] = useState({ contact_person: "", phone: "" });
  const [leadState, setLeadState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [leadMsg, setLeadMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, showHandoff, showLeadForm, leadState]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) trackEvent("chat_opened", { source: "site-chat" });
      return next;
    });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/webchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-20) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "…" }]);
      if (data.escalate) setShowHandoff(true);
      if (data.bookingIntent) setShowLeadForm(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — connection issue. You can WhatsApp us instead." },
      ]);
      setShowHandoff(true);
    } finally {
      setSending(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (leadState === "sending") return;
    if (!lead.contact_person.trim()) {
      setLeadState("error");
      setLeadMsg("Please enter your name.");
      return;
    }
    if (!/^[+\d][\d\s\-()]{6,19}$/.test(lead.phone)) {
      setLeadState("error");
      setLeadMsg("Please enter a valid phone number.");
      return;
    }
    setLeadState("sending");
    setLeadMsg("");
    const res = await requestSiteCall({
      contact_person: lead.contact_person,
      phone: lead.phone,
      message: "Requested a call from the website chat.",
      landing_page: typeof window !== "undefined" ? window.location.href : undefined,
      referrer_url: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
    if (res.success) {
      trackEvent("lead_submitted", { source: "site-chat" });
      setLeadState("done");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Got it — our team will reach out shortly. Anything else I can help with?" },
      ]);
    } else {
      setLeadState("error");
      setLeadMsg(res.message || "Could not save your details. Please try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        className={open ? "sc-fab is-open" : "sc-fab"}
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        onClick={toggle}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="sc-panel" role="dialog" aria-label="FortuneMarq chat">
          <div className="sc-head">
            <div className="sc-head-id">
              <span className="sc-dot" />
              <div>
                <strong>FortuneMarq Assistant</strong>
                <span className="sc-head-sub">Typically replies instantly</span>
              </div>
            </div>
            <button type="button" className="sc-close" aria-label="Close chat" onClick={toggle}>
              ✕
            </button>
          </div>

          <div className="sc-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "sc-msg sc-msg--user" : "sc-msg sc-msg--bot"}>
                {m.content}
              </div>
            ))}
            {sending && <div className="sc-msg sc-msg--bot sc-typing">…</div>}

            {showLeadForm && leadState !== "done" && (
              <form className="sc-lead" onSubmit={submitLead}>
                <p className="sc-lead-title">Leave your details — we&apos;ll set it up.</p>
                <input
                  className="sc-lead-input"
                  placeholder="Your name"
                  value={lead.contact_person}
                  onChange={(e) => setLead({ ...lead, contact_person: e.target.value })}
                />
                <input
                  className="sc-lead-input"
                  type="tel"
                  placeholder="Phone (e.g. 98765 43210)"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                />
                {leadState === "error" && <p className="sc-lead-err">{leadMsg}</p>}
                <button type="submit" className="sc-lead-btn" disabled={leadState === "sending"}>
                  {leadState === "sending" ? "Sending…" : "Request a call"}
                </button>
              </form>
            )}

            {(showHandoff || showLeadForm) && (
              <div className="sc-actions">
                <a
                  className="sc-action sc-action--wa"
                  href={waBotLink("chat")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { source: "chat" })}
                >
                  Continue on WhatsApp
                </a>
                <a className="sc-action" href="/site/contact#book" onClick={() => setOpen(false)}>
                  Book a meeting
                </a>
              </div>
            )}
          </div>

          <form className="sc-input-row" onSubmit={send}>
            <input
              className="sc-input"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="sc-send" aria-label="Send" disabled={sending || !input.trim()}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
