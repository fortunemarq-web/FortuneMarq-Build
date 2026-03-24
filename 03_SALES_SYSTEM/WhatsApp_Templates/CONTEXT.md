# 03 — WhatsApp Templates
**Last Updated:** March 2026 | **Status:** PENDING — waiting on L2 (scripts) completion

## Purpose
Write all 28 WhatsApp message templates used by Afifa, Jabeer, and auto-sent by FMOS. Templates must sound like a natural continuation of the phone call — same voice, same data references as the telecaller scripts.

## Depends On
- L2 Telecaller Scripts — must be complete first (templates match script tone)
- L1 PDF Index — PDF filenames must be confirmed

## Complete Template List (28 total)
### Outreach (6)
Touch 1 per niche: Gyms, Skin Clinics, Computer Training, Dental, Coaching, Car Rentals

### PDF Delivery by Outcome (5)
Interested / Wants Report / Not Interested / Straight Rejection / No Answer x3

### Follow-up Sequence (4)
Touch 3 follow-up / Meeting Confirmation / Meeting Reminder / Post-Meeting Thank You

### Proposal & Closing (2)
Proposal Follow-up 48h / Proposal Follow-up 4 days

### Finance & Payments (3)
Invoice Due / 7 Days Overdue / Campaign Paused Notice

### Client Management (4)
Monthly Report Delivery / Retainer Pitch at Website Delivery / Upsell GMB→Ads / Upsell Ads→SEO

### Revival Sequences (3)
30-Day Revival / 90-Day Revival / 6-Month Revival

## Each Template Contains
- Template Name (CRM reference name)
- When to Send (trigger condition)
- Who Sends (Afifa / Jabeer / Auto)
- Message Text (complete, with [VARIABLE] placeholders)
- Variables list
- Follow-up Action

## Key Principle
Directory angle woven into relevant messages — FortuneMarq bypasses JustDial, clients get direct calls.

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. All 28 templates listed. Waiting on L2 scripts completion. |
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
