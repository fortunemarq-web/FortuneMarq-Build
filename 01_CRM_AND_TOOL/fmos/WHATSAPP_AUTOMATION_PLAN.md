# FMOS — Full-Scale WhatsApp Automation Plan
**Status:** PLAN (not built). **Drafted:** 2026-06-16 · **Owner goal:** make FMOS run on the
same WhatsApp automation FortuneMarq sells to clients — automate + track every customer
touch across the lifecycle, so the agency visibly "eats its own cooking."

> Sequence agreed with owner: **(1) this plan → (2) collect prerequisites (Meta templates etc.)
> → (3) build → (4) deploy.** The audit-fix push is ON HOLD until WhatsApp automation ships
> with it (10 commits already local on `main`, tsc=0).

---

## 1. Design principle — one engine, not 20 hard-coded sends

FMOS already has a generic **automation engine** (`lib/automations/engine.ts`):

```
runTrigger(trigger, entityType, entityId, actorId?, context?)
   → match automation_rules (entity_type + trigger, is_enabled)
   → evaluate conditions (lib/automations/conditions.ts)
   → throttle check (automation_throttle)
   → execute actions (lib/automations/actions.ts)
   → log (automation_runs)
```

**The whole plan = three moves:**
1. **Add a `send_whatsapp` action** to the engine (+ `send_whatsapp_admin`). One place; every rule can use it.
2. **Fire `runTrigger` at every lifecycle event** that doesn't already (most of them).
3. **Register templates + rules** so each event maps to an approved template with the right params.

Everything else (template registry `whatsapp_templates`, outbound log `whatsapp_logs`, send
primitives `lib/whatsapp/send.ts`, inbound webhook) already exists.

### Why an action, not inline calls
Configurable in `/admin/automations` (no redeploy to tweak), throttled + logged for free,
condition-gated (e.g. only A/B leads, only if phone present, business hours), and the owner
can turn any message on/off from the UI.

---

## 2. WhatsApp rules you must respect (shape the design)

- **24-hour session window.** After a lead messages you, you have 24h to send *free-form*
  text/buttons/documents. Outside that window, business-initiated messages **must use a
  Meta-APPROVED template**. → Cold/proactive = template. Reactive within 24h = free text.
- **Template approval is external + slow.** Each new template is created in Meta WhatsApp
  Manager and reviewed (~minutes–2 days, can be rejected). This is the long pole; start early.
- **Category matters.** *Utility* (transactional: confirmations, invoices, reminders tied to
  an event) vs *Marketing* (promotional/nudges). Marketing needs an opt-out path and is
  rate/quality-gated. Miscategorized templates get rejected or throttled.
- **Cost.** Meta bills per 24h conversation (India ≈ ₹0.7–1.0 business-initiated; first 1,000
  service convos/month free). Auto-sending at scale has a real bill — plan rate caps.
- **Quality rating / spam.** Too many template sends or user blocks drops the number's quality
  rating → Meta limits sending. Opt-out + relevance matter commercially, not just legally.
- **Permanent token.** Production needs a **System User token** (never-expiring) with
  `whatsapp_business_messaging` + `whatsapp_business_management`. (See EXTERNAL_SETUP_GUIDE.)

---

## 3. The complete map — divided into 3 channels (by recipient)

Per the owner, every template / reminder / alert / automation is grouped by **who receives it**:

1. **WhatsApp for LEADS / CLIENTS** — customer-facing (this IS the product FMOS sells).
2. **WhatsApp for ADMIN** — owner/admin oversight, escalations, money + pipeline pulse.
3. **WhatsApp for STAFF** — each team member's personal work queue (next action, overdue, targets).

Legend — **Kind:** TPL=approved template (proactive), SES=free-text within 24h session, DOC=document.
**Trigger:** the `runTrigger` event (★ = not wired yet, must add). ✅ = template already approved.

