# FortuneMarq — Pending Actions
**Last Updated:** 2026-06-25
**Owner:** Jabeer  

> This is the master checklist of everything that still needs to be done, organised by priority.
> Update this file at the start and end of every session.
> When an action is complete, move it to the "Completed" section at the bottom with a date.

> ⚠️ **2026-06-24 status note:** Much of the list below predates the deploy + data load and is now done. As of today: **FMOS is deployed & live**, **WhatsApp Cloud API is live with all 33 system templates + the `direct_report_v3_*` family approved**, and Stages 1/3/4, the marketing site (5.1), **all 117 niche LPs (2.1)**, the AI bot (6.1), messaging safety/inbox (6.2–6.4), and the command center + safety nets (6.5/6.8/6.9) are built. **DATA IS FULLY LOADED:** all 9 cities, 13 niches, ~7,960 leads, 117 `market_insights`, **936 EN+KN reports** (built by the reportlab pipeline at `07_DATA_AND_RESEARCH/PDF_Generator`; the in-app `@react-pdf` generator is disabled behind `REPORTS_INAPP_GENERATOR`). Treat items about "deploy", "QA gate", "WhatsApp send UI", "templates pending", "load remaining leads", "run PDF pipeline", "niche landing pages", "command center/monitoring/backups" as **complete**. The live open items are: GMB/SEO/social presence, ad campaign launch + the Stage 2 campaign engine, GST settings activation, capacity guardrail (6.7), collection automation (1.1/1.2), pipeline orchestrator. **(BUILT 2026-06-25: 6.6 reactivation drip, 4.8 review/referral + auto-renewals, the Meta-CAPI/Google-OCI ad-conversion uploader [dormant until tokens] + opt-out fix; Meta Pixel + Google Calendar connected via the owner's Chrome. Owner launch tasks → `00_MASTER/LAUNCH_CHECKLIST.md`.)** Authoritative build state: `00_MASTER/FMOS_System_Design_And_Tasks.md`.

---

## 🔔 ACTIVATE AT AD LAUNCH — conversion tracking is BUILT but switched OFF (added 2026-06-25)

The offline-conversion uploader (Meta CAPI + Google OCI; `lib/ads/*`, cron `/api/cron/ad-conversions`, table `ad_conversions`) ships **dormant**. When we create the ad campaigns, switch it on. Until then leads still capture + tag normally — only the *upload back to the ad platforms* is inactive. **Full step-by-step:** `FMOS_Status_Report_2026-06-24.md` → "🔔 ACTIVATE AT AD LAUNCH".
- [ ] **Meta:** Events Manager → Pixel → Conversions API → generate token → set **`META_CAPI_TOKEN`** in Vercel; set **Lead** as the optimization conversion.
- [ ] **Google:** link GA4 ↔ Google Ads + mark **`generate_lead`** a conversion (no-code interim); later set `GOOGLE_ADS_*` env for offline import (dev-token needs approval — start early).
- [x] **Schedule:** ✅ DONE 2026-06-25 — `/api/cron/ad-conversions` is in the daily GitHub-Actions cron batch (no-ops until tokens set).

---

## 🟡 HIGH PRIORITY — Before FMOS Deployment

> 2026-06-12 status: DB fully synced (all migrations run), v4.8, build clean.
> **Deploy target changed: Vercel** (vercel.json with cron schedules already in repo).
> User accounts exist: sayedjabeer@, afifa@, admin1@, admin2@fmos.com — more can be
> added from /admin/team → Add Member (team management shipped 2026-06-12).

- [x] Push fmos to GitHub → import to Vercel. **DONE — deployed & live.**
- [x] Set Vercel env vars (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `INBOUND_WEBHOOK_SECRET`, etc.). **DONE.**
- [x] Point `fmos.fortunemarq.com` DNS to Vercel + Supabase auth redirect URLs. **DONE.**
- [x] Load all leads via `/admin/bulk-import`. **DONE — all 9 cities, ~7,960 leads.**
- [ ] Enter real client data into FMOS (Austin Dental Spa, OM SAI TRAVELS as initial test clients)
- [ ] Activate GST invoice settings — GSTIN: 29ICWPS9816Q1ZS
- [ ] Run smoke test across all FMOS modules post-deployment
- [ ] **Phase F Stage 1 (right after deploy)**: WhatsApp Cloud API webhook + Meta Lead Ads webhook + Google lead-form webhook → all inbound channels feed `/api/inbound/[channel]` automatically (plan: fmos/PHASE_F_INBOUND_MARKETING.md). Jabeer to provide: Meta BM access, WABA number decision (dedicated number recommended), Google Ads account ID, CPL targets per niche.

---

## 🟡 HIGH PRIORITY — Project Sections Not Yet Reviewed This Build

These folders/topics have not been opened in the current build phase. Each needs a session.

### 03_SALES_SYSTEM
- [x] WhatsApp API vs Business Account — DECIDED (updated 2026-06-12): official Meta WhatsApp Cloud API on a **NEW dedicated Jio number 79759 18980** (Option A — purchased & active). +91 93530 82656 stays in the WhatsApp Business app for manual chats. Never install WhatsApp on the new SIM. Cost: ~₹0.58/marketing conversation; 1,000 free service conversations/month.
- [~] **WhatsApp Cloud API Setup** (LIVE 2026-06-14 — number registered, BV approved, payment added, **first real message DELIVERED end-to-end** via Graph API to 93530 82656). Remaining: resubmit display name + finalise templates. Steps below:
  - ✅ 2026-06-14: Number REGISTERED · Business Verification APPROVED · India payment method ADDED to WABA FortuneMarq (1499408311884474) · live hello_world send DELIVERED (token+PHONE_NUMBER_ID 1084263481446667 proven).
  - ✅ RESOLVED (2026-06-16/22): display name approved; all 33 system templates + the `direct_report_v3_{a,b,c,d}` family approved & live; webhook callback URL set after the Vercel deploy. (Optional housekeeping: clean up stray Test WABA 1852036272835920 + duplicate "Fortunemarq" 705784465410369.)
  - Step 1: Create/verify Meta Business Manager account (fortunemarq@gmail.com, GSTIN ready) — ✅ DONE (BM portfolio 879084085296794)
  - Step 2: Link Facebook Business Page to Meta Business Manager
  - Step 3: Create Meta App (type: Business) at developers.facebook.com + add WhatsApp product
  - Step 4: Register 79759 18980 as the WABA number (SMS/call OTP to the new SIM)
  - Step 5: Permanent system-user token → fill `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `META_APP_SECRET` in FMOS `.env.local` (placeholders + real `WHATSAPP_VERIFY_TOKEN` already added 2026-06-12)
  - Step 6: Submit WhatsApp templates for Meta approval. ✅ **DONE** — 33 system templates + the `direct_report_v3_*` family (document + quick-reply buttons) approved & live.
  - Step 7 (after Vercel deploy): set webhook URL `https://<domain>/api/webhooks/whatsapp` in Meta App → WhatsApp → Configuration, subscribe to `messages`
- [ ] Review and finalise outreach sequence — curiosity step removed. New flow: Jabeer sends PDF report with buttons → lead taps or Afifa calls → outcome logged → follow-up automated. Confirm Afifa's workflow is mapped to FMOS steps.
- [ ] Test WhatsApp template picker end-to-end in FMOS (bug was fixed — verify it works across all template categories)

### FMOS Feature Requirements — WhatsApp Button Flow (build before deployment)
- [ ] **PDF document send via WhatsApp API** — when Jabeer sends a report, FMOS looks up `lead_type` + `niche` + `city`, finds the matching PDF in `07_DATA_AND_RESEARCH/PDF_Generator/output/{city}/`, uploads to Meta media endpoint, sends as `document` message type with body text and Quick Reply buttons. *(2026-06-12: `sendWhatsAppDocument` + `uploadWhatsAppMedia` ready in `lib/whatsapp/send.ts` — UI flow pending)*
- [x] **Webhook: handle interactive button replies** — DONE 2026-06-12. `app/api/webhooks/whatsapp/route.ts` handles `interactive.button_reply` AND template `button` type taps.
- [x] **Priority queue on button tap** — DONE 2026-06-12. Tags `report_engaged` + `tapped_book_meeting`/`tapped_tell_me_more`, bumps `follow_up_date` to now (top of queue), notifies assignee. Cockpit badge already existed.
- [x] **Auto-reply chain** — DONE 2026-06-12 (basic). Button tap sends mapped auto-reply from `lib/whatsapp/auto-replies.ts` (mirrors `curiosity_templates.json` autoReplies): "Book a meeting" → MEETING_REQUEST_REPLY + notify; "Tell me more" → TELL_ME_MORE_REPLY with buttons (landing-page link falls back to fortunemarq.com until niche LPs are live — set `WHATSAPP_LP_FALLBACK_URL` env to change); "Not right now" → NOT_RIGHT_NOW_REPLY + 3-day follow-up.
- [ ] **Meeting confirmation: Add to Calendar button** — OUTCOME_BOOK_MEETING template has a URL button that opens Google Calendar with meeting prefilled. FMOS generates `calendarStart` and `calendarEnd` from meetingDate + meetingTime in YYYYMMDDTHHmmssZ format
- [ ] **Date/time picker for FOLLOW_BACK and INTERESTED_FOLLOW_UP_LATER outcomes** — when Afifa logs either outcome, show picker before message sends: Today (custom time picker) / In 1 hour (auto) / Tomorrow (custom time picker). Selected values auto-fill `{{followUpDate}}` + `{{followUpTime}}` or `{{followBackDate}}` + `{{followBackTime}}`. Afifa sees message preview before confirming send
- [ ] **Two separate follow-back reminder templates** — FMOS must send the correct one based on which outcome originally triggered the follow-back: FOLLOWBACK_REMINDER_INTERESTED (for INTERESTED_FOLLOW_UP_LATER leads) vs FOLLOWBACK_REMINDER_BUSY (for FOLLOW_BACK leads). Cockpit should show Afifa which type of lead she is calling back
- [ ] **Proposal PDF send** — Jabeer clicks Generate Proposal or attaches external PDF → previews in FMOS → hits Send → FMOS sends as WhatsApp document + PROPOSAL_SENT message body. Two flows: FMOS-generated and external attachment
- [ ] **Agreement PDF send + webhook reply catch** — Jabeer generates agreement in FMOS → previews → sends as WhatsApp document + AGREEMENT_REQUEST message. FMOS webhook listens for lead's text reply containing "Yes, confirmed" and notifies Jabeer in cockpit
- [ ] **Invoice PDF send** — Jabeer generates invoice in FMOS → previews → sends as WhatsApp document + INVOICE_SENT message body
- [ ] **GATEKEEPER retry logic** — when Afifa logs GATEKEEPER: lead is not marked dead, FMOS reschedules it back into call queue at a different time slot (suggest early morning 9–10am or evening 5–7pm). Track gatekeeper attempt count per lead. After 3 gatekeeper attempts with no owner reached, flag lead for Jabeer to review
- [ ] **NO_ANSWER retry logic** — when Afifa logs NO_ANSWER: FMOS auto-schedules up to 3 retry attempts at staggered intervals (retry 1: same day later, retry 2: next day, retry 3: 2 days later). After 3 no-answers, lead is marked UNREACHABLE and removed from active queue. Show retry attempt number in Afifa's cockpit (e.g. "Attempt 2/3")
- [ ] **Follow-up queue outcome filters** — in Afifa's cockpit follow-up queue, add filter chips showing lead count per outcome bucket. Filters: All / Follow Back / Interested — Follow Up Later / No Answer (retries) / Gatekeeper (retries) / Report Engaged (tapped button — priority). Each chip shows the count (e.g. "Follow Back 12"). Selecting a filter shows only those leads. Default view shows all, sorted by scheduled callback time. Report Engaged leads always appear at the top regardless of filter

### 07_DATA_AND_RESEARCH
- [x] Finalise + load leads for ALL 9 cities. **DONE — ~7,960 leads across 13 niches in `leads`.**
- [x] Run the report pipeline for all cities. **DONE — 936 EN+KN reports (reportlab) live in Storage `market-reports` → `report_assets`.**
- [x] SERP / competitor analysis for all 9 cities. **DONE — 117 `market_insights` rows (9×13), 0 orphans.**

### 05_FORTUNEMARQ_ONLINE_PRESENCE
- [x] **fortunemarq.com rebuild** — rebuilt in-app on Next.js/Vercel (not Hostinger). **DONE: all pages live (home/about/services/work/contact/blog/privacy/terms) + GA4/Clarity/GSC/Meta Pixel connected.**
- [x] **Niche landing pages — DONE & deployed 2026-06-24:** all **13 niches × 9 cities = 117 LPs** live at `/lp/[niche]/[city]` from `market_insights` (EN+KN, demand + presence modes); lead capture (form/chat/WhatsApp) wired into FMOS tagged niche+city+source. *(Remaining: LP sitemap for SEO + ad conversion tracking at campaign launch.)*
- [ ] **GMB full optimization** — starts June 15: add all 7 services with descriptions, upload 15+ photos, write keyword-rich business description, set up 2x/week posting schedule, pre-populate Q&A with 5 common questions, request reviews from existing freelance clients
- [ ] **SEO** — starts June 15: keyword targeting for fortunemarq.com — "digital marketing agency Hubli" and niche searches
- [ ] **Social media content strategy** — complete content calendar for Instagram, Facebook, LinkedIn. Accounts created with few posts — need consistent 5x/week posting schedule
- [ ] **Google Ads account** — create account + build full campaign strategy before launching
- [ ] **Meta Ads account** — create account + build full campaign strategy before launching

### 06_PAID_MARKETING
- [ ] Build 13–14 niche+city landing pages (Hubli — needed before ads launch)
  - Each page: niche keyword data + competitor gap + FortuneMarq offer
  - outsourced freelancers to build once Antigravity team access is sorted
- [ ] Decide Antigravity team plan — outsourced freelancers need access to build

### 08_FINANCE + 09_LEGAL_AND_OPERATIONS
- [ ] **GST invoice activation post-deployment** — enter GSTIN 29ICWPS9816Q1ZS + bank details (Karnataka Bank, A/C 0332202500001101, IFSC KARB0000332) in FMOS `/admin/finance` settings. Enable 18% GST on all invoices. Test invoice PDF before first client.
- [ ] **Finance dashboard — Phase E** — MRR vs one-time revenue split, Revenue Forecast Widget (pipeline × close rate vs monthly target)
- [ ] Review payment and cancellation policy in FMOS for consistency with updated service_terms.json (non-refundable language removed)
- [ ] Privacy Policy for fortunemarq.com (not urgent — do before site gets significant traffic)

### 04_CLIENT_MANAGEMENT
- [ ] Upsell tracker + triggers — build after first 3 clients signed
- [ ] Health score system — activate at Month 2

### 10_PERSONAL_GROWTH
- [ ] Review and update Jabeer's learning plan (communication, AI, digital marketing)

---

## 🟢 TEAM & PEOPLE — Before Afifa Starts

- [ ] Finalise Afifa's start date
- [ ] Walk Afifa through FMOS — telecaller view, call queue, outcome logging, WhatsApp send, meeting booking
- [ ] WhatsApp API decision made and setup done (or confirmed to use Business Account manually)
- [ ] First call batch queued in FMOS for Afifa (Healthcare niche — Hubli leads uploaded)

---

## 🔵 ROADMAP — Phase 2 (After First Clients Signed)

These are sequenced for later. Do not start until triggers are met.

- [ ] **Personal brand / Jabeer's content** — starts after: FMOS live + niche landing pages deployed + performance marketing set up. Not undecided — intentionally sequenced.
- [ ] **Social Media Management as a service** — decide after 3 months, once core services stable
- [ ] **Performance-based pricing / guarantees** — decide after 3 months with real results data
- [ ] **Price increases for new clients** — after 3 months + strong case studies
- [ ] **LinkedIn strategy for Jabeer** — Month 2 priority
- [ ] **SaaS product (Admissions CRM)** — 2-year vision, after ₹2L MRR

---

## ✅ COMPLETED (move items here when done, with date)

| Date | Action |
|------|--------|
| 2026-03-19 | Hubli lead pipeline + 75 PDFs generated |
| 2026-03-19 | All niche keyword volumes updated with real GKP data |
| 2026-03-19 | Telecaller scripts (Kanglish + Kannada) for all Hubli niches |
| 2026-04-01 | WhatsApp templates (17 templates, 5 categories) — JSON + TS loader |
| 2026-04-01 | Proposal + agreement data system — JSON schema + TS loader |
| 2026-04-02 | Agreement template + service_terms.json + payment policy |
| 2026-04-02 | Onboarding checklists (all 7 services) + onboarding SOP |
| 2026-06-08 | Pricing updated across all files (GMB ₹3,500, Website ₹8K–₹15K, ads 5% variable fee) |
| 2026-06-08 | "Non-refundable" language removed from all payment/policy docs |
| 2026-06-08 | FortuneMarq_Vision_And_Positioning.md created |
| 2026-06-08 | Niche attack order locked: Healthcare → Real Estate → Car Rental → Fitness → Education → Remaining |
| 2026-06-08 | FMOS WhatsApp templates bug fixed (RLS policy + lead_type filter) |
| 2026-06-08 | FMOS /telecaller redirect to /sales fixed |
| 2026-06-08 | Personal brand decision: sequenced to Phase 2, not undecided |
| 2026-06-08 | Add SUPABASE_SERVICE_ROLE_KEY to .env.local |
| 2026-06-08 | Run SQL: ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_link TEXT |
| 2026-06-08 | Run SQL: ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_notes TEXT |
| 2026-06-11 | FMOS v4.7 — security hardening + full UI/UX overhaul + PDF print system |
| 2026-06-12 | **ALL Supabase migrations executed** (38 missing tables created — attendance, notifications, automations, marketing, duplicates, sessions) |
| 2026-06-12 | Create user accounts in FMOS (4 live) + full team management UI (invite/role/password/deactivate/remove) |
| 2026-06-12 | Notifications system live + daily-digest cron (meetings, follow-ups, overdue invoices, at-risk clients) |
| 2026-06-12 | Invoice partial payments (record payment → partially_paid/paid) |
| 2026-06-12 | GATEKEEPER + NO_ANSWER retry logic confirmed live in cockpit (3-attempt staggered retries, unreachable/flagged stages) |
| 2026-06-12 | Phase F Stage 0: inbound capture pipeline + webhook + UTM attribution + round-robin auto-assign + Inbound & Funnel marketing tab + spend CSV import |
| 2026-06-17 | FMOS deployed & live on Vercel (fmos.fortunemarq.com); WhatsApp Cloud API live; Stage 4 delivery (4.1–4.7) + AI bot (6.1) + messaging safety/inbox (6.2–6.4) built |
| 2026-06-21 | **All 9 cities loaded** — ~7,960 leads across 13 niches; competitor SERP analysis → 117 `market_insights` rows (9×13), 0 orphans |
| 2026-06-22 | **Market-intel reports rebuilt** — 936 EN+KN PDFs in the 5-page editorial design via the reportlab pipeline (`07.../PDF_Generator` + `kn_shape.py`) → Storage `market-reports` → `report_assets`; in-app `@react-pdf` generator disabled behind `REPORTS_INAPP_GENERATOR` |
| 2026-06-22 | **Direct Report v3** — `direct_report_v3_{a,b,c,d}` text template + 3 buttons (Book a meeting / Tell me more / ಕನ್ನಡ ವರದಿ) → matched PDF follow-up; Kannada button sends only the KN PDF |

---

*FortuneMarq Media & Marketing — fmos.fortunemarq.com — fortunemarq@gmail.com*
