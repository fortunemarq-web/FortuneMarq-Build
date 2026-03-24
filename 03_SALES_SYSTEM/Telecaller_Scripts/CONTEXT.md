# 03 — Telecaller Scripts
**Last Updated:** March 2026 | **Status:** PENDING — waiting on L1 completion

## Purpose
Write one complete telecaller script per priority niche. These are the exact words Afifa reads during every cold call. Scripts are displayed in FMOS during calls. Every script uses real data from the Niche Data Reference Sheet (L0).

## Depends On
- L0 Niche Data Reference Sheet — COMPLETE ✓
- L1 PDF Index — must confirm PDF filenames before scripts reference them

## Scripts to Write (6 total)
1. Gyms Script — hook: "30,000 searches, only 3 websites, zero ads"
2. Skin Clinics Script — hook: "7,500 searches, top clinic gets 173 visits, 97% gap"
3. Computer Training Script — hook: "7,500 searches, 6,900 students going to online platforms"
4. Dental Script — hook: "3,900 searches, one real competitor, open market"
5. JEE/NEET Script — hook: "students going to Physics Wallah because no local institute shows up"
6. Car Rentals Script — hook: "zero paid ads in entire market"

## Each Script Contains
- Opening line (0–15 seconds) — greeting, name, agency, one-line reason
- Data hook (15–30 seconds) — the real number that creates curiosity
- Transition to PDF offer
- All 12 outcome responses (word for word)
- Meeting booking close
- CRM log instructions (what to select after each call type)

## The 12 Outcomes
1. Curiosity Triggered | 2. Wants Report | 3. Surprised by Data
4. Has Website | 5. Already Has Agency | 6. Asks Price
7. Skeptical | 8. Not Interested | 9. Staff Answered
10. Very Interested | 11. Perfect Client | 12. Future Client

## Directory Angle (use in all scripts)
70% of search traffic goes to JustDial/Sulekha/directories. Competitors share ~25–30% of remaining traffic. FortuneMarq bypasses directories — clients get direct calls, not JustDial leads.

## File Naming
One file per niche: Gyms_Script.md, SkinClinics_Script.md, ComputerTraining_Script.md, Dental_Script.md, Coaching_Script.md, CarRentals_Script.md
Plus: Master_Script_Guide.md — tone, rules, DOs and DONTs for Afifa

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Waiting on L1 to complete before writing scripts. |
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
- L1 Lead CSV Files + PDF Index — IN PROGRESS
- L2 Telecaller Scripts — PENDING
- L3 WhatsApp Templates — PENDING
- L4 Proposal + Agreement — PENDING
- L5 SOPs + Onboarding + Brief Form — PENDING
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
1. Gyms (30,000/mo) 2. Skin Clinics (7,500/mo) 3. Computer Training (7,500/mo)
4. Dental (3,900/mo) 5. JEE/NEET Coaching (2,550/mo) 6. Car Rentals (2,550/mo)

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
