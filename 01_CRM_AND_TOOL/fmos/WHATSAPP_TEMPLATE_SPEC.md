> # ⚠️ SUPERSEDED — DO NOT USE
> Outdated (24 templates). Current source of truth: **`WHATSAPP_TEMPLATES_FINAL.md`** (33 templates,
> reviewed + warmed, all edits applied), with machine-readable defs in
> `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json`.
> All 33 were submitted to Meta on 2026-06-16 and are now **APPROVED and live**. Kept for history only.

---

# FMOS — WhatsApp Template Spec Sheet (for Meta approval) — [SUPERSEDED]
**Status:** SUPERSEDED by `WHATSAPP_TEMPLATES_FINAL.md`.

Copy each template below into **Meta WhatsApp Manager → Message Templates → Create**.
For each: set **Name**, **Category**, **Language = English**, paste the **Body**, and when Meta
asks for **sample values**, use the samples given. Submit. Approval takes minutes–2 days and can
be rejected — start the long-pole ones (Tier 1) first.

---

## 0. READ FIRST — how these map to FMOS (don't skip)

The automation engine builds **BODY parameters only**. There is today **no** header image,
no URL-button parameter, no quick-reply parameter wired in `lib/whatsapp/params.ts`. That drives
three hard rules for every template below:

1. **Links go INLINE in the body** as a normal `{{n}}` text param (e.g. `View it here: {{2}}`).
   Do **not** add a URL button in Meta — the engine can't fill it, so the button would render with
   a broken/empty link. (A URL-button param is a future enhancement; until then, inline only.)
2. **Param count is exact.** Meta rejects a send if the number of values ≠ the number of `{{n}}`
   in the approved template. So a template's param count is fixed — see each spec. The two
   internal templates are therefore **exactly 2 params** (no "optional 3rd"); fold any link into
   the detail text.
3. **Values render raw from the lead/entity row.** A token like `{follow_up_date}` sends the raw
   DB value (e.g. an ISO timestamp). For anything that needs friendly formatting (dates, ₹ amounts)
   either store a pre-formatted field or pass a literal — see **§4 Param formatting caveat**. Keep
   sample values realistic so reviewers approve, but know the live value comes from the row.

**Meta content rules baked into the wording below** (so they pass review):
- Body must **not begin or end with a `{{n}}`**, and **no two `{{n}}` may be adjacent** (always
  real text between them). Every template here already obeys this.
- Param values can't contain newlines, tabs, or 4+ consecutive spaces.
- **Category honesty:** transactional / event-tied = **Utility**; promotional / re-engagement /
  win-back = **Marketing**. Miscategorising gets templates rejected or throttled. Marketing
  templates include an opt-out footer (see each).

**Already approved — do NOT resubmit:** `daily_report` (Ch.2 digest),
`direct_report_type_a` / `direct_report_type_b` / `direct_report_type_c` / `direct_report_type_d`
(Ch.1 report openers, selected by lead A/B/C/D via `leadTypeTemplates`).

**Totals to submit:** 22 Channel-1 + 1 `admin_alert` + 1 `staff_alert` = **24 new templates**
(17 Utility, 5 Marketing in Ch.1; 2 Utility internal). Submit Tier 1 first.

---

## CHANNEL 1 — Leads / Clients (each needs its own template)

> Param **Source** column = the FMOS token the engine fills from the entity row
> (`lib/whatsapp/params.ts` `fill()`), or a literal you pass in the rule's `params`.

### Tier 1 — core sales loop (submit first)

#### `lead_ack_inbound` — Utility
**Body:**
```
Hi {{1}}, thanks for reaching out to FortuneMarq! We've received your enquiry and a growth specialist will call you shortly. — Team FortuneMarq
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |

#### `meeting_confirmation` — Utility
**Body:**
```
Hi {{1}}, your strategy call with FortuneMarq is confirmed for {{2}}. We'll call you on this number — looking forward to speaking with you!
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | meeting date/time | `{follow_up_date}` (see §4 caveat) | Tue 17 Jun, 4:00 PM |

#### `meeting_reminder_1h` — Utility
**Body:**
```
Hi {{1}}, a quick reminder — your FortuneMarq strategy call is in about 1 hour. Talk soon!
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |

#### `meeting_reminder_15m` — Utility
**Body:**
```
Hi {{1}}, your FortuneMarq call starts in about 15 minutes. We'll reach you on this number shortly.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |

