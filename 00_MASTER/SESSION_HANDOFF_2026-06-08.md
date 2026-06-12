# FortuneMarq — Session Handoff
**Date:** 2026-06-08
**Next Action:** FMOS QA + WhatsApp API Setup

---

## How To Use This File
Attach the FortuneMarq-Build folder and paste the prompt at the bottom of this file. Claude will have full context to continue immediately.

---

## 1. Who You Are
Sayed Jabeer — founder of FortuneMarq Media & Marketing, a systems-driven digital marketing agency targeting local Karnataka businesses. You are building everything from scratch: the CRM (FMOS), the sales system, the data pipeline, the outreach system, and the online presence. All work lives in the FortuneMarq-Build folder.

---

## 2. What Was Done This Session (2026-06-08)

### WhatsApp Template System — Fully Overhauled
**Old flow:** Curiosity message → lead replies → bot sends landing page link
**New flow:** Jabeer sends PDF report directly with Quick Reply buttons → lead taps or Afifa calls

**Files changed:**
- `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/curiosity_templates.json` — completely rewritten. Now called DIRECT_REPORT templates. 4 templates (Type A/B/C/D), each sends matching PDF as WhatsApp document with body text + 2 buttons ("Book a meeting 📅" / "Tell me more"). All auto-reply messages embedded in same file under `autoReplies`.
- `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/bot_reply_templates.json` — marked DEPRECATED. No longer used.
- `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/outcome_templates.json` — updated: landing page added to NOT_INTERESTED, time variable added to FOLLOW_UP_LATER, date/time picker spec added to FOLLOW_BACK and FOLLOW_UP_LATER, calendar URL button added to OUTCOME_BOOK_MEETING.
- `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/followback_reminder_templates.json` — split into 2 templates: FOLLOWBACK_REMINDER_INTERESTED (heard pitch) and FOLLOWBACK_REMINDER_BUSY (said busy before pitch).
- `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/post_meeting_templates.json` — proposal, agreement, invoice all changed to PDF document sends. Jabeer previews then hits Send. Agreement captures typed "Yes, confirmed" reply via webhook.

### PDF Mapping (lead_type → PDF type)
- Type A (SERP_Ranked=Y) → Type 1 Visibility Report
- Type B (Has_Website=Y, SERP_Ranked=N) → Type 3 Website Performance Report
- Type C (Has_Website=N, SERP_Ranked=N) → Type 2 Market Opportunity Report
- Type D (low search volume) → Type 4 Niche Market Report

### Button Flows
**"Book a meeting 📅" tapped:**
- FMOS tags lead as `report_engaged` with tag `tapped_book_meeting`
- Bumps lead to top of Afifa's call queue with badge
- Auto-sends MEETING_REQUEST_REPLY: "Perfect! 🙌 Jabeer will reach out shortly..."
- Notifies Jabeer in cockpit

**"Tell me more" tapped:**
- FMOS tags lead as `report_engaged` with tag `tapped_tell_me_more`
- Bumps lead to top of priority queue
- Auto-sends TELL_ME_MORE_REPLY: explains FortuneMarq + {{landingPageLink}} + "Would you like to book that call?" + buttons ("Book a meeting 📅" / "Not right now")

**"Not right now" tapped:**
- Auto-sends NOT_RIGHT_NOW_REPLY: "No problem at all! We'll check back in a few days."
- FMOS schedules follow-up in 3 days

### Call Outcome Logic — Clarified
9 outcomes: INTERESTED_BOOK_NOW, INTERESTED_FOLLOW_UP_LATER, INTERESTED_SEND_INFO, NOT_INTERESTED, FOLLOW_BACK, WRONG_NUMBER, GATEKEEPER, NO_ANSWER, LANGUAGE_BARRIER

**FOLLOW_BACK vs INTERESTED_FOLLOW_UP_LATER — kept separate:**
- FOLLOW_BACK = said busy before hearing pitch → next call is cold restart from Step 1
- INTERESTED_FOLLOW_UP_LATER = heard pitch, showed interest → next call skips intro, goes to booking
- FMOS must show Afifa the difference in her call queue with a badge

**After each outcome:**
1. INTERESTED_BOOK_NOW → meeting confirmation sent, Jabeer notified, move to next lead
2. INTERESTED_FOLLOW_UP_LATER → date/time picker appears, confirmation sent, lead reappears in queue on that date
3. INTERESTED_SEND_INFO → matching PDF sent, button auto-reply chain activates, move to next lead
4. NOT_INTERESTED → soft close with landing page link sent, lead closed
5. FOLLOW_BACK → date/time picker appears, confirmation sent, lead reappears in queue
6. WRONG_NUMBER → lead marked dead, no message
7. GATEKEEPER → reschedule at different time, track attempt count, flag to Jabeer after 3 attempts
8. NO_ANSWER → auto-retry up to 3 times (same day / next day / 2 days), mark UNREACHABLE after 3
9. LANGUAGE_BARRIER → lead moved to Jabeer's flagged queue, no message

