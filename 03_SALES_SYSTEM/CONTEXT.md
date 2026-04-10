# 03 — Sales System
**Last Updated:** April 2026 | **Status:** L2 + L3 + L4a + L4b all COMPLETE. Ready for FMOS feature build.

## Purpose
Plan and create everything related to acquiring clients — telecaller scripts, WhatsApp templates, proposals, agreements, and the outreach sequence. This folder is the content layer for the sales function. The execution happens in FMOS (01_CRM_AND_TOOL). The content lives here.

## The Sales Flow
Curiosity WhatsApp mass send → Paid campaign runs simultaneously → Replied leads tagged as priority → Inbound leads from ads → Cold call queue → 3-touch outreach → meeting booked with Jabeer → Jabeer closes → proposal sent → agreement confirmation (WhatsApp/email) → invoice → work starts

## Lead Priority in FMOS Queue
1. Replied to WhatsApp curiosity message (highest priority)
2. Inbound from paid ads (landing page form fills)
3. Cold leads from CSV (standard queue)

## The 3-Touch Sequence
- Touch 1: WhatsApp curiosity message (mass send before calls begin)
- Touch 2: PDF report delivered (type-matched to lead's online presence situation)
- Touch 3: Follow-up call — goal is booking 30–45 min Google Meet with Jabeer

## Content Build Status (this folder owns L2, L3, L4a)
- L0 Niche Data Reference Sheet — COMPLETE (in 07_DATA_AND_RESEARCH)
- L1 Lead CSV + PDF Index — COMPLETE (in 07_DATA_AND_RESEARCH)
- L2 Telecaller Scripts — COMPLETE — New architecture: 4 type-based English scripts + JSON data files for FMOS
- L3 WhatsApp Templates — COMPLETE — 17 templates across 5 files in FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic PDF generated from FMOS. Schema, services data, TypeScript types + loader in FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — Simple 1-page doc sent via WhatsApp/email. Client confirms by reply. Linked to proposal by reference number.

## Script Architecture — NEW (April 2026)
Scripts are no longer generic per-niche. FMOS auto-detects lead type from CSV columns and loads the matching script.

### Lead Type Detection Logic
| Type | Condition | Situation | PDF Referenced |
|---|---|---|---|
| A | SERP_Ranked = Y | Already ranking on Google | Type 1 — Visibility Report |
| B | Has_Website = Y, SERP_Ranked = N | Has website, not ranking | Type 3 — Website Performance |
| C | Has_Website = N, SERP_Ranked = N | No website, GMB only | Type 2 — Market Opportunity |
| D | Low search volume niche/city | Limited direct search demand | Type 4 — Niche Market Report |

### Script Structure (all types)
1. **Introduction** — Name, company, "online growth system building agency, based in [City]"
2. **Opening Hook** — "We conducted market research for [niche] in [city], found interesting data on how many people are searching for your service. Do you have a minute?"
3. **Data Hook** — Type-specific: monthly search volume + what it means for their situation
4. **FOMO Point** — Type-specific: opportunity exists NOW before competitors get strong. Anchored in: today people search online first, online presence = trust.
5. **Differentiator** — Short: "Not just ads. We build a complete online growth system — presence, visibility, leads — all connected, built for you."
6. **Meeting Ask** — Book 30–45 min Google Meet with Jabeer (founder). Presentation built for their business. Valuable even if they don't sign. No pressure, no commitment.

### Objections Bank (attached to steps)
- After Step 2: Busy, Not interested, Who are you
- After Step 3: Numbers not real, Already enough customers, (Type C: Word of mouth)
- After Step 6: Cost, Tried before, Owner not here, Send WhatsApp, I'll think, Handle internally

### Call Outcomes
- INTERESTED → Book Now / Follow Up Later / Send More Info
- NOT INTERESTED → Reason required (6 options) → Mark Cold or Dead
- FOLLOW BACK → Date + time + note → auto-reminder
- WRONG NUMBER / DEAD → Mark dead → cleanup queue

### Script Files for Code
Location: `Telecaller_Scripts/FMOS_Script_Data/`
- `script_type_A.json` — Already ranking
- `script_type_B.json` — Has website, not ranking
- `script_type_C.json` — No website, GMB only
- `script_type_D.json` — Low search volume
- `script.types.ts` — TypeScript interfaces
- `index.ts` — Script loader utility (getScriptForLead function)

## Key Data (from L0 — all 6 niches)
- Gyms: 63,950/month — no competitor runs ads
- Skin Clinics: 41,850/month — 99% traffic gap
- Computer Training: 24,350/month — top player gets only 600/24,350
- Dental: 21,100/month — one moderate competitor
- Car Rentals: 16,450/month — zero paid ads in market
- JEE/NEET: 12,300/month — online platforms stealing students

## Key Sales Principle
The PDF does the selling. The telecaller books the meeting. Jabeer closes. Directories (JustDial, Sulekha) take 70% of search traffic — FortuneMarq bypasses directories with ads and SEO so clients get direct calls.

## Connections to Other Folders
- **Feeds FROM:** 07_DATA_AND_RESEARCH (niche data, lead lists, PDFs)
- **Feeds INTO:** 01_CRM_AND_TOOL (pipeline, meeting bookings, proposals)
- **Depends ON:** L0 complete before L2. L2 complete before L3. L3 complete before L4.

## Telecaller (Afifa) Details
- Hours: 11am–5pm
- Daily target: 50–80 calls
- Meeting target: 5–8 per week
- Works from CRM — all outcomes logged in FMOS

## Closing Rate Target
- 100 calls → 5–10 meetings booked
- 10 meetings → 2–3 clients closed

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. L0 complete. L1 in progress. L2–L4 pending. |
| 2026-03-19 | All niche volumes updated from FortuneMarq_Master_Keyword_Research.xlsx. Replaced estimated numbers with real Google Keyword Planner data across all context files and data_loader.py. PDFs already generated with correct data — no regeneration needed. |
| 2026-04-01 | Proposal (L4a) + Agreement (L4b) complete. Proposal: 5-6 pages, FMOS-generated PDF, Jabeer selects services and enters pricing manually, client data and market opportunity auto-filled from lead profile, type-specific content (A/B/C/D), services framed as complete online growth system (Foundation → Visibility → Engagement). Services: Website, GMB, SEO, Google Ads, Meta Ads, WhatsApp Marketing, AI Automations. Agreement: simple 1-page doc, sent via WhatsApp/email, client confirms by reply. Files in FMOS_Proposal_Data/. Closing sequence: Proposal → Agreement → Invoice → Onboarding. |
| 2026-04-01 | WhatsApp Templates (L3) complete. 17 templates across 5 categories: Curiosity (4 — Type A/B/C/D, Jabeer manual batch), Bot Reply (4 — landing page link sent when lead replies, bot auto), Outcome Triggered (6 — auto-sent when Afifa logs outcome in FMOS), Follow-Back Reminder (1 — Afifa FMOS button, day-of reminder), Post Meeting (4 — Proposal Sent, Proposal Follow-up, Agreement Request, Invoice Sent, Jabeer manual). Meta WhatsApp API to be purchased and connected to FMOS. Bot reply uses session window (no Meta approval needed). All others need Meta template approval. TypeScript types + loader created in FMOS_Template_Data/. Landing pages per niche required before bot goes live. |
| 2026-04-01 | Full script architecture redesign. 4 type-based variants replacing old generic per-niche scripts. Language: English. 6-step structure: Introduction, Opening Hook (market research angle), Data Hook (type-specific volumes), FOMO Point (type-specific), Differentiator (short — full online growth system, not just ads), Meeting Ask (Jabeer, founder, 30-45min, presentation, valuable even without signing). Objections bank mapped per step. 4 call outcomes with sub-options. JSON data files + TypeScript types created in FMOS_Script_Data/ for direct FMOS code use. |
---

## FortuneMarq System DNA
> This section is present in every context file. It ensures every Claude session — regardless of folder — understands the full interconnected system.

### Business
- **Legal Name:** FortuneMarq Media & Marketing
- **Brand:** FortuneMarq | **Tagline:** Marketing That Pays You Back
- **Address:** Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020
- **CRM/OS:** fmos.fortunemarq.com | **Website:** fortunemarq.com
- **Contact:** fortunemarq@gmail.com | +91 93530 82656

### Team
| Person | Role | Status |
|---|---|---|
| Jabeer | Founder — strategy, sales, closing, all tech | Active |
| Afifa | Telecaller — calls, outcomes, PDF delivery, meeting booking | Hired, not started |
| Zaid | Website builder — Antigravity builds, task execution | Training |
| Sufiyan | Website builder — Antigravity builds, task execution | Training |

### The Full System Map
```
07_DATA_AND_RESEARCH
  → feeds → 06_PAID_MARKETING + 03_SALES_SYSTEM
06_PAID_MARKETING
  → feeds → 01_CRM_AND_TOOL (inbound leads)
03_SALES_SYSTEM
  → feeds → 01_CRM_AND_TOOL (pipeline) + 04_CLIENT_MANAGEMENT
01_CRM_AND_TOOL (FMOS — central nervous system)
  → feeds → 02_SERVICE_DELIVERY_AUTOMATION + 04_CLIENT_MANAGEMENT + 08_FINANCE
02_SERVICE_DELIVERY_AUTOMATION
  → feeds → 04_CLIENT_MANAGEMENT (delivery) + 08_FINANCE (invoicing triggers)
04_CLIENT_MANAGEMENT
  → feeds → 08_FINANCE (renewals) + 03_SALES_SYSTEM (upsells back to pipeline)
05_FORTUNEMARQ_ONLINE_PRESENCE
  → feeds → 06_PAID_MARKETING (brand trust) + 03_SALES_SYSTEM (inbound leads)
08_FINANCE ← receives from all service delivery and client management
09_LEGAL_AND_OPERATIONS ← supports 03_SALES_SYSTEM + 04_CLIENT_MANAGEMENT
10_PERSONAL_GROWTH ← supports Jabeer across all folders
```

### Master Flow
```
Data (L0) → Campaign → Lead in FMOS → 3-Touch Outreach → Meeting
→ Proposal → Agreement → Invoice → Onboarding → Delivery
→ Monthly Report → Health Score → Upsell → Renewal
```

### Content Build Hierarchy (current progress)
- L0 Niche Data Reference Sheet — COMPLETE
- L1 Lead CSV Files + PDF Index — COMPLETE
- L2 Telecaller Scripts — COMPLETE — 4 lead-type JSON files in FMOS_Script_Data/
- L3 WhatsApp Templates — COMPLETE — 17 templates in 5 JSON files in FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic PDF, JSON schema in FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — 1-page doc, service terms, payment policy
- L5 SOPs + Onboarding — COMPLETE — onboarding_checklists.json + onboarding_sop.md
- L6 Report Templates + Health Score — PENDING
- L7 Upsell System — PENDING

### Tech Stack
- CRM: Next.js 16, TypeScript, Tailwind CSS v4, Supabase
- Hosting: Hostinger → fmos.fortunemarq.com
- Builds: Antigravity | AI: Claude Pro + Claude Code
- Design: Canva | Task Queue: Celery + Redis (planned)

### Revenue Targets
- ₹50K MRR → End April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → Hiring trigger
- ₹5L MRR → 2-year vision

### Niche Attack Order (Phase 1 — Hubli-Dharwad)
1. Gyms (63,950/mo) 2. Skin Clinics (41,850/mo) 3. Computer Training (24,350/mo)
4. Dental (21,100/mo) 5. Car Rentals (16,450/mo) 6. JEE/NEET Coaching (12,300/mo)

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
