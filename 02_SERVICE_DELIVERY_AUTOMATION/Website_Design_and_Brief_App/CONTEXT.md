# 02 — Website Design & Brief App
**Last Updated:** March 2026 | **Status:** Not started — intake form fields defined at L5c

## Purpose
Build the internal app that transforms a client brief into everything needed to build their website — PRD, Antigravity prompts, image briefs, and QA checklist. This app is what Jabeer uses at the start of every website project. Its output is what Zaid and Sufiyan use to build.

## How It Works
1. Jabeer fills structured intake form (business name, niche, city, pages, colours, goals, features)
2. App sends to Claude API → generates: Website Brief, Full PRD, 6 sequential prompt files, QA checklist, Image brief
3. Output saved to client's folder in FMOS
4. Task created in FMOS assigning build to available cousin
5. Cousin opens prompts in Antigravity → builds → submits stages for review

## Intake Form Fields (defined at L5c)
Business Name, Industry/Niche, City, Target Customer, Primary Goal, Pages Required, Services to Highlight, Brand Colours, Font Preference, Competitor URLs, Design References, Content Availability, Photos Available, Logo Available, Domain, Hosting, Special Features, Website Type, Deadline

## Output Format
- Website Brief (2 pages — context + design direction)
- Full PRD (page-by-page specification)
- Prompt Package (6 sequential files for Claude Code/Antigravity)
- QA Checklist (build-specific, 20 points)
- Image Brief (list of images needed)

## Connections to Other Folders
- **Feeds FROM:** 04_CLIENT_MANAGEMENT/Onboarding (triggers when website project starts)
- **Feeds INTO:** 01_CRM_AND_TOOL (task created for cousins), 02_SERVICE_DELIVERY_AUTOMATION/Website SOPs
- **Depends ON:** L5c Website Brief Intake Form must be fully defined first

## Tech Stack
- Frontend: Next.js (inside FMOS or standalone)
- AI: Claude API (claude-sonnet-4-20250514)
- Deployment: Hostinger or as module inside FMOS
- Git: GitHub org → one repo per client → auto-deploy via GitHub Actions

## Current Status
- [ ] L5c Intake Form fields — defined in hierarchy doc, not yet built
- [ ] Website Delivery SOP — not written (must exist before app is built)
- [ ] App build — not started

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Input/output format defined. Waiting on L5c SOP completion. |
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
