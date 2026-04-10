# 03 — Sales System
**Last Updated:** March 2026 | **Status:** Content hierarchy in progress — L0 complete, L1 in progress

## Purpose
Plan and create everything related to acquiring clients — telecaller scripts, WhatsApp templates, proposals, agreements, and the outreach sequence. This folder is the content layer for the sales function. The execution happens in FMOS (01_CRM_AND_TOOL). The content lives here.

## The Sales Flow
Meta/Google Ad runs for niche+city → 2 days later telecaller begins calls → 3-touch outreach sequence → meeting booked with Jabeer → Jabeer closes → proposal sent → agreement signed → invoice raised → work starts

## The 3-Touch Sequence
- Touch 1: WhatsApp curiosity message (before first call)
- Touch 2: PDF report delivered (niche+city specific, after call outcome)
- Touch 3: Follow-up call — goal is booking meeting with Jabeer

## Content Build Status (this folder owns L2, L3, L4a)
- L0 Niche Data Reference Sheet — COMPLETE (in 07_DATA_AND_RESEARCH)
- L1 Lead CSV + PDF Index — IN PROGRESS (in 07_DATA_AND_RESEARCH)
- L2 Telecaller Scripts — PENDING (6 niches, 12 outcomes each)
- L3 WhatsApp Templates — PENDING (28 variants)
- L4a Proposal Template — PENDING (8 service variants)

## Key Data (from L0 — all 6 niches)
- Gyms: 30,000/month — no competitor runs ads
- Skin Clinics: 7,500/month — 97% traffic gap
- Computer Training: 7,500/month — top player gets only 600/7,500
- Dental: 3,900/month — one moderate competitor
- JEE/NEET: 2,550/month — online platforms stealing students
- Car Rentals: 2,550/month — zero paid ads in market

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
