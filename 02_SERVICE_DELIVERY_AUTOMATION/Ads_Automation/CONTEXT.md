# 02 — Ads Automation Platform
**Last Updated:** March 2026 | **Status:** Not started — Phase 2 of build plan

## Purpose
Build the unified platform that manages Google Ads and Meta Ads for all clients from one system. AI generates campaign strategy, humans approve, system monitors daily, optimises automatically, and reports weekly.

## Architecture
- Google Ads: Agency MCC (Manager Account) — all clients linked underneath — one developer token
- Meta Ads: Agency Business Manager — clients add as partner — long-lived system user tokens
- AI (Claude API): generates campaign structure, keywords, audiences, ad copy
- Human approval gate: nothing goes live without Jabeer sign-off
- Daily optimisation pass: pause poor performers, adjust bids, reallocate budget
- Weekly report: combined Google + Meta performance per client

## Google Ads Setup
- Apply for Google Ads MCC (Manager Account) — free
- Basic Access: 15K ops/day — covers ~40–50 local clients
- Standard Access (approval-based, free) — apply when scaling beyond 50 clients
- SDK: google-ads-python

## Meta Ads Setup
- Agency Business Manager already exists
- Clients add agency as partner (one-time setup per client)
- SDK: facebook-business Python SDK
- Standard Access: rolling hourly points, recovers quickly

## Services This Covers
- Google Ads Management (₹2,500/month)
- Meta Ads Management (₹2,500/month)
- Google Ads Setup one-time (₹4,500)
- Meta Ads Setup one-time (₹4,500)

## Connections to Other Folders
- **Feeds FROM:** 01_CRM_AND_TOOL (client list, budgets, access credentials)
- **Feeds INTO:** 08_FINANCE (monthly management fee invoices), 04_CLIENT_MANAGEMENT (leads generated updates health score)
- **Depends ON:** Google Ads SOP + Meta Ads SOP (L5a) must be written first

## Current Status
- [ ] Google Ads MCC — not applied for
- [ ] Meta Business Manager partner setup — not done
- [ ] Ads SOPs — not written
- [ ] Build planned for Month 3–4

## Open Decision
- WhatsApp API vs Business Account for lead follow-ups from ads — affects how inbound leads from campaigns are handled

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Architecture defined from master plan. Waiting on SOPs + Phase 1. |
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
