# WhatsApp Automation — Handoff & Work Order (2026-06-16)

**For:** the Claude Code instance building FMOS WhatsApp automations.
**From:** the design session in Cowork.
**Source of truth (read first):**
- `00_MASTER/FMOS_System_Design_And_Tasks.md` — full system design (all stages).
- `00_MASTER/FMOS_Execution_Roadmap.md` — build order + launch gate.
- This file = the WhatsApp-specific work order distilled from those.

> **Hard constraint (decided):** nothing goes live / no client acquisition until the WHOLE system is built and QA'd. Build to spec; do not enable sends to real leads.

---

## 1. Architecture decisions that drive WhatsApp

1. **One autonomous AI bot, multiple surfaces.** A single "bot brain" (Anthropic, `ANTHROPIC_API_KEY`) answers across WhatsApp + website + IG/Messenger. It answers questions, qualifies, and **books meetings itself**, escalating only edge cases. Knowledge base lives at `00_MASTER/Bot_Knowledge_Base/` (services, pricing, faqs, objections, guardrails_and_escalation).
2. **Booking = Google Calendar/Meet API** (not Calendly). Creates the Meet link + calendar event; powers both the website and the WhatsApp booking flow.
3. **24-hour window rule.** First/cold/outside-window messages MUST be Meta-approved templates. The bot may free-chat only inside the 24h window opened by a user message.
4. **Every lead is source-tagged** (`source` field) and de-duplicated across engines — the bot/sender must not double-contact a business already in an active inbound thread.
5. **Compliance is mandatory before any volume send** (opt-out, throttling, quality monitoring).

---

## 2. The full WhatsApp surface (everywhere it fires)

| # | Trigger | Direction | Template or session | Design ref |
|---|---|---|---|---|
| 1 | Direct report bulk send | out → lead | template (DIRECT_REPORT a/b/c/d) + PDF doc + buttons | 3.1 |
| 2 | Button tap / reply handling | in | session (bot) | 3.1 |
| 3 | Call outcome logged | out → lead | template (OUTCOME_*) | 3.2 |
| 4 | Day-2 non-replier reminder | out → lead | template | 3.3 |
| 5 | Meeting confirmation + reminders (1d, 1h) + reschedule | out → lead | template | 3.4 |
| 6 | Meeting booked → notify Jabeer | out → Jabeer | session/internal | 4.1 |
| 7 | Proposal / agreement / invoice send | out → lead | template (doc) | 4.2/4.3/4.7 |
| 8 | Agreement "Yes, confirmed" capture | in | webhook | 4.3 |
| 9 | Milestone-complete + monthly report | out → client | template | 4.6 |
| 10 | Renewal + review/referral requests | out → client | template | 4.8 |
| 11 | Scheduled digests (campaign, presence, founder) | out → Jabeer | session/internal | 2.6/5.7/6.5 |
| 12 | Inbound from web/IG/Messenger → bot | in | session (bot) | 5.1/5.4/5.6 |

---

## 3. BUILD (new)

**Bot**
- [ ] **Bot engine** — wrap `ANTHROPIC_API_KEY`; load `00_MASTER/Bot_Knowledge_Base/*` as system context; enforce guardrails (no guarantees, never price outside packages) + escalation triggers (price negotiation, complaints, off-script, high-value) → notify Jabeer.
- [ ] **Bot books meetings** via the Google Calendar/Meet API integration (below).
- [ ] **Channel adapters** so the same bot serves WhatsApp, website chat, and IG/Messenger via `/api/inbound/[channel]`.

**Booking**
- [ ] **Google Calendar/Meet API integration** — create event + Meet link; used by the WhatsApp date/time picker and the site. Emit `meetLink`, `calendarStart`, `calendarEnd` (already referenced by `OUTCOME_BOOK_MEETING`).
- [ ] Meeting **reminders** (1 day + 1 hour before) + **reschedule link** (reopens picker → updates event) + **no-show** → `no_show` tag + drop to follow-up.