> **Template efficiency by channel.** Customer messages (Ch.1) each need their *own* approved
> template (content + category + quality differ per message). Internal messages (Ch.2 + Ch.3)
> are also business-initiated (admins/staff won't open a 24h session), so they need templates
> too — **but they can share ONE generic parameterized template per channel**
> (`admin_alert` / `staff_alert`, body = `{{1}}` headline + `{{2}}` detail [+ `{{3}}` link]).
> So all of Ch.2 and Ch.3 ride on ~2–3 Meta templates total, not dozens.

---

### CHANNEL 1 — WhatsApp for LEADS / CLIENTS  (external, customer-facing)
*Recipient: the lead's / client's `phone`. Mostly proactive templates; reactive within 24h window.*

**1.1 Lead acknowledgement & nurture**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L1 | New inbound lead — `lead_created` (wired) | TPL | "Thanks for reaching out to FortuneMarq — we'll call you shortly." | `lead_ack_inbound` (Utility) |
| L2 | Outcome `INTERESTED_SEND_INFO` — `lead_outcome_logged` ★ | TPL | Market-research report opener, picked by A/B/C/D | `direct_report_type_a/b/c/d` ✅ |
| L3 | Report/PDF delivery (after opener) | DOC | the actual report file/link | `sendWhatsAppDocument` (in-session) |
| L4 | Outcome `NO_ANSWER` after N tries ★ | TPL | "Tried reaching you — when's a good time?" | `missed_you` (Marketing) |
| L5 | Outcome `INTERESTED_FOLLOW_UP` ★ | TPL | "Great talking — I'll follow up {date}." | `followup_scheduled` (Utility) |
| L6 | Revival / re-engage cold lead ★ (cron) | TPL | win-back nudge | `revival_nudge` (Marketing) |

**1.2 Meetings**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L7 | Meeting booked (`meeting_booked`) ★ | TPL | confirmation + date/time + link | `meeting_confirmation` (Utility) |
| L8 | 1 hour before ★ (scheduler) | TPL | "Our call is in 1 hour. {link}" | `meeting_reminder_1h` (Utility) |
| L9 | 15 min before ★ (scheduler) | TPL | "Starting in 15 min. {link}" | `meeting_reminder_15m` (Utility) |
| L10 | No-show — time passed, not attended ★ | TPL | "Sorry we missed you — reschedule?" | `meeting_noshow` (Marketing) |
| L11 | Attended → proposal coming | SES/TPL | "Great meeting — proposal on the way." | `meeting_thanks` (Utility) |

**1.3 Proposals & agreements**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L12 | Proposal sent ★ | TPL | "Your proposal is ready: {link}" | `proposal_sent` (Utility) |
| L13 | Proposal follow-up (no reply X days) ★ (cron) | TPL | "Any questions on the proposal?" | `proposal_followup` (Marketing) |
| L14 | Agreement sent ★ | TPL | "Your agreement is ready to sign: {link}" | `agreement_sent` (Utility) |
| L15 | Agreement signed → welcome ★ | TPL | "Welcome to FortuneMarq! Next steps…" | `agreement_welcome` (Utility) |

**1.4 Onboarding & delivery**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L16 | Client created / onboarding generated ★ | TPL | "Welcome — complete your intake: {link}" | `onboarding_intake` (Utility) |
| L17 | Intake incomplete reminder ★ (cron) | TPL | "Reminder: finish your build brief." | `onboarding_reminder` (Marketing) |
| L18 | Project milestone (site live, GMB done…) ★ | TPL | "Update: {milestone} is live 🎉" | `project_update` (Utility) |
| L19 | Deliverable needs client approval ★ | TPL | "Please review & approve: {link}" | `approval_request` (Utility) |

**1.5 Finance**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L20 | Invoice issued ★ | TPL/DOC | "Invoice {no} for {amount}: {link}" | `invoice_sent` (Utility) |
| L21 | Payment due soon ★ (cron) | TPL | "Invoice {no} due {date}." | `payment_reminder` (Utility) |
| L22 | Payment overdue ★ (cron) | TPL | "Invoice {no} is overdue." | `payment_overdue` (Utility) |
| L23 | Payment received ★ | TPL | "Payment received — thank you!" | `payment_received` (Utility) |

**1.6 Reports**
| # | Event | Kind | Message | Template |
|---|---|---|---|---|
| L24 | Monthly report published (`/client/report/[token]`) ★ | TPL | "Your {month} report is ready: {link}" | `monthly_report_ready` (Utility) |

**1.7 Two-way (reactive, already built — needs Meta webhook config)**
| # | Event | Kind | Status |
|---|---|---|---|
| L25 | Lead messages first → auto-greeting + buttons | SES | built (`webhooks/whatsapp`) |
| L26 | Button-reply routing (interested / not now / call me) | SES | built |
| L27 | Inbound reply logging + CTWA attribution | — | built (`whatsapp_logs`) |
| L28 | **Opt-out** ("STOP") → suppress all future sends ★ | — | NEW (compliance, applies to ALL channels) |
| L29 | Delivery receipts (sent/delivered/read) → `delivery_status` ★ | — | partial |

---

### CHANNEL 2 — WhatsApp for ADMIN  (owner + admins: oversight & escalation)
*Recipient: `ADMIN_WHATSAPP_NUMBERS` (3 numbers, already set). Rides on `daily_report` + a generic `admin_alert`.*

| # | Event | Trigger | Message | Template |
|---|---|---|---|---|
| A1 | Daily metrics digest | daily cron (wired) | calls/leads/meetings/₹ summary | `daily_report` ✅ (live on push) |
| A2 | New inbound lead arrived | `lead_created` (wired) | "New {channel} lead: {company}, {city}." | `admin_alert` |
| A3 | Lead re-enquired | capture.ts dedupe path | "{company} reached out again." | `admin_alert` |
| A4 | Hot/high-score lead | `lead_created` + condition | "🔥 Hot lead: {company} ({score})." | `admin_alert` |
| A5 | SLA missed (nobody called in time) | `lead_sla_missed` (wired) | "SLA breach: {company}." | `admin_alert` |
| A6 | Meeting booked | `meeting_booked` ★ | "Meeting booked: {company}." | `admin_alert` |
| A7 | Proposal accepted / Deal won 🎉 | stage `won` ★ | "Deal won: {company}, ₹{value}." | `admin_alert` |
| A8 | Agreement signed | `agreement_signed` ★ | "{company} signed." | `admin_alert` |
| A9 | Payment received (revenue in) | `payment_received` ★ | "₹{amount} received from {client}." | `admin_alert` |
| A10 | Large invoice overdue (collections risk) | finance cron ★ | "{client} overdue ₹{amount}." | `admin_alert` |
| A11 | System health (send failures / quality drop / cron fail) | internal ★ | "⚠️ {issue}." | `admin_alert` |

> Optional: weekly summary + month-end finance summary (later). All Ch.2 = 1 generic template + the digest.

---

### CHANNEL 3 — WhatsApp for STAFF  (telecallers, strategists, PMs: personal work queue)
*Recipient: the individual staff member's WhatsApp (needs `profiles.phone` — see §4). Rides on a generic `staff_alert`.*

**3.1 Leads & follow-ups (telecaller)**
| # | Event | Trigger | Message | Template |
|---|---|---|---|---|
| S1 | New lead assigned to you | `lead_created`/assign ★ | "New lead assigned: {company}. Call today." | `staff_alert` |
| S2 | Your follow-up is due | `lead_followup_due` (wired) | "Follow-up due: {company}." | `staff_alert` |
| S3 | Your follow-up is overdue | followup cron ★ | "Overdue follow-up: {company}." | `staff_alert` |
| S4 | SLA breach on YOUR lead (before admin escalation) | `lead_sla_missed` (wired) | "Act now: {company} SLA risk." | `staff_alert` |

**3.2 Meetings (the rep who booked)**
| # | Event | Trigger | Message | Template |
|---|---|---|---|---|
| S5 | Your meeting in 1h / 15m (prep) | scheduler ★ | "Your meeting with {company} in {t}." | `staff_alert` |

**3.3 Tasks & projects (staff / PM)**
| # | Event | Trigger | Message | Template |
|---|---|---|---|---|
| S6 | Task assigned to you | task insert ★ | "New task: {title} (due {date})." | `staff_alert` |
| S7 | Task due today / overdue | `task_overdue` (wired) | "Task overdue: {title}." | `staff_alert` |
| S8 | Deliverable revision requested / your action | deliverable ★ | "Revision needed: {item}." | `staff_alert` |

**3.4 Performance & attendance**
| # | Event | Trigger | Message | Template |
|---|---|---|---|---|
| S9 | Daily target nudge | daily cron ★ | "You're at {x}/{goal} calls today." | `staff_alert` |
| S10 | End-of-day personal summary | daily cron ★ | "Today: {calls} calls, {interested} interested." | `staff_alert` |
| S11 | Clock-in / clock-out reminder | attendance cron ★ | "Don't forget to clock {in/out}." | `staff_alert` |
| S12 | Streak / milestone recognition | daily cron ★ | "🏆 {n}-day streak! Keep going." | `staff_alert` |

---

## 4. Prerequisites — collect BEFORE build

### 4a. Meta templates to create + submit, BY CHANNEL (the long pole — start now)
Already approved: `daily_report` (Ch.2), `direct_report_type_a/b/c/d` (Ch.1).

**CHANNEL 1 — Leads/Clients (each message needs its OWN template):**
- *Tier 1 (core sales loop):* `lead_ack_inbound`, `meeting_confirmation`, `meeting_reminder_1h`,
  `meeting_reminder_15m`, `proposal_sent`.
- *Tier 2 (close + onboard):* `agreement_sent`, `agreement_welcome`, `onboarding_intake`,
  `followup_scheduled`, `missed_you`, `proposal_followup`, `meeting_thanks`.
- *Tier 3 (delivery + finance):* `project_update`, `approval_request`, `monthly_report_ready`,
  `invoice_sent`, `payment_reminder`, `payment_overdue`, `payment_received`, `meeting_noshow`,
  `onboarding_reminder`, `revival_nudge`.

**CHANNEL 2 — Admin: ONE generic template** → `admin_alert` (Utility),
body `{{1}}` headline · `{{2}}` detail · optional `{{3}}` link. Reused for A2–A11.

**CHANNEL 3 — Staff: ONE generic template** → `staff_alert` (Utility),
body `{{1}}` headline · `{{2}}` detail. Reused for S1–S12.

> So the internal channels (2 + 3) need just **2 templates total**; the real submission work is
> Channel 1. For EACH template the owner provides: **name, category, language, body text with
> numbered `{{1}}` params, and param order.** (Build Phase 1 produces a copy-paste spec sheet.)

### 4b. Config / infra
- **Permanent System User token** for `WHATSAPP_API_TOKEN` (current may be temporary).
- **Meta webhook configured** post-deploy (callback URL + verify token + subscribe `messages`)
  — turns on J1–J5 (already a pending deploy step).
- **`ADMIN_WHATSAPP_NUMBERS`** ✅ set (3 numbers) — for internal/admin pings.
- **Frequent cron** for time-based reminders (C2/C3, G2/G3, D2, F2). Current GitHub Actions
  schedule is coarse; add a ~15-min tick (or a dedicated reminders cron).
- **`WHATSAPP_LP_FALLBACK_URL`** if auto-replies should point somewhere other than the homepage.

### 4c. Recipient numbers per channel
- **Ch.1 (leads/clients):** `leads.phone` / client phone — already captured. ✅
- **Ch.2 (admin):** `ADMIN_WHATSAPP_NUMBERS` — already set (3 numbers). ✅
- **Ch.3 (staff):** need each staff member's WhatsApp number — **verify/collect `profiles.phone`**
  (add column if missing) + a UI field on `/admin/team` or `/admin/users`. Engine routes a
  `staff_alert` to the assignee's number. (Without this, Ch.3 can't send.)