#### `proposal_sent` — Utility
**Body:**
```
Hi {{1}}, your growth proposal from FortuneMarq is ready. View it here: {{2}} — happy to walk you through any questions.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | proposal link | literal/`{proposal_link}` | https://fmos.fortunemarq.com/p/abc123 |

---

### Tier 2 — close + onboard

#### `agreement_sent` — Utility
**Body:**
```
Hi {{1}}, your FortuneMarq service agreement is ready to review and sign: {{2}} — let us know if anything needs adjusting.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | agreement link | literal/`{agreement_link}` | https://fmos.fortunemarq.com/a/abc123 |

#### `agreement_welcome` — Utility
**Body:**
```
Welcome to FortuneMarq, {{1}}! Your agreement is signed and onboarding is starting now. Your account manager will reach out with next steps shortly.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |

#### `onboarding_intake` — Utility
**Body:**
```
Hi {{1}}, welcome aboard! To kick off your project, please complete your onboarding intake here: {{2}} — it takes about 10 minutes.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | intake link | literal/`{intake_link}` | https://fmos.fortunemarq.com/intake/abc123 |

#### `followup_scheduled` — Utility
**Body:**
```
Hi {{1}}, great speaking with you! As agreed, I'll follow up with you on {{2}}. Feel free to reach out anytime before then.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | follow-up date | `{follow_up_date}` (see §4) | Fri 20 Jun |

#### `missed_you` — **Marketing**
**Body:**
```
Hi {{1}}, this is FortuneMarq — we tried reaching you about growing {{2}} but couldn't connect. When's a good time to call you back?
```
**Footer:** `Reply STOP to opt out.`
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | business name | `{company_name}` | Ramesh Motors |

#### `proposal_followup` — **Marketing**
**Body:**
```
Hi {{1}}, just checking in on the proposal we sent for {{2}}. Any questions I can help with? Happy to jump on a quick call.
```
**Footer:** `Reply STOP to opt out.`
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | business name | `{company_name}` | Ramesh Motors |

#### `meeting_thanks` — Utility
**Body:**
```
Hi {{1}}, thanks for your time today! It was great learning about {{2}}. We'll have your tailored proposal over to you shortly.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | business name | `{company_name}` | Ramesh Motors |

---

### Tier 3 — delivery + finance

#### `project_update` — Utility
**Body:**
```
Hi {{1}}, an update on your project with FortuneMarq: {{2}} is now live. We'll keep you posted on the next milestone.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | milestone | literal/`{milestone}` | Your new website |

#### `approval_request` — Utility
**Body:**
```
Hi {{1}}, a deliverable is ready for your review and approval: {{2}} — please take a look when you can and share your feedback.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | review link | literal/`{review_link}` | https://fmos.fortunemarq.com/review/abc123 |

#### `monthly_report_ready` — Utility
**Body:**
```
Hi {{1}}, your {{2}} performance report from FortuneMarq is ready. View it here: {{3}} — let's catch up on the results.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | report month | literal/`{report_month}` | May |
| {{3}} | report link | literal/`{report_link}` | https://fmos.fortunemarq.com/client/report/abc123 |

#### `invoice_sent` — Utility
**Body:**
```
Hi {{1}}, invoice {{2}} for {{3}} is ready. You can view and pay it here: {{4}} — thank you!
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | invoice number | literal/`{invoice_no}` | INV-1042 |
| {{3}} | amount | literal/`{amount}` (see §4) | ₹25,000 |
| {{4}} | invoice link | literal/`{invoice_link}` | https://fmos.fortunemarq.com/inv/abc123 |

#### `payment_reminder` — Utility
**Body:**
```
Hi {{1}}, a reminder that invoice {{2}} for {{3}} is due on {{4}}. You can pay here: {{5}}. Thank you!
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | invoice number | literal/`{invoice_no}` | INV-1042 |
| {{3}} | amount | literal/`{amount}` | ₹25,000 |
| {{4}} | due date | literal/`{due_date}` | 25 Jun |
| {{5}} | invoice link | literal/`{invoice_link}` | https://fmos.fortunemarq.com/inv/abc123 |

#### `payment_overdue` — Utility
**Body:**
```
Hi {{1}}, our records show invoice {{2}} for {{3}} is now overdue. Please settle it here at your earliest convenience: {{4}} — reach out if you need anything.
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | invoice number | literal/`{invoice_no}` | INV-1042 |
| {{3}} | amount | literal/`{amount}` | ₹25,000 |
| {{4}} | invoice link | literal/`{invoice_link}` | https://fmos.fortunemarq.com/inv/abc123 |

