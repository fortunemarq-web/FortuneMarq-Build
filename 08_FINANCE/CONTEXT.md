# 08 — Finance
**Last Updated:** March 2026 | **Status:** Infrastructure exists in FMOS — not yet activated

## Purpose
Plan and manage all financial operations — invoicing, GST compliance, expense tracking, revenue reporting, and progress toward ₹2L MRR goal. The finance module exists in FMOS but needs to be configured with real GST details and activated.

## Revenue Model
- MRR: All recurring retainer payments (Ads, SEO, GMB, WhatsApp Marketing)
- One-Time: Website builds, setups, logo, AI automations
- Track both separately — MRR is the business health metric, one-time is cash flow

## Pricing (locked)
- Landing Page: ₹5K–₹8K | Standard Website: ₹8K | Premium: ₹15K–₹20K
- Ads Setup: ₹4,500 | Ads Monthly: ₹2,500 | GMB: ₹2,500/month
- SEO: ₹7K–₹15K+/month | WhatsApp: ₹5K setup, ₹2,500/month

## Payment Policy (locked)
- Invoices raised 1st of month, due 5th
- 7 days overdue: campaigns paused + auto WhatsApp reminder
- 30 days overdue (website): site taken down, payment pending page shown
- Advance payments via UPI/bank transfer before work starts

## Monthly Burn
₹15,600–16,600/month (rent ₹6K + electricity ₹1.2K + wifi ₹700 + EMI ₹2.7K + subscriptions ₹4–5K)

## Revenue Milestones
- ₹50K MRR → end April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → hiring trigger

## GST Status
GST registered. 18% GST on all services. Invoicing not yet activated in FMOS. GSTIN needs to be added to invoice settings.

## Connections to Other Folders
- **Receives FROM:** 02_SERVICE_DELIVERY_AUTOMATION (delivery complete → invoice trigger), 04_CLIENT_MANAGEMENT (renewals)
- **Feeds INTO:** 01_CRM_AND_TOOL (invoice data lives in FMOS)

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Finance module exists, needs activation. |
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