### 4d. Schema additions (small)
- `leads`/`clients`: `wa_opt_out boolean default false` (+ check before every send) — L28.
- `profiles`: `phone` + `wa_opt_in` (staff can opt out of personal alerts) — Ch.3.
- `automation_rules` seed rows per touchpoint (or build them in the UI).
- `whatsapp_templates` registry rows (name → lead_type → variable map) so the engine resolves
  template + params per trigger. Table already supports this (`lead_type`, `variables`).
- (Optional) `wa_quiet_hours` / per-rule send-window config.

### 4e. Decisions needed from owner → see §6.

---

## 5. Build phases (after prerequisites)

- **Phase 1 — Engine + send_whatsapp action (UNBLOCKED, build first).**
  - Add `send_whatsapp` / `send_whatsapp_admin` to `Action` type + `executeAction`.
  - Param builder: snapshot → template components (lead → business_name/niche/city; lead_type
    → A/B/C/D template select). Reuse/upgrade `outcome-send.ts` to pass params.
  - Opt-out guard + `whatsapp_logs` logging (already in `send.ts`).
  - Wire the FIRST live message end-to-end: **B1 outcome→report** (templates already approved).
- **Phase 2 — Fire triggers everywhere ★.** Add `runTrigger` at: outcome logged (cockpit +
  pitch list), stage change (centralize via a `applyLeadStage()` helper around `leadStageUpdate`),
  meeting booked, proposal sent, agreement sent/signed, client created, invoice events, report
  published. Define trigger names + entity types.
