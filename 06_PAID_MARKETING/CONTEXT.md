# 06 — Paid Marketing
**Last Updated:** March 2026 | **Status:** Not started — LAST step after all systems ready

## Purpose
Plan and execute FortuneMarq's own paid ad campaigns to generate inbound leads. Niche-specific, city-specific campaigns targeting local business owners. This folder covers FortuneMarq's own marketing spend — not client campaigns (those are in 02_SERVICE_DELIVERY_AUTOMATION/Ads_Automation).

## Critical Rule
Paid campaigns are the LAST step. They launch only after:
- CRM is deployed and working
- Telecaller system is operational
- Landing pages are live
- Delivery systems can handle incoming leads
Do not run ads into a broken system.

## Budget
₹20,000–30,000 total for Phase 1 campaigns

## Campaign Structure (Phase 1 — Hubli)
| Campaign | Budget | Target |
|---|---|---|
| Gyms — Hubli | ₹4,000 | Gym owners/managers, 25–45 |
| Skin Clinics — Hubli | ₹4,000 | Clinic owners, 30–55 |
| Dental — Hubli | ₹3,000 | Dentists/owners, 30–55 |
| Coaching — Hubli+Dharwad | ₹4,000 | Institute owners/managers |
| Retargeting (50%+ video views) | ₹5,000 | Warm audience |
| Reserve — double down on winner | ₹10,000 | After week 2 data |

## Ad Format
Jabeer on camera. 60–90 seconds. Explains real niche search data. Ends with WhatsApp CTA to landing page.

## Landing Pages Required (before ads launch)
13–14 niche+city specific pages for Hubli-Dharwad + 1 generic local business page
Each page: search volume data, competitor gap, 3-step solution, pricing reference, lead form

## Connections to Other Folders
- **Feeds INTO:** 01_CRM_AND_TOOL (inbound leads auto-tagged by niche+city+source)
- **Depends ON:** 05_FORTUNEMARQ_ONLINE_PRESENCE (brand trust reduces CPL)
- **Uses data FROM:** 07_DATA_AND_RESEARCH (search volumes, competitor gaps for ad copy)

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Campaign structure defined. Awaiting system readiness. |
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
