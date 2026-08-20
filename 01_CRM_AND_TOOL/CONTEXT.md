# 01 — CRM & Tool (FMOS)
**Last Updated:** 2026-08-20 (doc-drift reconciliation vs `00_MASTER/LIVE_STATE.md` + `FMOS_System_Design_And_Tasks.md`) | **Status:** ✅ **DEPLOYED & LIVE** on Vercel (`fmos.fortunemarq.com`). Database fully synced (no pending migrations). All 9 cities / 13 niches / **7,961** leads loaded. **Built & live:** Stage 1 data engine (1.3–1.6), **2.1 niche landing pages (all 13 niches × 9 cities = 117 LPs, deployed 2026-06-24 — not just one niche)**, Stage 3 outbound (3.1–3.4, incl. the Direct Report v3 — a TEXT template with 3 quick-reply buttons sent first, then the matched market-intel PDF as a follow-up document, which replaced the old "curiosity" teaser), Stage 4 delivery (4.1–4.8, incl. review/referral flywheel + auto-renewals), 5.1 marketing site, the AI bot (6.1), messaging safety + unified inbox (6.2/6.3/6.4), **and — corrected from "not yet built" — the command center (6.5), long-term nurture/reactivation (6.6), automation health monitoring (6.8), and backups (6.9), all built + deployed 2026-06-23/25**. WhatsApp Cloud API live on dedicated number +91 79759 18980; 33 system templates + the `direct_report_v3_*` family Meta-approved. Inbound engine (universal `/api/inbound/[channel]` webhook, UTM attribution, round-robin assign, funnel/CPL marketing tab) live. **Not yet built:** Stage 2 campaigns (an `ad_campaigns`/`ad_insights_daily` registry exists as manually-managed CRUD, but no automated Meta-metrics pull or campaign status machine), capacity guardrail (6.7), collection automation (1.1/1.2), pipeline orchestrator. **Stage 5 presence (5.2–5.7) is partially misdescribed by "not yet built": `app/admin/growth/{gmb,seo,instagram,facebook,linkedin}` exist as real, working pages** (checklists, content calendars, a GMB snapshot/review-tracker) — **but they predate the Stage 5 spec and don't fulfill it.** The code itself admits the gap: *"Follower counts have no data source yet (no social API integration)"* — no GA4/GSC integration, no unified presence dashboard, no leads-by-source view. Accurate framing: the content-calendar/checklist shell exists; the Stage 5 data-integration work (live social/GA4/GSC APIs, unified dashboard, leads-by-source) does not.