- **Phase 3 — Config UI.** `/admin/automations`: expose `send_whatsapp` action (pick template,
  audience, conditions). `/admin/whatsapp-templates`: register approved templates + variable map.
- **Phase 4 — Reminders scheduler.** Add the frequent cron; build C2/C3/G2/G3/D2/F2 (activate as
  templates get approved).
- **Phase 5 — Finance / delivery / reports** (G, F, H) as those templates land.
- **Phase 6 — Two-way hardening.** Opt-out (J4), delivery receipts (J5), quiet hours, rate caps.

Each phase: `tsc=0` + build green before commit; nothing sends to real leads until its template
is approved AND its rule is enabled.

---

## 6. Open decisions for the owner (resolve before/early in build)

1. **Report delivery (B1/B5):** the `direct_report_*` templates promise a report but contain no
   link. Options: (a) opener template → then send a PDF/link as a session message; (b) re-submit
   templates with a URL button param; (c) treat them as conversation-openers only. Which?
2. **Opt-out policy (J4):** honor "STOP" globally + suppress all future sends? (Strongly
   recommended.) Any wording?
3. **Quiet hours / rate caps:** any send-time window (e.g. 9am–8pm IST) and a daily cap to control
   cost + quality rating?
4. **v1 must-haves vs later:** which touchpoints are launch-blocking vs nice-to-have? (Suggest v1 =
   A1, A2, B1, C1–C3, D1, I1 — the core sales loop.)
5. **Tone/branding:** who writes the template copy (owner) — English only, or +Hindi/Kannada?
6. **Audience for client-facing sends:** lead `phone` is the target; confirm clients table phone
   field for F/G/H.

---

## 7. What's already done (re-use, don't rebuild)
- Send primitives: `lib/whatsapp/send.ts` (text, **template w/ components**, buttons, document, media upload).
- Inbound webhook: `app/api/webhooks/whatsapp/route.ts` (handshake, signature, greeting, button replies, attribution).
- Outbound log: `whatsapp_logs`. Template registry: `whatsapp_templates` (`lead_type`, `variables`).
- Daily report: `lib/reports/dailyReport.ts` (H2) — wired + `ADMIN_WHATSAPP_NUMBERS` set.
- Automation engine: `lib/automations/{engine,actions,conditions,types}.ts` + `automation_rules`,
  `automation_throttle`, `automation_runs`.
- Outcome-send scaffold: `lib/whatsapp/outcome-send.ts` (needs param support, gated by `WA_OUTCOME_TEMPLATES`).