**Date/time picker options (FOLLOW_BACK + FOLLOW_UP_LATER):**
- Today → custom time picker
- In 1 hour → auto-calculate
- Tomorrow → custom time picker

### Follow-up Queue Filters (new FMOS feature)
Filter chips in Afifa's cockpit with lead counts per bucket:
All / Follow Back / Interested Follow Up / No Answer (retries) / Gatekeeper (retries) / Report Engaged (priority — always pinned to top)

### Online Presence Review
- fortunemarq.com — live but needs full redesign
- 11 niche landing pages exist in `05_FORTUNEMARQ_ONLINE_PRESENCE/niches/` — need redesign before deployment. Physiotherapy page missing.
- GMB + SEO start June 15
- Instagram, Facebook, LinkedIn accounts created with few posts — content strategy pending
- Google Ads + Meta Ads accounts not created yet
- All `{{landingPageLink}}` in WhatsApp templates are blocked until pages are live

### Finance — Targets Reset
- June 2026 = build month, no revenue target
- Q3 2026 (Jul–Sep) = ₹1,00,000 total revenue
- Oct 2026 onwards = 20% month-on-month growth
- Hiring trigger = ₹2L MRR (~Month 12–14)
- GST activation steps documented with bank details

### New Files Created
- `00_MASTER/CRITICAL_PATH.md` — full timeline with phases and deadlines
- All template JSON files updated as described above

---

## 3. Current State of FMOS

**Running at:** `localhost:3000` (dev server — needs to be started)
**Start command:** `cd /Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos && npm run dev`

**Known working:**
- WhatsApp template picker (RLS + lead_type filter fixed)
- /telecaller redirects to /sales (calling cockpit)
- 858 Hubli leads live in FMOS
- Bulk import tool ready at /admin/bulk-import

