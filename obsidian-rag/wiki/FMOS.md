# FMOS

**Last updated:** 2026-04-29  
**Tags:** #project #active #evergreen  
**Related:** [[FortuneMarq]], [[TechStack]], [[TeamStructure]], [[CurrentBlockers]], [[SalesSystem]]

---

## Summary

FMOS (FortuneMarq Operating System) is a full-stack agency CRM built from scratch by [[SayedJabeer]]. It is **production-ready at v4.5** as of 2026-04-28. All phases are complete. TypeScript strict build passes clean. 858 Hubli leads are live in the system. Telecaller scripts are live with real search volumes auto-populated per lead. A one-click bulk-import tool is ready at `/admin/bulk-import` to load the remaining ~6,300 leads. The only remaining step is deployment to fmos.fortunemarq.com.

## Stack

Next.js 16.1.6 + TypeScript strict + Tailwind CSS v4 frontend. Supabase (PostgreSQL, Project ID: cnwooodktqwvpzkucskm) backend. Auth via @supabase/ssr v0.8.0. AI via Claude API (claude-sonnet-4-20250514) for strategy engine; OpenRouter Mistral 7B for sales brain. PDF generation via @react-pdf/renderer. Charts via Recharts v3.5.1. Icons: Lucide React. Animation: Framer Motion.

## Completed Phases (All Done ✅)

| Phase | What's Built | Status |
|-------|-------------|--------|
| Phase A — Cleanup | TypeScript regeneration, all `(supabase as any)` casts removed, strict build clean | ✅ Done |
| Phase B — Role Views | Telecaller view (Afifa), staff view (Zaid/Sufiyan), role-based dashboards | ✅ Done |
| Phase C — Outreach & Leads | Outreach Sequence Board, Lead Profile Page, PDF Delivery Tracker | ✅ Done |
| Phase D — Proposals & Onboarding | PDF proposal generation, agreements table, client onboarding checklist, asset vault init | ✅ Done |
| Phase E — Finance & Forecast | Revenue Forecast Widget, Upsell Tracker, P&L forecasting, retainer auto-calculation | ✅ Done |
| Phase 1 — Admin Command Center | Dashboard metrics, pipeline snapshots, build tracker | ✅ Done |
| Phase 2 — Client Lifecycle | Client list, health scores, onboarding, asset vault, Lead→Client auto-conversion | ✅ Done |
| Phase 3 — Agency Growth | SEO/GMB trackers, content calendars, acquisition targets | ✅ Done |
| Phase 4 — Strategy-to-Task Engine | AI (Claude API) turns strategy docs into assignable tasks | ✅ Done |
| Phase 5 + E — Finance & Revenue | MRR/Setup/One-Time split, P&L view, pipeline forecast, invoice reminders | ✅ Done |
| Phase 6 — Team Management | Staff scorecards, SOP library, workload distribution | ✅ Done |

## What's Built (Full Feature List)

- Sales Intelligence Cockpit — power dialer, AI Brain, follow-up automation. Role-based: telecaller → TelecallerCockpit with live script + real search volumes per lead; admin → SalesIntelligenceCockpit
- Telecaller Scripts — 4 type-based JSON scripts (A/B/C/D) displayed step-by-step during calls. Real search volumes auto-filled from `market_insights` table via `searchVolumeMap`. "our founder" language throughout. 9 call outcomes. 5 post-call WhatsApp templates per script.
- Bulk Lead Import — `/admin/bulk-import` one-click tool: walks `07_DATA_AND_RESEARCH/Lead_Database`, handles both CSV formats, chunks at 200/file, duplicate-safe. 858 Hubli leads already live. ~6,300 remaining ready to import.
- Niche Pipeline Kanban — 7-stage: new → contacted → interested → meeting → proposal → won/lost
- Outreach Sequence Board — 3-touch lead sequence tracker
- Lead Profile Page — full history: calls, WhatsApp, PDFs, proposals, meetings
- PDF Delivery Tracker — log which PDF sent, when, by whom
- Client Profile — 7 tabs: Overview, Onboarding, Assets, Projects, Finance, Strategy, Communications
- Client Health Score — payment timeliness + communication + results + tenure + upsell potential
- Task Board — Kanban: pending, not_started, in_progress, in_review, completed
- Project Management — PM dashboard, task assignment, milestones
- Strategy Engine — Claude API extracts actionable tasks from strategy documents
- Finance Module — GST invoices (FM-2026-XXX), expense tracking, P&L, MRR/Setup/One-Time split
- Revenue Forecast Widget — pipeline × close rate = projected MRR vs ₹50K target
- Retainer Package System — service tier tagging, upsell opportunity flags, auto-calculation
- Upsell Tracker — current package, eligible upgrades, last upsell attempt, outcome
- PDF Proposal Generator — dynamic 5–6 page proposal via @react-pdf/renderer
- Agreements Table — client agreements tracking
- Onboarding Checklist — 21-item per service type
- Asset Vault — client asset storage and management
- Agency Marketing Module — content tracking, SEO keywords, ad campaigns
- GMB & SEO Trackers — organic growth monitoring
- Team Scorecards + SOP Library — staff performance and process documentation
- Global Search — Cmd+K with Postgres full-text search
- Client Portal — read-only dashboard for clients
- WhatsApp Template Engine — 17 templates across 5 categories
- Notifications — Supabase Realtime
- Audit Log — all actions tracked
- 50+ database tables

## Deployment Checklist (Only Remaining Work)

- [ ] Add `OPENROUTER_API_KEY` to Hostinger environment variables
- [ ] Point `fmos.fortunemarq.com` subdomain DNS to Hostinger
- [ ] Create user accounts: Afifa (telecaller), Zaid (staff), Sufiyan (staff)
- [x] Upload Hubli leads — 858 live ✅
- [ ] Run `/admin/bulk-import` to load remaining ~6,300 leads from other cities
- [ ] Enter real client data (Austin Dental Spa, OM SAI TRAVELS as test cases)
- [ ] Activate GST invoice settings with GSTIN 29ICWPS9816Q1ZS
- [ ] Run smoke test across all modules post-deploy

## Open Questions

- [ ] Which hosting plan on Hostinger — Node.js? VPS?
- [ ] Deployment target date?

## Sources

- [[raw/2026-04-28_fmos-production-ready]]
- [[raw/2026-04-28_fmos-crm]]
- [[raw/2026-04-28_tech-stack]]
