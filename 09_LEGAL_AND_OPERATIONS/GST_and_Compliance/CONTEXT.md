# 09 — GST & Compliance
**Last Updated:** March 2026 | **Status:** GST registered — invoicing not yet configured

## Purpose
Ensure all FortuneMarq invoicing and financial operations are GST compliant. Track GST filing requirements and deadlines.

## GST Details
- Registration: Complete
- Rate: 18% on all digital marketing services
- SAC Code: 998361 (internet advertising services) + 998399 (other IT services)
- Filing frequency: Monthly (GSTR-1 + GSTR-3B)

## What Needs to Be Done
- [ ] Add GSTIN to FMOS invoice settings
- [ ] Configure SAC codes per service in FMOS
- [ ] Set up GST calculation in invoice module
- [ ] Create GST filing calendar reminder
- [ ] Consult CA for first GST return

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. GST details documented. Configuration pending. |
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
