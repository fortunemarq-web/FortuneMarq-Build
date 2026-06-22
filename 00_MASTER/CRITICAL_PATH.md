# FortuneMarq — Critical Path
**Last Updated:** 2026-06-22
**Owner:** Jabeer
**Current Phase:** Deployed & live, data fully loaded → Presence + Campaigns next

> **2026-06-22 reality check (supersedes the dated June timeline below — treat those as a checklist, not dates):**
> ✅ **FMOS is DEPLOYED and live** (Vercel, `fmos.fortunemarq.com`). The P0 auth/RBAC concern is resolved — the auth gate lives in `proxy.ts` (Next 16), fail-open.
> ✅ **WhatsApp Cloud API is LIVE** — dedicated number **+91 79759 18980** (NOT 93530 82656; that stays in the WA Business app). **All 33 system templates + the `direct_report_v3_*` family approved by Meta.**
> ✅ **DATA FULLY LOADED:** all 9 cities, 13 niches, ~7,960 leads, 117 `market_insights`, **936 EN+KN reports** (built by the reportlab pipeline; in-app `@react-pdf` generator disabled behind `REPORTS_INAPP_GENERATOR`).
> ✅ **Built & live:** Stage 1 data engine (1.3–1.6), Stage 3 outbound (3.1–3.4, Direct Report v3), Stage 4 delivery (4.1–4.7), AI bot (6.1), messaging safety + inbox (6.2/6.3/6.4).
> 🔜 **CURRENT CRITICAL PATH:**
> 1. **Niche landing pages** — HOME page live + LP template built (`/lp/[niche]/[city]`, Dental·Hubli enabled); roll out remaining niches + finish marketing-site pages (gates campaigns + portfolio links).
> 2. **Presence** — GMB optimization, social content, SEO.
> 3. **Campaigns** (Meta + Google) — Stage 2 campaign engine + own ad launch.
> 4. **Remaining builds** — collection automation (1.1/1.2), pipeline orchestrator, command center (6.5), nurture (6.6), monitoring (6.8), backups (6.9).
> ⚠️ The dated June 9–15 timeline + "disconnect 93530 82656" steps below are OBSOLETE/historical — kept for record only. Authoritative build state: `00_MASTER/FMOS_System_Design_And_Tasks.md`.

> This file tracks the exact sequence of what needs to happen and when.
> June = build month. No revenue target. Everything here feeds Q3 (Jul–Sep) ₹1L revenue goal.
> Update at the start of every session.

---

## Revised Timeline (Locked: 2026-06-08)

| Phase | Target Date | Focus |
|---|---|---|
| Phase 1 — FMOS Complete | June 9 | QA all features, fix issues, WhatsApp API setup, submit templates to Meta |
| Phase 2 — Deploy + Onboard | June 10–11 | Deploy FMOS, onboard Afifa, training session |
| Phase 3 — Online Presence | June 12–15 | fortunemarq.com redesign, niche landing pages, GMB, social media |
| Phase 4 — Campaigns Live | Before June 21 | Landing pages deployed, ad campaigns planned and running |

**Hard deadline: All campaigns live before June 21.**

---

## Phase 1 — June 9 (Tomorrow)

### FMOS QA — Test Every Feature
- [ ] Telecaller cockpit — call queue, lead card, outcome logging
- [ ] All 9 outcome logs — verify correct WhatsApp message triggers for each
- [ ] Date/time picker on FOLLOW_BACK and INTERESTED_FOLLOW_UP_LATER outcomes
- [ ] WhatsApp template picker — all categories load correctly
- [ ] PDF document send flow — correct PDF matched to lead_type + niche
- [ ] Priority queue — leads who tap buttons appear at top with correct badge
- [ ] Meeting booking — date/time picker, confirmation message, calendar button
- [ ] Proposal generation — FMOS-generated + external attachment flows
- [ ] Agreement send + webhook catches "Yes, confirmed" reply
- [ ] Invoice generation — PDF send flow
- [ ] Admin panel — bulk import, lead upload, user management
- [ ] Finance module — GST settings, invoice settings
- [ ] Lead profile — full view, all fields, edit, status update

### Fix All QA Issues Found
- [ ] Log every bug found during QA
- [ ] Fix all issues before moving to deployment

