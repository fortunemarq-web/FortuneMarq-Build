# FMOS — WhatsApp Templates (FINAL, for Meta submission)

**Drafted:** 2026-06-16 · Supersedes `WHATSAPP_TEMPLATE_SPEC.md`. Reviewed + warmed in Cowork.
**Format rules:** numbered params `{{n}}` · links **inline** (no buttons — engine can't fill button params) · Marketing templates carry a `Reply STOP to opt out.` footer · category honesty (Utility = transactional/event-tied, Marketing = promo/re-engagement) · body never starts/ends with a param, no two params adjacent.

**Already approved — DO NOT resubmit:** `daily_report` + the Direct Report family. The **live** family is `direct_report_v3_{a,b,c,d}` (a TEXT template — body + 3 quick-reply buttons: Book a meeting / Tell me more / ಕನ್ನಡ ವರದಿ — then the matched PDF as a follow-up). The older `direct_report_type_a/b/c/d` (and `direct_report_cover_*`) predecessors are **superseded** but remain approved at Meta.

**This file = 33 templates to submit** (17 with the core loop + finance, plus growth + 2 internal alerts).

---

## TIER 1 — core sales loop (submit first)

### `lead_ack_inbound` · Utility
**When:** instant a new inbound lead arrives (web form, ad, WhatsApp enquiry), before anyone calls.
```
Hi {{1}}! 😊 Thanks for reaching out to FortuneMarq — we've received your enquiry and one of our specialists will call you shortly. Talk soon! — Team FortuneMarq
```
`{{1}}` name (Ramesh)

### `meeting_confirmation` · Utility
**When:** the moment a meeting is booked (WhatsApp button or Afifa "book now").
```
Hi {{1}}! 🙌 Your meeting with Jabeer from FortuneMarq is confirmed for {{2}}. He'll walk you through a presentation built specifically for your business. Join on Google Meet: {{3}} — see you then!
```
`{{1}}` name · `{{2}}` date & time (`{follow_up_date:datetime}`) · `{{3}}` Meet link

### `meeting_reminder_1h` · Utility
**When:** ~1 hour before the booked meeting.
```
Hi {{1}}! 👋 Quick reminder — your call with Jabeer from FortuneMarq is in about 1 hour. Need a different time? Reschedule here: {{2}}. Talk soon!
```
`{{1}}` name · `{{2}}` reschedule link

### `meeting_reminder_15m` · Utility
**When:** ~15 min before the call.
```
Hi {{1}}! Your FortuneMarq call starts in about 15 minutes — we'll reach you on this number shortly. See you!
```
`{{1}}` name

### `proposal_sent` · Utility
**When:** right after the meeting when the lead asks for a proposal (one-click).
```
Hi {{1}}! 😊 Really good speaking with you today — here's the proposal for {{2}}. Everything we discussed is in there: services, pricing, and timelines. View it here: {{3}}. Let me know if you have any questions. — Jabeer, FortuneMarq
```
`{{1}}` name · `{{2}}` business · `{{3}}` proposal link

---

## TIER 2 — close + onboard

### `meeting_thanks` · Utility
**When:** right after a meeting ends (thank-you before proposal).
```
Hi {{1}}! 😊 Thanks for your time today — it was great learning about {{2}}. We'll get your tailored proposal over to you shortly. — Jabeer, FortuneMarq
```
`{{1}}` name · `{{2}}` business

### `agreement_sent` · Utility
**When:** lead's ready to proceed — review + confirm (they reply "Yes, confirmed" → webhook → advance invoice).
```
Hi {{1}}! 😊 Great to know you'd like to move forward. Here's your service agreement to review: {{2}}. To recap what we're starting with: {{3}} and {{4}}. If it all looks good, just reply "Yes, confirmed" and we'll get started. — Jabeer, FortuneMarq
```
`{{1}}` name · `{{2}}` agreement link · `{{3}}` service 1 · `{{4}}` service 2

### `agreement_welcome` · Utility
**When:** the moment the lead replies "Yes, confirmed."
```
Welcome to FortuneMarq, {{1}}! 🎉 Your agreement is confirmed and we're starting onboarding now. We'll be in touch with the next steps shortly. — Team FortuneMarq
```
`{{1}}` name

### `onboarding_intake` · Utility
**When:** right after signing/payment, to collect client info + assets.
```
Hi {{1}}! 😊 Welcome aboard! To get your project started, please fill in your quick onboarding form here: {{2}} — it takes about 10 minutes and helps us get everything we need from your side.
```
`{{1}}` name · `{{2}}` form link

### `onboarding_reminder` · Marketing
**When:** if the client hasn't finished onboarding after a while.
```
Hi {{1}}! 👋 Quick reminder to finish your onboarding form so we can get your project moving: {{2}} — only takes a few minutes. — Team FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` form link

### `followup_scheduled` · Utility
**When:** Afifa logs a call "interested — follow up later."
```
Hi {{1}}! Thanks for your time today. As discussed, I'll follow up with you on {{2}}. In the meantime, here's what we do: {{3}}. Talk soon! — Afifa, FortuneMarq
```
`{{1}}` name · `{{2}}` follow-up date & time · `{{3}}` landing page link

### `follow_back` · Utility
**When:** lead said busy before the pitch; confirms a callback.
```
Hi {{1}}! As promised, I'll call you back on {{2}}. Talk then! — Afifa, FortuneMarq
```
`{{1}}` name · `{{2}}` callback date & time

### `followback_reminder_interested` · Utility
**When:** day of a 24h+ scheduled callback, interested lead (no reminder if <24h).
```
Hi {{1}}! 👋 Quick heads-up — I'll be calling you today around {{2}} as discussed. Have a look before the call: {{3}}. Talk soon! — Afifa, FortuneMarq
```
`{{1}}` name · `{{2}}` call time · `{{3}}` landing page link

### `followback_reminder_busy` · Utility
**When:** day of a 24h+ scheduled callback, busy lead (no reminder if <24h).
```
Hi {{1}}! 👋 This is Afifa from FortuneMarq — we spoke briefly. I'll call back today around {{2}}. We've got market research for {{3}} businesses in {{4}} to share — quick look: {{5}}. Talk soon!
```
`{{1}}` name · `{{2}}` call time · `{{3}}` niche · `{{4}}` city · `{{5}}` landing page link

### `missed_you` · Marketing
**When:** after a no-answer call — couldn't reach the lead.
```
Hi {{1}}! 👋 This is FortuneMarq — we tried reaching you about growing {{2}} online but couldn't connect. When's a good time to call you back?
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` business

### `not_interested` · Marketing
**When:** Afifa logs a call "not interested" (soft close).
```
Hi {{1}}! Thanks for hearing me out today. If you ever want to see what's moving in your market, here's what we do: {{2}}. Always here if you need us. — FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` landing page link

### `send_info` · Marketing
**When:** "tell me more" / send-info request (company details).
```
Hi {{1}}! 😊 A bit about us — FortuneMarq builds complete online growth systems for local businesses in {{2}}: website, Google visibility, ads, and lead generation. See our work: {{3}} — or call us on +91 93530 82656. Want a quick free call with our founder Jabeer? Just reply. — FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` city · `{{3}}` landing page link

### `proposal_followup` · Marketing
**When:** ~48h after the proposal, no reply.
```
Hi {{1}}! 👋 Just checking in — did you get a chance to look at the proposal for {{2}}? No rush — just making sure it reached you and seeing if you have any questions. Happy to jump on a quick call. — Jabeer, FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` business

---

## TIER 3 — delivery + finance

### `project_update` · Utility  *(milestone nudge, 4.6)*
**When:** a delivery milestone completes.
```
Hi {{1}}! 🎉 Update on your project: {{2}} is now live. We'll keep you posted as we hit the next milestone. — Team FortuneMarq
```
`{{1}}` name · `{{2}}` milestone (Your new website)

### `approval_request` · Utility
**When:** a deliverable needs client review/approval.
```
Hi {{1}}! 😊 A deliverable is ready for your review: {{2}}. Have a look when you can and let us know your feedback. — Team FortuneMarq
```
`{{1}}` name · `{{2}}` review link

### `monthly_report_ready` · Utility  *(4.6)*
**When:** each month when the client's report is generated.
```
Hi {{1}}! 📊 Your {{2}} performance report from FortuneMarq is ready: {{3}}. Let's catch up on the results whenever you're free. — Team FortuneMarq
```
`{{1}}` name · `{{2}}` month · `{{3}}` report link

### `invoice_sent` · Utility
**When:** advance invoice on agreement-signed, and recurring monthly invoices.
```
Hi {{1}}! 🎉 Invoice {{2}} for {{3}} is ready: {{4}}.

💳 Bank transfer:
Karnataka Bank · A/C: FortuneMarq Media & Marketing
A/C No: 0332202500001101 · IFSC: KARB0000332

Once payment's done we'll start right away. Thank you! — FortuneMarq
```
`{{1}}` name · `{{2}}` invoice no · `{{3}}` amount (`{amount:inr}`) · `{{4}}` invoice link

### `payment_reminder` · Utility
**When:** on/just before the invoice due date.
```
Hi {{1}}! 👋 A friendly reminder — invoice {{2}} for {{3}} is due on {{4}}. Pay here: {{5}}.

💳 Bank transfer:
Karnataka Bank · A/C: FortuneMarq Media & Marketing
A/C No: 0332202500001101 · IFSC: KARB0000332

Thank you! — FortuneMarq
```
`{{1}}` name · `{{2}}` invoice no · `{{3}}` amount · `{{4}}` due date · `{{5}}` link

### `payment_overdue` · Utility
**When:** invoice passes due date (also → Afifa collections board, 4.7).
```
Hi {{1}}, just a note that invoice {{2}} for {{3}} is now overdue. Please settle it when you can: {{4}}.

💳 Bank transfer:
Karnataka Bank · A/C: FortuneMarq Media & Marketing
A/C No: 0332202500001101 · IFSC: KARB0000332

Reach out if you need anything. — FortuneMarq
```
`{{1}}` name · `{{2}}` invoice no · `{{3}}` amount · `{{4}}` link

### `payment_received` · Utility
**When:** a FULL payment is marked received.
```
Hi {{1}}! 🎉 We've received your payment of {{2}} for invoice {{3}} — thank you! Your account is all up to date. — FortuneMarq
```
`{{1}}` name · `{{2}}` amount · `{{3}}` invoice no

### `payment_partial_received` · Utility
**When:** a PARTIAL payment is recorded against an invoice.
```
Hi {{1}}! 😊 We've received {{2}} towards invoice {{3}}. Remaining balance: {{4}}. You can pay the rest here: {{5}}. Thank you! — FortuneMarq
```
`{{1}}` name · `{{2}}` amount paid · `{{3}}` invoice no · `{{4}}` balance due · `{{5}}` link

---

## GROWTH (4.8)

### `review_request` · Utility
**When:** after a client sees good results.
```
Hi {{1}}! 😊 So glad we could help {{2}} grow. If you're happy with the results, a quick Google review would mean a lot: {{3}}. Thank you! — Team FortuneMarq
```
`{{1}}` name · `{{2}}` business · `{{3}}` review link

### `referral_request` · Marketing
**When:** after good results.
```
Hi {{1}}! 😊 Glad {{2}} is seeing results! Know another owner who could use the same? Send them our way: {{3}}. Thank you! — FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` business · `{{3}}` link

### `renewal_reminder` · Utility
**When:** before the retainer renews.
```
Hi {{1}}! 👋 Your FortuneMarq retainer for {{2}} renews on {{3}}. We'll keep everything running smoothly — reach out to adjust anything. — Team FortuneMarq
```
`{{1}}` name · `{{2}}` business/service · `{{3}}` renewal date

### `revival_nudge` · Marketing  *(reactivation, 6.6)*
**When:** cold / "not now" leads after weeks/months.
```
Hi {{1}}! 👋 It's been a while! FortuneMarq is helping businesses in {{2}} grow online — we'd love to help {{3}} too. Up for a quick chat? — FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` city · `{{3}}` business

### `meeting_noshow` · Marketing
**When:** lead no-shows a booked meeting (tags `no_show` → follow-up, 3.4).
```
Hi {{1}}! Sorry we missed each other for our call today. Would you like to reschedule? Reply with a time that suits you, or rebook here: {{2}}. — Jabeer, FortuneMarq
Reply STOP to opt out.
```
`{{1}}` name · `{{2}}` reschedule link

---

## INTERNAL ALERTS (Channel 2/3 — exactly 2 params each)

### `admin_alert` · Utility
**When:** all internal alerts to Jabeer (hot lead, agreement confirmed, payment, flags). Put any URL at the end of `detail`; do NOT set a separate link param.
```
FortuneMarq OS — {{1}}. {{2}} (automated alert)
```
`{{1}}` headline · `{{2}}` detail

### `staff_alert` · Utility
**When:** internal nudges to staff/Afifa (follow-up due, callback today, task assigned).
```
FortuneMarq — {{1}}. {{2}} (open FMOS to action)
```
`{{1}}` headline · `{{2}}` detail

---

## Submission order
1. Tier 1 (5) + `admin_alert` + `staff_alert` — core loop + alerts live first.
2. Tier 2 (13).
3. Tier 3 (8) + Growth (5).

Nothing sends to a real lead until **both** the template is approved **and** its rule is enabled — and per the launch gate, not until the whole system is built + QA'd.
