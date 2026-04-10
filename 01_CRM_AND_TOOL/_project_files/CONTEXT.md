# 01 — CRM & Tool (FMOS)
**Last Updated:** March 2026 | **Status:** Built ~90%, needs changes before deployment

## Purpose
Plan, design, and execute all changes to the FortuneMarq Operating System (FMOS). This is the central nervous system of the entire agency. Every other folder either feeds data into FMOS or is managed through it. Decisions made here affect every team member and every workflow.

## What FMOS Is
A full agency operating system built on Next.js 16 + Supabase. Currently on localhost:3000. Moving to fmos.fortunemarq.com on Hostinger once changes are complete.

## Current Status
- Built: ~90% complete across 6 phases
- Location: localhost:3000
- Deployment target: fmos.fortunemarq.com
- Database: Supabase (cnwooodktqwvpzkucskm)
- Auth: @supabase/ssr v0.8.0 with cookie-based sessions

## What's Built
- Sales Intelligence Cockpit (power dialer, AI Brain, follow-up engine)
- Niche Pipeline Kanban (7-stage funnel)
- Client Profile (7 tabs: Overview, Onboarding, Assets, Projects, Finance, Strategy, Comms)
- Task Board (Kanban — pending/not_started/in_progress/in_review/completed)
- Project Management (PM dashboard, task assignment, milestones)
- Strategy Engine (AI task extraction per client)
- Finance Module (GST invoices, expenses, P&L)
- Agency Marketing Module
- Global Search (Cmd+K — Postgres FTS)
- Client Portal (/client/dashboard)
- WhatsApp Template Engine
- Notifications System (Supabase Realtime)
- Audit Log

## What Needs to Be Built / Changed
### NEW Features Required
- **Outreach Sequence Board** — visual board: Touch1 Pending → PDF Sent → Follow-up Due → Meeting Booked → Proposal Sent → Won/Lost/Dead/Revival
- **Lead Profile Page** — complete view: call history, WhatsApp sent, PDFs delivered, proposals, meetings, status
- **PDF Delivery Tracker** — log which PDF sent, when, by whom, to which lead
- **Retainer Package System** — tag clients with package tier, upsell eligibility
- **Revenue Forecast Widget** — pipeline × close rate = projected MRR vs ₹50K target
- **Upsell Tracker** — current package, eligible upgrades, last attempt, outcome

### CHANGES Required
- **Admin Dashboard** — morning view: today's meetings, overdue proposals, overdue invoices, project deadlines, telecaller activity, MRR
- **Telecaller View** — simplified to: call queue, follow-ups due, meetings booked, daily stats only
- **Cousin View** — tasks only: assigned tasks with brief/PRD, stage, revision notes
- **Finance** — separate MRR vs one-time revenue tracking

### REMOVE / DEPRIORITIZE
- Manager Leaderboards (no team yet — hide from nav)
- Strategist Role separate page (merge into Admin)

## Connections to Other Folders
- **Feeds FROM:** 07_DATA_AND_RESEARCH (leads uploaded), 03_SALES_SYSTEM (scripts/templates displayed), 06_PAID_MARKETING (inbound leads tagged)
- **Feeds INTO:** 02_SERVICE_DELIVERY_AUTOMATION (tasks created), 04_CLIENT_MANAGEMENT (client profiles), 08_FINANCE (invoices raised)
- **Used BY:** Afifa (telecaller view), Zaid + Sufiyan (task view), Jabeer (admin view)

## Key Decisions Locked
- URL: fmos.fortunemarq.com (Hostinger subdomain)
- Auth: cookie-based, createServerClientWithCookies on all server components
- DB: Supabase — never switch
- Stack: Next.js + TypeScript + Tailwind v4 — never switch
- Tasks table: project_id nullable (strategy tasks have no project)
- task_status enum: pending, not_started, in_progress, in_review, completed

## Deployment Checklist (pending)
- [ ] Add OPENROUTER_API_KEY to Hostinger env vars
- [ ] Create Afifa's telecaller account in /admin/users
- [ ] Create Zaid and Sufiyan accounts
- [ ] Point fmos.fortunemarq.com subdomain to Hostinger
- [ ] Upload 8,000 leads CSV
- [ ] Enter Austin Dental Spa and OM SAI TRAVELS real data
- [ ] Activate GST invoice settings

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Full feature list documented. Change requirements defined. |
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