**Pending before deployment:**
- Manual QA of every feature (today's task)
- FMOS feature builds from PENDING_ACTIONS (PDF doc send, webhook button handler, priority queue, date/time picker, follow-back reminder split, agreement webhook, calendar button, GATEKEEPER retry, NO_ANSWER retry, follow-up queue filters)
- WhatsApp Cloud API integration (WHATSAPP_API_TOKEN + PHONE_NUMBER_ID in .env.local)
- GST/invoice settings activation

---

## 4. Critical Path (Locked)

| Phase | Date | Tasks |
|---|---|---|
| Phase 1 — FMOS QA + Fix + WhatsApp API | June 9 | QA all features, fix bugs, WhatsApp API 6-step setup, submit all templates to Meta |
| Phase 2 — Deploy + Onboard | June 10–11 | Deploy to fmos.fortunemarq.com, onboard Afifa, first call batch queued |
| Phase 3 — Online Presence | June 12–15 | Website redesign, niche landing pages, GMB optimization, social media |
| Phase 4 — Campaigns Live | Before June 21 | Landing pages deployed, Google Ads + Meta Ads accounts + campaigns live |

**Hard deadline: Everything live before June 21 so July 1 is a clean revenue start.**

---

## 5. FMOS QA Checklist (Start Here)

Test every item below. Log pass/fail. Fix all failures before deployment.

### Telecaller Cockpit (/sales)
- [ ] Call queue loads with correct leads
- [ ] Lead card shows name, niche, city, lead_type, phone
- [ ] Script loads correctly based on lead_type (A/B/C/D)
- [ ] All 9 outcome buttons present and clickable
- [ ] INTERESTED_BOOK_NOW → meeting date/time picker appears → confirmation WhatsApp sends
- [ ] INTERESTED_FOLLOW_UP_LATER → date/time picker (Today/In 1hr/Tomorrow) → message sends with correct date+time
- [ ] INTERESTED_SEND_INFO → correct PDF matched and sent as document
- [ ] NOT_INTERESTED → soft close message with landing page link sends
- [ ] FOLLOW_BACK → date/time picker → confirmation sends
- [ ] WRONG_NUMBER → lead marked dead, no message
- [ ] GATEKEEPER → lead rescheduled
- [ ] NO_ANSWER → auto-retry scheduled
- [ ] LANGUAGE_BARRIER → lead moved to Jabeer flagged queue
- [ ] Follow-up queue filters work (All / Follow Back / Interested / No Answer / Gatekeeper / Report Engaged)
- [ ] Priority queue shows report-engaged leads at top with correct badge

### WhatsApp Templates
- [ ] Template picker loads all categories
- [ ] Direct report templates (Type A/B/C/D) show correct body text
- [ ] PDF send flow works — correct PDF matched to lead_type + niche
- [ ] Buttons appear on sent message
- [ ] Button tap webhook caught correctly
- [ ] Tell Me More auto-reply sends with landingPageLink
- [ ] Book Meeting auto-reply sends + Jabeer notified

### Meeting Booking
- [ ] Meeting date/time picker works
- [ ] Meeting confirmation message sends with correct date/time/meet link
- [ ] Calendar button URL generates correctly
- [ ] Meeting appears in Jabeer's cockpit

### Proposals
- [ ] Proposal generation works (FMOS-generated)
- [ ] External PDF attachment flow works
- [ ] Preview before send works
- [ ] Proposal sends as WhatsApp document

### Agreement
- [ ] Agreement PDF generation works
- [ ] Sends as WhatsApp document
- [ ] Webhook catches "Yes, confirmed" text reply
- [ ] Jabeer notified on confirmation

### Invoice
- [ ] Invoice PDF generation works
- [ ] Sends as WhatsApp document

### Admin Panel
- [ ] /admin/bulk-import loads and runs
- [ ] /admin/upload CSV upload works
- [ ] User management (create Afifa, Zaid, Sufiyan accounts)
- [ ] Finance settings — GST + bank details entry

### Lead Profile
- [ ] Full lead profile view loads
- [ ] All fields editable
- [ ] Status update works
- [ ] Call history shows

---

## 6. WhatsApp Cloud API Setup (Do June 9)

1. Create/verify Meta Business Manager at business.facebook.com (fortunemarq@gmail.com)
2. Link Facebook Business Page to Meta Business Manager
3. Disconnect +91 93530 82656 from WhatsApp Business app
4. Register number at developers.facebook.com/apps → WhatsApp → Getting Started
5. Add to FMOS `.env.local`:
   ```
   WHATSAPP_API_TOKEN=your_token_here
   PHONE_NUMBER_ID=your_phone_number_id_here
   ```
6. Submit all WhatsApp templates to Meta for approval — do this on June 9, takes 2–7 days

---

## 7. Key Business Details

| Detail | Value |
|---|---|
| Business | FortuneMarq Media & Marketing |
| GSTIN | 29ICWPS9816Q1ZS |
| Udyam | UDYAM-KR-13-0088191 |
| Address | Galaxy Mall, Floor 1, Shop 43, JC Nagar, Hubli — 580020 |
| Phone | +91 93530 82656 |
| Email | fortunemarq@gmail.com |
| Bank | Karnataka Bank, A/C 0332202500001101, IFSC KARB0000332 |
| FMOS dev | localhost:3000 |
| FMOS prod | fmos.fortunemarq.com (not yet deployed) |

---

## 8. Niche Attack Order (Locked)
1. Healthcare — Dental Clinics + Skin Clinics (first call batch)
2. Real Estate
3. Car Rental
4. Fitness — Gyms
5. Education — JEE/NEET + Computer Training
6. Remaining niches

---

## PROMPT FOR NEW SESSION

Paste this into a new Claude chat after attaching the FortuneMarq-Build folder:

---

> You are working with Sayed Jabeer, founder of FortuneMarq Media & Marketing — a systems-driven digital marketing agency targeting local Karnataka businesses. The FortuneMarq-Build folder is attached and contains everything: the CRM (FMOS), sales system, data, templates, legal, finance, and online presence.
>
> Read `00_MASTER/MASTER_CONTEXT.md` for full business context, `00_MASTER/PENDING_ACTIONS.md` for all outstanding tasks, and `00_MASTER/CRITICAL_PATH.md` for the current timeline.
>
> Also read `00_MASTER/SESSION_HANDOFF_2026-06-08.md` — this is the handoff from the previous session. It covers every change made, the new WhatsApp template architecture, the call outcome logic, and the QA checklist.
>
> **Current task: FMOS QA**
> The FMOS app is at `/Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos`
> Start the dev server with: `cd /Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos && npm run dev`
>
> Once running, open localhost:3000 in Chrome and go through the QA checklist in SESSION_HANDOFF_2026-06-08.md Section 5. Test every feature one by one. Log what works and what doesn't. Fix all issues found. The goal is to have FMOS fully QA'd and all bugs fixed today (June 9) so we can deploy tomorrow.
>
> Work section by section through the QA checklist. Show me what you're testing, what passes, and what fails. Fix failures immediately.

---