> Canonical app handoff: `fmos/CONTINUE_HERE.md`. Live build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`. (Older pointers to `COWORK_HANDOFF.md` / `00_MASTER_BUILD_PLAN.md` are now bannered historical.)

## Folder Purpose
Plan, design, and execute all changes to the FortuneMarq Operating System (FMOS). This is the central nervous system of the entire agency. Every other folder either feeds data into FMOS or is managed through it. Decisions here affect every team member and every workflow.

## What FMOS Is
A full agency operating system built on Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase. **Deployed & live on Vercel**, reached at `fmos.fortunemarq.com` via a Hostinger CNAME pointing at Vercel (Hostinger is shared hosting and can't run Next SSR — it is used only for the domain DNS + client sites). Local dev still runs on localhost:3000.

---

## What Exists (Complete)

### fmos/ — The Next.js Application
**Root documentation files:**
- `00_MASTER_BUILD_PLAN.md` — Full build plan (v4.9), all phase statuses through Phase F Stage 1
- `00_QUICK_REFERENCE.md` — Quick start guide for Claude/Antigravity sessions
- `APPLICATION_DOCUMENTATION.md` — Comprehensive technical documentation (DB schema, routes, components)
- `CLAUDE.md` — Instructions for Claude Code to work on this codebase
- `UI_UX_GUIDELINES.md` — Design system: bg-slate-50 backgrounds, white cards, slate-900 sidebar, #42CA80 green accent
- `START_HERE.md` — Session startup instructions
- `CSV_UPLOAD_FORMAT.md` — Format guide for lead CSV uploads
- `README.md` — Standard project readme
- `ADD_BUILD_TYPE_COLUMN.sql` — SQL migration for build_type column
- `.env.local` — Supabase URL, anon key, `ANTHROPIC_API_KEY` (Claude; the app uses Anthropic directly, not OpenRouter)
- `PHASE_A_CLEANUP.md` — Phase A spec: remove leaderboards, cleanup bugs (COMPLETE)
- `PHASE_B_ROLE_VIEWS.md` — Phase B spec: telecaller view, staff view, admin cleanup (COMPLETE)
- `PHASE_C_OUTREACH_LEADS.md` — Phase C spec: Outreach Board + Lead Profile + PDF Log (✅ COMPLETE)
- `PHASE_D_PROPOSAL_ONBOARDING.md` — Phase D spec: Proposal Generator, Agreement, Onboarding Tab, WhatsApp seeding (✅ COMPLETE)
- `PHASE_E_FINANCE_FORECAST.md` — Phase E spec: Finance split MRR/one-time, Revenue Forecast, Retainer Package (✅ COMPLETE)

**Core application routes (app/):**
- `/admin` — Admin Command Center: KPI bar, Priority List, Pipeline Snapshot, Quick Actions, Agency Growth
- `/admin/build-tracker` — 35+ module build tracker with inline status + notes
- `/admin/clients` — Client list with 5-dimension health scores, MRR, service pills, upsell engine
- `/admin/clients/[id]` — 6-tab client profile: Overview, Onboarding, Asset Vault, Projects, Finance, Strategy
- `/admin/clients/renewals` — Renewal countdown + upsell opportunity tracker
- `/admin/leads/[id]` — Lead profile page (Phase A modified; Phase C will fully enhance)
- `/admin/leads/[id]/proposal/new` — New proposal creation (Phase D)
- `/admin/leads/[id]/proposal/[id]/agreement` — Agreement page (Phase D)
- `/admin/outreach` — Outreach Sequence Board (Phase C — 10-column Kanban)
- `/admin/outreach/pdf-log` — PDF delivery audit log (Phase C)
- `/admin/proposals` — All proposals list
- `/admin/finance` — Finance dashboard (revenue, P&L summary, recent invoices)
- `/admin/finance/invoices` — Invoice manager with PDF generation
- `/admin/finance/expenses` — Expense log
- `/admin/finance/pnl` — P&L statement view
- `/admin/team` — Team management hub
- `/admin/team/sops` — SOP library with search + category filters
- `/admin/team/sops/[id]` — SOP edit/view page
- `/admin/team/scorecards` — Weekly performance scorecards
- `/admin/strategy` — AI strategy engine: paste strategy → generate tasks
- `/admin/strategy/review` — Review + approve generated tasks before committing
- `/admin/strategy/archive` — Past strategy runs
- `/admin/growth` — Organic + acquisition hub
- `/admin/growth/instagram` — Content calendar + Kanban
- `/admin/growth/linkedin` — Content calendar + Kanban
- `/admin/growth/facebook` — Content calendar + Kanban
- `/admin/growth/gmb` — KPI metrics, posts calendar, review tracker
- `/admin/growth/seo` — Keyword tracker, pages tracker, traffic log, backlink log
- `/admin/growth/acquisition/[city]` — Per-city niche acquisition breakdown
- `/admin/upload` — Lead CSV uploader with on-the-fly duplicate detection
- `/admin/upload/history` — Upload history
- `/admin/upload/debug` — Debug page
- `/admin/bulk-import` — One-click bulk importer: walks all CSVs in `07_DATA_AND_RESEARCH/Lead_Database`, skips duplicates automatically, shows per-file breakdown (added/skipped). Server action handles chunked upload (200 rows/chunk) via existing `uploadLeads()` action.
- `/admin/data-management` — Data management tools
- `/admin/duplicates` — Duplicate scanner + merge (undo supported)
- `/admin/whatsapp-templates` — WhatsApp template library + seed button
- `/admin/users` — User management (create Afifa + freelancer staff accounts here)
- `/admin/audit-log` — Full audit trail
- `/admin/briefing` — Daily briefing page
- `/admin/automations` — Automation rules engine
- `/admin/reports` — AI weekly agency report
- `/admin/sessions` — Session tracking
- `/admin/work-hours` — Work hours log
- `/admin/attendance` — Attendance tracking
- `/admin/alerts` — Admin alerts
- `/admin/marketing` — SEO tracker, paid campaigns, content calendar, weekly brief
- `/admin/operations` — Operations hub
- `/admin/niche-kits` — Niche kit management
- `/sales` — Sales Intelligence Cockpit (power dialer, lead queue, follow-up engine). Role-based: telecaller → TelecallerCockpit with real search volumes wired per lead via `searchVolumeMap`; admin → SalesIntelligenceCockpit. All ~7,960 leads across 9 cities loaded.
- `/strategist` — Strategist dashboard: 6-stage pipeline, Close Deal modal
- `/strategist/deals` — Deals management list
- `/projects` — PM dashboard: clients view + all projects view + team workload
- `/staff` — Staff task dashboard (filtered to assigned_to = current user)
- `/client-portal/[id]` — Client portal: projects, deliverable approval, reports, PM contact
- `/attendance` — Clock-in/out page for team

**API routes (app/api/):**
- `/api/ai/actions` — AI strategy generation
- `/api/attendance/clock-in`, `/clock-out`, `/break` — Attendance APIs
- `/api/cron/admin-alerts` — Cron job for admin alerts
- `/api/cron/automations/followups` — Follow-up automation cron
- `/api/cron/automations/sla` — SLA automation cron
- `/api/cron/automations/tasks` — Task automation cron
- `/api/cron/session-timeout` — Session timeout cron
- `/api/export` — Data export route
- `/api/leads/duplicates/scan` — Duplicate detection
- `/api/leads/merge` — Lead merge (with undo)
- `/api/notifications/verify` — Notification verification
- `/api/reports/sessions/export.csv` — Session export
- `/api/reports/work-hours` — Work hours report
- `/api/session/start`, `/end`, `/ping` — Session tracking APIs

**Server actions (actions/):**
- `analyze-data.ts`, `bulk-actions.ts`, `delete-data.ts`, `reset-database.ts`, `upload-leads.ts`
- `app/admin/bulk-import/actions.ts` — `runBulkImport()` server action; walks Lead_Database filesystem, parses both CSV column formats (Hubli_Final + cleaned_leads), maps to `UploadLeadParams`, chunks at 200/file

### FMOS_Change_Specs/ — Phase C/D/E Specs + All Data Files
- `MASTER_SPEC.md` — DB migrations master list for all pending phases
- `PHASE_A_REMOVE_AND_CLEANUP.md`, `PHASE_B_ROLE_VIEWS.md`, `PHASE_C_OUTREACH_AND_LEADS.md`, `PHASE_D_PROPOSAL_ONBOARDING.md`, `PHASE_E_FINANCE_AND_FORECAST.md`
- `data/script_type_A.json` — Type A telecaller script (already ranking on Google)
- `data/script_type_B.json` — Type B telecaller script (has website, not ranking)
- `data/script_type_C.json` — Type C telecaller script (no website, GMB only)
- `data/script_type_D.json` — Type D telecaller script (low search volume niche)
- `data/scripts_index.ts` — Script loader utility; `data/script.types.ts` — TypeScript types
- Direct Report v3 templates — `direct_report_v3_{a,b,c,d}` (one per lead type): a TEXT template (detailed body + 3 quick-reply buttons: "Book a meeting" / "Tell me more" / "ಕನ್ನಡ ವರದಿ") sent first, then the matched market-intel PDF as a follow-up document. Live route: `/admin/direct-report` (replaced the old curiosity blast)
- `data/bot_reply_templates.json` — 4 bot reply templates (auto-sent on lead reply)
- `data/followback_reminder_templates.json` — 1 follow-back reminder template
- `data/outcome_templates.json` — 6 outcome-triggered templates
- `data/post_meeting_templates.json` — 4 post-meeting templates (proposal/agreement/invoice stages)
- `data/whatsapp.types.ts` — WhatsApp TypeScript interfaces; `data/whatsapp_index.ts` — Template loader
- `data/proposal_schema.json` — Full 5–6 page proposal PDF schema
- `data/services_data.json` — All 7 services with deliverables, timelines, what we need from client
- `data/proposal.types.ts` — Proposal TypeScript types; `data/proposal_index.ts` — Proposal loader
- `data/agreement_template.json` — Agreement document structure with all variables
- `data/onboarding_checklists.json` — Per-service onboarding checklists for all 7 services
- `data/onboarding.types.ts` — Onboarding TypeScript types; `data/onboarding_index.ts` — Onboarding loader

### Antigravity_Prompts/ — Copies of Specs for Antigravity Build Sessions
- `PHASE_A_CLEANUP.md`, `PHASE_B_ROLE_VIEWS.md`, `PHASE_C_OUTREACH_LEADS.md`, `PHASE_D_PROPOSAL_ONBOARDING.md`, `PHASE_E_FINANCE_FORECAST.md`

### _project_files/ — Reference Documentation
- `APPLICATION_DOCUMENTATION.md` — Full technical app documentation
- `FORTUNEMARQ_APP_CONTEXT.md` — App context summary for Claude sessions
- `MASTER_CONTEXT.md` — Master context for the folder

---

## What's Pending

### Phase C — Antigravity NEXT
- SQL migrations: `outreach_stage`, `pdf_sent_at`, `pdf_name`, `last_outreach_at`, `follow_up_date`, `lead_type`, `no_answer_count`, `search_volume` columns on leads table; `outreach_logs` table creation with indexes
- Outreach Sequence Board at `/admin/outreach` — 10-column Kanban (6 active + 4 closed), drag-drop for admin, read-only for telecaller
- Lead Profile enhancement at `/admin/leads/[id]` — Outreach Timeline, Proposals section, Lead Details (editable), Quick Actions, Follow-up Info
- PDF Delivery Log at `/admin/outreach/pdf-log` — table with filters and pagination
- `WhatsAppTemplatePicker` shared component with variable substitution and outreach_logs insert

### Phase D — After Phase C
- SQL: `proposals`, `agreements`, `client_onboarding_tasks`, `client_asset_vault` tables; `whatsapp_templates` column additions
- Proposal Generator: service selection → pricing entry → 5-6 page PDF generation
- Agreement Flow: generated from proposal, client confirms by reply
- Onboarding Tab: per-service task checklists + asset vault management
- WhatsApp template seeding from `FMOS_Change_Specs/data/` into `whatsapp_templates` table

### Phase E — After Phase D
- SQL: `revenue_type` column on invoices; `package_tier`, `services_active`, `upsell_eligible` on clients
- Finance Module: MRR vs one-time revenue split in dashboard
- Revenue Forecast Widget: pipeline × close rate = projected MRR vs ₹50K target
- Retainer Package System: starter/growth/pro/custom tier tagging
- Upsell Queue: surface clients with Excellent health score for 2+ months

### Deployment Checklist (FMOS is deployed & live)
- [x] Add `ANTHROPIC_API_KEY` to Vercel env vars
- [ ] Create Afifa's telecaller account in /admin/users
- [ ] Create freelancer staff accounts as needed
- [x] Point fmos.fortunemarq.com subdomain to Vercel (CNAME added in Hostinger DNS) — LIVE
- [x] Load all 9 cities / 13 niches / ~7,960 leads via `/admin/bulk-import` — DONE
- [ ] Enter Austin Dental Spa and OM SAI TRAVELS real data
- [ ] Activate GST invoice settings with GSTIN 29ICWPS9816Q1ZS

---

## Open Items
- FMOS is deployed & live and all leads are loaded — outreach can begin
- Afifa needs her telecaller account created in /admin/users before she can start work

---

## Connections to Other Folders
- **Feeds FROM:** `07_DATA_AND_RESEARCH` (lead CSVs uploaded via `/admin/upload`), `03_SALES_SYSTEM` (scripts/templates displayed in UI, JSON data files in FMOS_Change_Specs/data/), `06_PAID_MARKETING` (inbound leads auto-tagged)
- **Feeds INTO:** `02_SERVICE_DELIVERY_AUTOMATION` (tasks created, assigned to outsourced freelancers), `04_CLIENT_MANAGEMENT` (all client profiles live here), `08_FINANCE` (all invoices raised and tracked here)
- **Used BY:** Afifa (Sales Cockpit `/sales`), outsourced freelancers (Staff view `/staff`), Jabeer (Admin view `/admin`)

---

## Key Decisions Made (Locked)
- URL: fmos.fortunemarq.com (subdomain via Hostinger DNS → Vercel) — never change
- Auth: cookie-based, `createServerClientWithCookies()` on all server components — never change
- DB: Supabase (project ID: cnwooodktqwvpzkucskm) — never switch
- Stack: Next.js 16 + TypeScript + Tailwind CSS v4 — never switch
- `task_status` enum: pending, not_started, in_progress, in_review, completed
- `tasks.project_id` is nullable (strategy tasks have no project)
- Phase execution order: A (done) → B (done) → C (done) → D (done) → E (done) → Deploy (done, live)
- Design language: bg-slate-50, white cards, slate-900 sidebar, #42CA80 green — never change
- Build tool: Antigravity (Claude Code) — all code changes executed here
- Database types: regenerate `database.types.ts` via Supabase CLI after each phase's SQL migrations

---

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Full feature list documented. Change requirements defined. |
| 2026-04-02 | Full FMOS change spec created. 5 phase spec files written in FMOS_Change_Specs/. 21 data files created in FMOS_Change_Specs/data/. DB migrations documented in MASTER_SPEC.md. Phase order locked. |
| 2026-04-28 | CONTEXT.md fully rewritten to reflect actual file structure. Phases A+B confirmed complete per 00_MASTER_BUILD_PLAN.md. Phases C–E specs confirmed complete and ready for Antigravity. Deployment checklist documented. |
| 2026-04-29 | Scripts (A/B/C/D) updated in `lib/data/scripts/`: "our founder" everywhere (was "Jabeer"), Zoom call meeting ask, new objection responses, 9 outcomes, 2 new WhatsApp templates (follow_back_report_sent, send_portfolio). Real search volumes wired into TelecallerCockpit via `searchVolumeMap` (fetched from `market_insights` table in page.tsx). New `/admin/bulk-import` route + server action for one-click import of all leads from Lead_Database (since used to load all 9 cities / 13 niches / ~7,960 leads). Note: must `rm -rf .next && npm run dev` after any JSON script changes to bust Next.js module cache. |
| 2026-08-20 | **Doc-drift reconciliation.** This file had gone stale since 2026-06-22 and directly contradicted `FMOS_System_Design_And_Tasks.md`: it still listed the command center (6.5), nurture/reactivation (6.6), automation health monitoring (6.8), and backups (6.9) as "not yet built" — all four shipped 2026-06-23/25. Also corrected the niche-LP count (all 13×9=117 live, not partial) and lead count (7,961). Note for a future pass: the route/API/spec inventory further down this file (Phase A–E framing, `FMOS_Change_Specs/`, `Antigravity_Prompts/`) predates the app's current Stage-based structure and many of its file references (`00_MASTER_BUILD_PLAN.md`, `START_HERE.md`, `PHASE_*.md`) were archived out of `fmos/` on 2026-06-22 per `CONTINUE_HERE.md` — that section needs a full rewrite, not just a status-line fix; out of scope for this reconciliation pass. |
| 2026-08-20 | **Source-level verification pass.** Re-checked every "built"/"not built" claim above against actual code (routes, grep for the underlying logic), not just other docs. Everything held up except one: "Stage 5 presence not yet built" was imprecise — `app/admin/growth/{gmb,seo,instagram,facebook,linkedin}` are real, working pages (older than the Stage 5 spec), not stubs, but they don't fulfill it — no GA4/GSC/social-API integration, no unified dashboard, no leads-by-source (confirmed via a code comment admitting "no data source yet"). Corrected above. |
| 2026-08-20 | **`FMOS_Change_Specs/data/` re-synced with the live app.** A diff turned up real drift, not just theoretical duplication risk: `script_type_{A,B,C,D}.json` + `script.types.ts` + `scripts_index.ts` in `FMOS_Change_Specs/data/` had gone stale since the 2026-07-08 script-warming session — the live `fmos/lib/data/scripts/` versions gained a Kannada/Kanglish localization layer (`textKn` fields) and a restructured branch-node format that the Specs copy never received. Copied the live files over the stale ones (`FMOS_Change_Specs/data/` is a reference/spec mirror, not a runtime source — `fmos/lib/data/scripts/` is what the app actually reads). Checked every other file this folder claims mirrors app data (`proposal_schema.json`, `agreement_template.json`, `onboarding_checklists.json`, `upsell_rules.json`, `upsell_scripts.json`, `monthly_report_schema.json`, `client_health_score.json`, and the same set under `04_CLIENT_MANAGEMENT/FMOS_*_Data/`) — none of them are actually read by the live app (`lib/onboarding/generateClientOnboarding.ts` and the equivalent upsell/health-score/proposal components hardcode this content directly in TypeScript instead); those are dead build-specs, not an active drift risk, left as-is. `services_data.json` (present in both places) is still byte-identical — no drift there either. |