**Outreach dashboard send path (3.1)**
- [ ] Bulk **type-matched** send: select niche+city → send each lead its `pitch_type` DIRECT_REPORT template + matching PDF (via existing `sendWhatsAppDocument`/`uploadWhatsAppMedia`).
- [ ] Delivery/read/click tracking surfaced to the dashboard (sent/delivered/read/clicked/booked), filterable by city or niche×city.

**Outcome + lifecycle sends**
- [ ] Wire each call outcome → its approved template (configure `WA_OUTCOME_TEMPLATES`).
- [ ] Proposal / agreement / invoice **auto-send** (doc + body template); advance invoice on agreement-signed; recurring monthly GST invoices + payment reminders.
- [ ] Milestone-complete nudge + monthly report send (client); renewal + review/referral requests.

**Cross-cutting (6.x)**
- [ ] **Compliance:** opt-out ("STOP") handler + suppression list; send throttling/daily caps; quality-rating/tier monitoring + alert.
- [ ] **Unified conversation inbox** + per-thread human takeover.
- [ ] **Cross-engine dedup**: suppress outbound if lead is in an active inbound thread.
- [ ] **Scheduled digests** to Jabeer (campaign perf, presence, founder daily) + **automation health alerts**.

---

## 4. CHANGE (modify existing)

- [ ] **`lib/whatsapp/auto-replies.ts`** — the static `AUTO_REPLIES` (MEETING_REQUEST_REPLY / TELL_ME_MORE_REPLY / NOT_RIGHT_NOW_REPLY) are an interim. **Replace with the autonomous bot** as the responder inside the 24h window. Keep button-tap → tag/priority logic; route the *reply content* through the bot.
- [ ] **`app/api/webhooks/whatsapp/route.ts`** — keep button-tap + "Yes, confirmed" handling; add: route inbound free-text to the bot, opt-out detection, dedup check.
- [ ] **`lib/whatsapp/outcome-send.ts`** — already template-only via `WA_OUTCOME_TEMPLATES` (good); ensure all outcomes are mapped + templates approved.
- [ ] **`app/api/inbound/[channel]/route.ts`** — extend to web/IG/Messenger; every inbound creates/updates a source-tagged lead → bot.
- [ ] Confirm `WHATSAPP_LP_FALLBACK_URL` points to real niche LPs once the Next.js site is live (currently falls back to fortunemarq.com).

---

## 5. REMOVE / DEPRECATE

- [ ] Once the bot is live, **deprecate the static auto-reply text** as the primary responder (keep as a fallback only if the bot/API is unreachable).
- [ ] Remove any leftover **"curiosity message" step** wording — the flow is now **DIRECT_REPORT** (report sent immediately, no teaser). Confirm no code path still expects a separate curiosity teaser.
- [ ] Meta side (not code, but track): clean up the **stray Test WABA** + duplicate "Fortunemarq" business noted in `00_MASTER/PENDING_ACTIONS.md`.

---

## 6. Constraints & gotchas
- **Template approval:** a/b/c DIRECT_REPORT approved; **type_d in review**. Proposal/agreement/invoice/reminder/milestone/monthly/outcome templates still need submission/approval (UTILITY vs MARKETING categories matter).
- **24h window:** never send free-text cold — template only. Bot free-text only after a user message.
- **Env:** `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (1084263481446667), `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WA_OUTCOME_TEMPLATES`, `WHATSAPP_LP_FALLBACK_URL`, `ANTHROPIC_API_KEY`. Number = **+91 79759 18980** (dedicated; never install WhatsApp app on that SIM).
- **Compliance before volume:** do not enable mass sends until opt-out + throttling + monitoring are in place.

---

## 7. Definition of done (QA before launch gate)
- [ ] Bot answers + books end-to-end in the 24h window, escalates correctly, logs everything.
- [ ] All 12 surfaces (§2) fire with the correct approved template / session message.
- [ ] Opt-out, throttling, dedup, and human-takeover all verified.
- [ ] No real-lead sends until the full system passes QA (per the launch gate).