#### `payment_received` — Utility
**Body:**
```
Hi {{1}}, we've received your payment of {{2}} for invoice {{3}}. Thank you — your account is all up to date!
```
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | amount | literal/`{amount}` | ₹25,000 |
| {{3}} | invoice number | literal/`{invoice_no}` | INV-1042 |

#### `meeting_noshow` — **Marketing**
**Body:**
```
Hi {{1}}, sorry we missed each other for our scheduled call today. Would you like to reschedule? Just reply with a time that suits you.
```
**Footer:** `Reply STOP to opt out.`
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |

#### `onboarding_reminder` — **Marketing**
**Body:**
```
Hi {{1}}, a quick reminder to finish your FortuneMarq onboarding so we can get your project moving: {{2}} — it only takes a few minutes.
```
**Footer:** `Reply STOP to opt out.`
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | intake link | literal/`{intake_link}` | https://fmos.fortunemarq.com/intake/abc123 |

#### `revival_nudge` — **Marketing**
**Body:**
```
Hi {{1}}, it's been a while! FortuneMarq is helping businesses in {{2}} grow online, and we'd love to help {{3}} too. Interested in a quick chat?
```
**Footer:** `Reply STOP to opt out.`
| Param | Meaning | Source | Sample |
|---|---|---|---|
| {{1}} | contact name | `{contact_person}` | Ramesh |
| {{2}} | city | `{city}` | Hubli |
| {{3}} | business name | `{company_name}` | Ramesh Motors |

---

## CHANNEL 2 — Admin (one generic template)

#### `admin_alert` — Utility  — **exactly 2 params**
**Body:**
```
FortuneMarq OS — {{1}}. {{2}} (automated alert)
```
| Param | Meaning | Config field | Sample |
|---|---|---|---|
| {{1}} | headline | `headline` | New hot lead |
| {{2}} | detail (fold any link in here) | `detail` | Ramesh Motors, Hubli — score 92. https://fmos.fortunemarq.com/admin/leads/abc123 |

> **Integration note:** in the rule's `send_whatsapp` action use **`headline` + `detail` only** —
> do **not** set `link` (that would push a 3rd value and break the 2-param count). Put the URL at
> the end of `detail`. Covers A2–A11 in the plan.

---

## CHANNEL 3 — Staff (one generic template)

#### `staff_alert` — Utility  — **exactly 2 params**
**Body:**
```
FortuneMarq — {{1}}. {{2}} (open FMOS to action)
```
| Param | Meaning | Config field | Sample |
|---|---|---|---|
| {{1}} | headline | `headline` | Follow-up due |
| {{2}} | detail (fold any link in here) | `detail` | Ramesh Motors — call today. |

> Same note as `admin_alert`: `headline` + `detail` only, no `link`. Covers S1–S12.

---

## 4. Param formatting (token modifiers)

A `{field}` token sends the **raw row value**. To format dates and amounts, append a
**modifier** — `{field:mod}` — handled by `applyModifier` in `lib/whatsapp/params.ts`.
All dates render in **IST**. Fail-soft: null/undefined → "", and an invalid date /
non-numeric amount / unrecognized modifier → the raw value (never empty).

| Modifier | Example token | Renders |
|---|---|---|
| `date` | `{follow_up_date:date}` | Wed, 17 Jun |
| `datetime` | `{follow_up_date:datetime}` | Wed, 17 Jun, 4:00 pm |
| `time` | `{follow_up_date:time}` | 4:00 pm |
| `inr` | `{amount:inr}` | ₹25,000 (reuses `fmtINR`) |
| _(none)_ | `{contact_person}` | raw value (unchanged) |

So the date/amount templates wire cleanly now — e.g. `meeting_confirmation` param 2 =
`{follow_up_date:datetime}`, `invoice_sent` param 3 = `{amount:inr}`. Amounts that aren't on the
lead row can still be passed as a literal (e.g. `₹{amount}`) — the `:inr` modifier is for numeric
row values. This affects only how rules are configured — it does **not** change what you submit to
Meta. Submit all 24 as-is.

---

## 5. Submission order (fastest path to a working loop)

1. **Tier 1 (5)** + **`admin_alert`** + **`staff_alert`** — gets the core sales loop + internal
   alerts live the moment they're approved.
2. **Tier 2 (7)** — close + onboarding.
3. **Tier 3 (10)** — delivery + finance.

Nothing sends to a real lead until **both** its template is approved **and** a rule using it is
enabled in `/admin/automations` (Phase 3). So submitting early is risk-free.