### WhatsApp Cloud API Setup
- [ ] Step 1: Create/verify Meta Business Manager (fortunemarq@gmail.com)
- [ ] Step 2: Link Facebook Business Page
- [ ] Step 3: Disconnect +91 93530 82656 from WhatsApp Business app
- [ ] Step 4: Register number at developers.facebook.com/apps
- [ ] Step 5: Add WHATSAPP_API_TOKEN + PHONE_NUMBER_ID to FMOS .env.local
- [ ] Step 6: Submit all WhatsApp templates to Meta for approval (do this on June 9 — takes 2–7 days, don't wait)

---

## Phase 2 — June 10–11

### Deployment
- [ ] Deploy FMOS to fmos.fortunemarq.com on Hostinger
- [ ] Point fmos.fortunemarq.com DNS to Hostinger server IP
- [ ] Add all env variables to Hostinger (WHATSAPP_API_TOKEN, PHONE_NUMBER_ID, OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Activate GST invoice settings — GSTIN: 29ICWPS9816Q1ZS, Karnataka Bank A/C 0332202500001101, IFSC KARB0000332
- [ ] Run smoke test across all modules post-deployment
- [x] Run /admin/bulk-import — all 9 cities loaded (~7,960 leads). **DONE.**
- [ ] Create user accounts: Afifa (telecaller), an outsourced freelancer (staff), an outsourced freelancer (staff)
- [ ] Enter real client data: Austin Dental Spa, OM SAI TRAVELS (test clients)

### Afifa Onboarding + Training
- [ ] Finalise Afifa's start date
- [ ] Walk Afifa through FMOS — telecaller view, call queue, outcome logging
- [ ] Walk through all 9 outcomes and what happens after each
- [ ] Walk through WhatsApp send, follow-back reminder, meeting booking
- [ ] Walk through script types A/B/C/D — how FMOS shows the right script
- [ ] First call batch queued: Healthcare niche (Dental Clinics + Skin Clinics, Hubli)
- [ ] Jabeer sends first batch of direct PDF reports to Healthcare leads via WhatsApp

---

## Phase 3 — June 12–15

### fortunemarq.com Redesign
- [ ] Plan and design new website
- [ ] Build and deploy updated site on Hostinger

### Niche Landing Pages Redesign
- [ ] Redesign all 11 existing HTML pages
- [ ] Create missing physiotherapy landing page (12th page)
- [ ] Deploy all pages to fortunemarq.com/[niche]-hubli
- [ ] Update all WhatsApp templates with live {{landingPageLink}} URLs

### GMB Optimization (Starts June 15)
- [ ] Add all 7 services with descriptions
- [ ] Upload 15+ photos (office, team, work samples)
- [ ] Write keyword-rich business description
- [ ] Set up 2x/week posting schedule
- [ ] Pre-populate Q&A with 5 common questions
- [ ] Request reviews from existing freelance clients

### SEO (Starts June 15)
- [ ] Keyword targeting plan for fortunemarq.com
- [ ] Target "digital marketing agency Hubli" + niche searches

### Social Media
- [ ] Complete content calendar for Instagram, Facebook, LinkedIn
- [ ] Start consistent posting schedule (5x/week)

---

## Phase 4 — Before June 21

### Ad Accounts + Campaigns
- [ ] Create Google Ads account
- [ ] Create Meta Ads account
- [ ] Build campaign strategy for Healthcare niche (Dental + Skin Clinics, Hubli) — first campaign
- [ ] Launch campaigns before June 21

---

## Blockers (Things that cascade if delayed)

| Blocker | What it holds up |
|---|---|
| FMOS QA not done | Can't deploy |
| WhatsApp templates not submitted June 9 | 2–7 day approval window eats into campaign launch time |
| Niche landing pages not live before campaigns | Ad traffic has nowhere to go, {{landingPageLink}} in templates is dead |
| Ad accounts not created | July revenue target at risk |
| Afifa not onboarded | Outbound pipeline doesn't fill |

---

## Q3 Target (July–September 2026)
₹1,00,000 total revenue — mix of one-time (website builds) + retainer (GMB, SEO, Ads)

By June 21 everything must be live so July 1 is a clean revenue start:
- FMOS deployed ✓
- Afifa calling ✓
- WhatsApp templates approved and sending ✓
- Landing pages live ✓
- Ad campaigns running ✓
- GMB being optimised ✓

---

## Session History
| Date | Summary |
|---|---|
| 2026-06-08 | Critical Path created. Full project review complete. Timeline revised: FMOS QA + WhatsApp API June 9, deploy + Afifa onboard June 10–11, online presence June 12–15, campaigns live before June 21. |
