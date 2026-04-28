# FMOS

**Last updated:** 2026-04-28  
**Tags:** #project #active #evergreen  
**Related:** [[FortuneMarq]], [[TechStack]], [[TeamStructure]], [[CurrentBlockers]], [[SalesSystem]]

---

## Summary

FMOS (FortuneMarq Operating System) is a full-stack agency CRM built from scratch by [[SayedJabeer]]. It is the single tool that runs all of FortuneMarq — no spreadsheets, no external CRMs. It is ~90% complete and running on localhost:3000. Deployment to fmos.fortunemarq.com is the top current priority.

## Stack

Next.js 16.1.6 + TypeScript strict + Tailwind CSS v4 frontend. Supabase (PostgreSQL, Project ID: cnwooodktqwvpzkucskm) backend. Auth via @supabase/ssr v0.8.0. AI via Claude API (claude-sonnet-4-20250514) for strategy engine; OpenRouter Mistral 7B for sales brain. PDF generation via @react-pdf/renderer. Charts via Recharts v3.5.1.

## What's Built

- **Sales Intelligence Cockpit** — power dialer, AI Brain, follow-up automation
- **Niche Pipeline Kanban** — 7-stage funnel: new → contacted → interested → meeting → proposal → won/lost
- **Client Profile** — 7 tabs: Overview, Onboarding, Assets, Projects, Finance, Strategy, Communications
- **Task Board** — Kanban: pending, not_started, in_progress, in_review, completed
- **Project Management** — PM dashboard, task assignment, milestones
- **Strategy Engine** — Claude API extracts actionable tasks from strategy documents
- **Finance Module** — GST invoices (FM-2026-XXX auto-numbering), expense tracking, P&L
- **Agency Marketing Module** — content tracking, SEO keywords, ad campaigns
- **Global Search** — Cmd+K with Postgres full-text search
- **Client Portal** — read-only dashboard for clients
- **WhatsApp Template Engine** — 17 templates across 5 categories
- **Notifications** — Supabase Realtime
- **Audit Log** — all actions tracked
- **50+ database tables** covering all business functions

## What's Pending (Deployment Blockers)

Six features must be built before FMOS goes live:

1. **Outreach Sequence Board** — visual board showing where each lead is in the 3-touch sequence
2. **Lead Profile Page** — complete view of call history, WhatsApp messages, PDFs delivered, proposals, meetings
3. **PDF Delivery Tracker** — log which PDF sent, when, by whom
4. **Retainer Package System** — tag clients by service tier, flag upsell opportunities
5. **Revenue Forecast Widget** — pipeline × close rate = projected MRR vs ₹50K target
6. **Upsell Tracker** — current package, eligible upgrades, last upsell attempt, outcome

## Deployment Checklist

- Add OPENROUTER_API_KEY to Hostinger env vars
- Create accounts: Afifa (telecaller role), Zaid (staff), Sufiyan (staff)
- Point fmos.fortunemarq.com subdomain DNS to Hostinger
- Upload 8,000 Hubli leads via CSV
- Enter real client data (Austin Dental Spa, OM SAI TRAVELS)
- Activate GST invoice settings with registered GSTIN

## Open Questions

- [ ] Timeline to finish the 6 pending features?
- [ ] Which hosting plan on Hostinger — Node.js? VPS?

## Sources

- [[raw/2026-04-28_fmos-crm]]
- [[raw/2026-04-28_tech-stack]]
