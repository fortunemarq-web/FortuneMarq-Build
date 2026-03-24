# 02 — Service Delivery Automation
**Last Updated:** March 2026 | **Status:** Planning phase — nothing built yet

## Purpose
Plan and build the three automation systems that power FortuneMarq's service delivery. These systems allow the agency to serve 30–50 clients without proportionally increasing manual work. Every service delivered through FortuneMarq will have an automation layer behind it.

## The Three Systems
1. **Website Design & Brief App** — Brief intake → AI generates PRD + prompts → Cousins build in Antigravity → Jabeer reviews → Go-live
2. **SEO Automation Engine** — Audit → Strategy → Git-based execution → Rank tracking → Auto reports
3. **Ads Automation Platform** — Google Ads MCC + Meta Ads → AI campaign generation → Human approval → Auto-optimisation → Auto reports

## Architecture (from Agency_OS_Master_Plan.docx)
- All three tools share one client database (FMOS/Supabase)
- Git as backbone — every website change versioned, auto-deployed via GitHub Actions to Hostinger
- Human approval gate before anything goes live
- Celery + Redis for scheduled automation jobs
- DataForSEO API for rank tracking (~₹1,500/month for 30 clients)
- API cost estimate: ~₹8,200/month for 30 clients

## Connections to Other Folders
- **Feeds FROM:** 01_CRM_AND_TOOL (client data, task assignments), 04_CLIENT_MANAGEMENT (onboarding triggers delivery)
- **Feeds INTO:** 04_CLIENT_MANAGEMENT (delivery status), 08_FINANCE (completion triggers invoice)
- **Depends ON:** L5 SOPs must exist before automation can be built (automation executes the SOPs)

## Build Phase Plan
- Phase 1 (Months 1–2): Website Brief App + GitHub Actions deployment pipeline
- Phase 2 (Months 3–4): Ads Automation (Google MCC + Meta)
- Phase 3 (Months 5–6): SEO Automation Engine
- Phase 4 (Months 7–8): Full automation + unified reporting

## Current Status
- Agency_OS_Master_Plan.docx — saved in this folder (reference document)
- Website Brief App — not started
- SEO Automation — not started
- Ads Automation — not started
- All SOPs (L5) — not written yet (must be done before building automation)

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Master plan document reviewed. Build phases confirmed. |
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
