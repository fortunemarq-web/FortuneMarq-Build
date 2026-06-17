> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# FortuneMarq Agency OS — Master Build Plan
**Version**: 3.5 | **Updated**: 2026-06-12 (night)
**Status**: Phase F Stage 1 (WhatsApp Cloud API) code complete, pre-deploy | **Current App Version**: v4.9

---

## Build Status — All Systems

### ✅ PHASE F Stage 1 (part 1) — WhatsApp Cloud API, FMOS side (2026-06-12, night)
Meta-side setup in progress (Option A locked: NEW dedicated Jio number 79759 18980 on Cloud API; 93530 82656 stays in the WA Business app). FMOS side built:
- **Webhook** `app/api/webhooks/whatsapp/route.ts` — GET Meta handshake (`WHATSAPP_VERIFY_TOKEN`), POST verifies `X-Hub-Signature-256` HMAC (`META_APP_SECRET`, timing-safe, fail-closed). Idempotent on `wamid` via `inbound_events.external_id`. Unknown numbers → `processInboundLead()` (channel `whatsapp`, or `ctwa` when a `referral` payload is present — ad `source_id`/`headline` mapped to campaign for automatic WhatsApp-ads attribution). Known numbers → `whatsapp_logs` (direction inbound) + `activity_events` + `inbound_events` + assignee notification. Delivery receipts stamp `whatsapp_logs.delivery_status`. "Yes, confirmed" agreement replies notify admins.
- **Button replies** (`interactive.button_reply` + template `button` type): tag `report_engaged` + `tapped_book_meeting`/`tapped_tell_me_more`, bump `follow_up_date=now` (top of queue — cockpit already renders these), notify assignee/admins, send mapped auto-reply ("Not right now" → +3-day follow-up). Copy mirrored in `lib/whatsapp/auto-replies.ts` (source of truth: `03_SALES_SYSTEM/.../curiosity_templates.json`).
- **Send library** `lib/whatsapp/send.ts` (server-only): text / template / interactive-buttons / document(link or media id) / media upload via Graph v23.0; every send logged to `whatsapp_logs`. Graceful no-op while creds are placeholders.
- **Auto-greeting** to new inbound WhatsApp/CTWA leads (session text — no template approval needed), toggle in `/admin/whatsapp-templates` header, stored in new `app_settings` table, default ON.
- **Schema** (appended to `supabase/2026-06-12_full_schema_sync.sql`, ⚠️ RUN PENDING): `whatsapp_logs` += direction/wa_message_id/message_type/delivery_status/phone; new `app_settings` + auto-greeting seed.
- Env added: `WHATSAPP_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`/`META_APP_SECRET` (placeholders), `WHATSAPP_VERIFY_TOKEN` (real value generated). Test harness: `scripts/test-whatsapp-webhook.sh` (handshake ✓, bad-signature 401 ✓, all payload shapes 200 ✓ in sandbox; DB-write verification pending on-Mac run).
- Remaining for Stage 1: Meta-side (BM verify → app → WABA → number → token → templates), run schema SQL, on-Mac `npm run build` + e2e curl, webhook URL config after Vercel deploy.

### ✅ PHASE F Stage 0 — Inbound Engine (2026-06-12, evening)
Plan: `PHASE_F_INBOUND_MARKETING.md` (approved). Stage 0 shipped + tested end-to-end:
- **Universal inbound pipeline** `lib/inbound/capture.ts`: raw event log (`inbound_events`) → phone normalize/dedupe (suffix-match handles +91/format drift; duplicates become re-enquiry activity + assignee notification, never new leads) → lead with `source`/`lead_source`/`captured_at` → `lead_source_attribution` row (UTMs, auto-created `ad_campaigns` match) → fires `lead_created` automation (first ever caller) → round-robin assign via `assignment_pools` ('sales' pool seeded with team) → owner notified.
- **Webhook** `POST /api/inbound/[channel]` (`INBOUND_WEBHOOK_SECRET`), native Google Ads lead-form adapter. LP form captures UTMs/gclid/fbclid. Cockpit quick-add has a source picker; `first_contact_at` stamped on first logged outcome (speed-to-lead).
- **Marketing hub**: existing 4-tab `/admin/marketing` dashboard (alive post-migration) gained a default "Inbound & Funnel" tab — spend/CPL/cost-per-meeting/CAC/speed-to-lead KPIs, funnel with stage conversion, channel scoreboard, UTM link builder, **spend CSV import** (Meta/Google daily exports → `ad_insights_daily`, campaigns auto-created), inbound-events feed. "Marketing" in sidebar. Daily digest gained a marketing line.
- **Engine fixes found by testing**: live `ad_campaigns` had pre-sync shape (columns aligned + `cpl_target`); automation engine wrote `assigned_to` → mapped to `assigned_sales_exec`; `notify_owner` re-fetches live assignee.
- Stage 1 (needs deploy): WhatsApp Cloud API + Meta leadgen webhooks, SLA cron, Meta insights sync.

### ✅ Notifications + Finance Session (2026-06-12, continued)
- **Notifications fixed for real**: `notifications` table was missing `type` + `link` columns that `sendNotification()` inserts — every notification insert had been silently failing. Columns added (also in sync script); insert verified. All 10 existing `sendNotification` call sites now work, bell realtime included.
- **Daily Digest cron** (`/api/cron/daily-digest`): per-user morning notification — meetings due/overdue, follow-ups due (per assignee + team total for admins), overdue invoices with ₹ outstanding, overdue tasks, **at-risk clients** (overdue payments or renewal ≤30 days, with MRR at stake). Idempotent per day. Tested live.
- **Cron routes — KNOWN GAP (audit H2, not yet fixed):** `vercel.json` schedules `daily-digest` + `admin-alerts`, but those route handlers currently export **POST only**. Vercel Cron invokes via **GET**, so as-is they would 405 and never run. Fix pending in Phase 2: add `GET` handlers (keeping `verifyCronSecret`) **or** move all crons to `.github/workflows/cron.yml`. Do NOT rely on these crons firing on Vercel until that lands. (`vercel.json` is Hobby-plan-safe; other crons can be triggered via the GitHub Actions workflow.)
- **Invoice partial payments**: `recordInvoicePayment()` accumulates `paid_amount`, auto-flips status `partially_paid`→`paid`, records `payment_method` (new column). UI: Record Payment flow (amount → method), partial badge + received amount, filter option.

### ✅ Schema Sync + Audit-Fix Session (2026-06-12)
Full detail in `last_session.md`. Highlights:
- **All ~19 unrun migrations executed** in Supabase as one consolidated script — 38 missing tables created (attendance, notifications, automations, saved views, niche kits, follow-ups, duplicates, sessions, marketing, telecaller stats…), RLS hardened, audit triggers + indexes live. `database.types.ts` regenerated (110 tables). The previous "4 migrations pending" status is resolved.
  - **Pending-SQL reconciliation (as of 2026-06-15):** the live DB is in sync — the only outstanding block is the **Phase F / WhatsApp Stage 1** schema (see §Phase F above, run pending on deploy). NOTE the audit (Phase 1, A1/S1) flagged that the `supabase/migrations/` folder is NOT a clean replayable history: core tables (`leads`, `clients`, `projects`, `proposals`, `profiles`) are only ALTERed, never CREATEd, and the 53 files apply alphabetically rather than chronologically. A baseline + renumber is scheduled for Phase 1 — until then, treat the live Supabase schema (not the migrations folder) as the source of truth.
- **Team management built**: invite / change role / reset password / deactivate / remove from `/admin/team`, admin-gated via service role, audit-logged, tested end-to-end.
- **UX debt cleared**: zero `alert()`/`prompt()` left — toast + `promptModal()` (dropdowns/date pickers/textareas) everywhere; dead buttons (work-hours Details, my-stats View All, team Assign) now functional.
- **Bugs**: project not-found page, expired report-link state, invoice list refresh after MRR generation.
- **/manager/performance** now computes real timeframe-filtered stats from `outreach_logs` (fake hardcoded numbers removed).

### ✅ UI/UX Overhaul + Layout/PDF Session (2026-06-11 evening)
Full detail in `COWORK_HANDOFF.md`. Highlights:
- **Design system** in `globals.css`: brand token scale (`brand-deep` #1E7A4F = the only green for text/buttons on white), self-hosted fonts via next/font, focus rings, thin scrollbars, tabular numerals; dead `tailwind.config.ts` deleted
- **Restyled**: login page (rebuilt), admin dashboard (neutral-first, semantic color only), 7 error pages, telecaller cockpit accents; emoji removed from all UI chrome
- **Layout fix**: app shell `h-dvh`, `<main>` is the only scroll container; `min-h-screen → min-h-full` in 106 shell files (kills overscroll white space; sidebar no longer scrolls away)
- **Bug fix**: outreach board crash — `leads.updated_at`/`assigned_to` don't exist → `last_activity_at`/`assigned_sales_exec`; dashboard meetings-today counts on `meeting_booked_at`; `pipeline.ts` helpers auto-stamp both timestamps now
- **PDFs**: `InvoicePDF.tsx` redesigned (brand bar, status chip, zebra table, Total Due block); print-to-PDF system (`.print-area` + `PrintButton`) for proposals + agreements; agreement gained signature blocks
- Build: clean `npx tsc --noEmit` + `npm run build`
- **Open**: PDF re-test by user; growth-page emoji icons; ~670 hardcoded `#42CA80` hexes to migrate to tokens opportunistically; `/manager` pipeline-board phantom columns

### ✅ Security & Reliability Hardening (2026-06-11)
Full audit → fixes executed (steps 1–7). Details in `last_session.md`.
- **Auth**: `proxy.ts` deny-by-default route protection; `/admin` admin-only; role-area redirects
- **RLS**: migration `20260611000000_harden_rls_policies.sql` — anon fully locked out, staff-only catch-all, admin-only finance/audit, scoped client-portal policies ⚠️ MUST BE RUN IN SUPABASE
- **Cron**: all 6 routes require `CRON_SECRET` bearer (fail closed) + service-role client (`lib/supabase-admin.ts`, `lib/cron-auth.ts`)
- **API routes**: 18 routes/actions moved from anon client to cookie-auth client
- **Error UX**: global toast system (`components/ui/toast.tsx` + `lib/mutate.ts`); silent-failure mutations fixed in cockpit, outreach board, meetings, proposal creator, lead profile, close-deal modal
- **Pipeline**: `lib/pipeline.ts` single state machine (17 stages incl. parked: unreachable/gatekeeper/gatekeeper_flagged/language_barrier/revival); `outreach_stage` + `status` written in lockstep everywhere; parked stages now visible on outreach board
- **Audit**: migration `20260611000002_audit_triggers.sql` — DB triggers on 10 core tables ⚠️ RUN IN SUPABASE
- **Meetings columns**: migration `20260611000001_leads_meeting_columns.sql` ⚠️ RUN IN SUPABASE
- **Perf**: migration `20260611000003_hot_column_indexes.sql` ⚠️ RUN IN SUPABASE; outreach board select fix (updated_at/assigned_to) + caps; LeadsList real DB pagination (50/page)
- **Wired up**: NotificationBell mounted (was orphaned — notifications were write-only); ActivityTimeline (now merges audit_logs) on lead profile + client overview
- Build: clean `npx tsc --noEmit` + `npm run build`
- **Deferred**: WhatsApp Cloud API/webhooks (awaiting credentials); wa.me links unchanged

### ✅ Type Safety & Code Quality (2026-03-25)
- `database.types.ts` regenerated via Supabase CLI — all 30+ tables typed
- All 176 `(supabase as any)` global casts removed
- Auth client standardized — all page.tsx files use `createServerClientWithCookies()`
- `leadsResult.error` order bug fixed in `app/sales/page.tsx`
- All `catch (err: any)` patterns fixed across all action files
- Remaining table-name `as any` casts cleaned up globally
- Build: clean `npx tsc --noEmit` + `npm run build`

### ✅ Sales Cockpit (`/sales`)
- Power dialer with lead queue, priority + follow-up tabs
- 858 Hubli outbound leads (11 niches)
- Niche/city filters, Has Website toggle
- Auto-tags, SERP tags, manual tags, GMB Profile / Google Search button
- Follow-up screen: reconnect script, last contacted badge, last outcome badge
- Follow-up sidebar: priority sort (overdue→today→upcoming), niche/city filters
- No AI API calls — local pitch-engine only

### ✅ Outreach Sales System (`/sales/outreach`)
- 7-stage Kanban (Touch 1 → PDF → Follow-up → Meeting → Proposal → Won/Lost)
- AdvanceStageModal adapts per stage, all transitions logged to `activity_events`
- 8 DB tables: `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`, `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`

### ✅ Phase 1 — Admin Command Center
- `/admin` — KPI bar, Priority List, Pipeline Snapshot, Quick Actions, Agency Growth metrics, City Acquisition table, Build Progress
- `/admin/build-tracker` — 3 systems, 35+ modules, inline status + notes, Framer Motion progress bars

### ✅ Phase 2 — Client Lifecycle
- `/admin/clients` — full client list, health scores (5-dimension), MRR, service pills, upsell engine
- `/admin/clients/[id]` — 6-tab profile: Overview, Onboarding, Asset Vault, Projects, Finance, Strategy
- `/admin/clients/renewals` — renewal countdown + upsell opportunity tracker
- Lead → Client auto-conversion on `closed_won`

### ✅ Phase 3 — Agency Growth
- `/admin/growth` — organic + acquisition hub
- `/admin/growth/instagram`, `/linkedin`, `/facebook` — content calendar + kanban
- `/admin/growth/gmb` — KPI metrics, posts calendar, optimization checklist, review tracker
- `/admin/growth/seo` — keyword tracker, pages tracker, traffic log, backlink log
- `/admin/growth/acquisition/[city]` — per-city niche accordion with full acquisition breakdown

### ✅ Phase 4 — Strategy-to-Task AI Engine
- `/admin/strategy` — paste strategy → configure destination → LLM generates tasks
- `/admin/strategy/archive` — past strategy runs
- `/admin/strategy/review` — review + approve generated tasks before committing

### ✅ Phase 5 — Finance Module
- `/admin/finance` — revenue dashboard, P&L summary, recent invoices
- `/admin/finance/invoices` — invoice manager with PDF generation
- `/admin/finance/expenses` — expense log with categories
- `/admin/finance/pnl` — P&L statement view

### ✅ Phase 6 — Team Management
- `/admin/team` — member cards, aggregate stats, Assign Task modal (wired), Set Targets modal (wired)
- `/admin/team/sops` — SOP library, working search + category filters
- `/admin/team/sops/new` — SOP creation page
- `/admin/team/sops/[id]` — SOP edit/view
- `/admin/team/scorecards` — weekly performance scorecards by role

### ✅ Strategist Dashboard
- `/strategist` — 6-stage Kanban pipeline (Qualified → Contract Signed)
- Close Deal modal: creates client + logs deal + provisions one project per service + updates lead to `closed_won`
- Dashboard View: Needs Proposal list, Needs Contract list, Loss Reason tally, amber follow-up highlights
- `/strategist/deals` — deals management list

### ✅ PM Dashboard (`/projects`)
- Clients View (accordion grouped by client) + All Projects View (flat grid)
- Team Workload section — sorted by active task count
- Client Resources (Add/Delete Drive links per client) — wired to `client_resources` table
- "Needs Attention" filter — projects with overdue tasks
- Search by client name/email
- Create Project modal

### ✅ Staff Dashboard (`/staff`)
- Production mode: tasks filtered to `assigned_to === current_user.id`
- 4 KPI cards: My Load, Due Today, High Priority, Today's Rate
- Task Execution Modal — saves status changes and submission notes to DB
- Task sort: Overdue → High Priority → Due Today
- Color-coded card borders, section tags for strategy tasks

### ✅ Client Portal (`/client/dashboard`)
- Shows all active projects (multi-project selector tab)
- Deliverable approval + revision request (inline textarea, no prompt())
- Project roadmap with milestone progress
- Performance reports archive with magic link access
- PM contact card

### ✅ Supporting Pages (all verified clean)
- `/admin/marketing` — SEO tracker, paid campaigns, content calendar, weekly brief
- `/admin/reports` — AI weekly agency report
- `/admin/sales` — sales analytics + funnel charts
- `/admin/automations` — automation rules engine
- `/admin/whatsapp-templates` — WhatsApp template library
- `/admin/upload` — CSV uploader with duplicate detection
- `/admin/users` — user management
- `/admin/niche-kits` — niche kit library
- `/manager/performance` — telecaller leaderboards
- `/manager/pipeline` — niche kanban (7 stages)
- `/telecaller/my-stats` — telecaller personal stats
- `/client/report/[token]` — public performance report via magic link
- `/lp/[niche]/[city]` — VSL landing pages (inbound lead capture)
- `/tasks` — task board
- `/attendance` — attendance tracker

---

## Database Tables — All Typed

All 30+ tables regenerated into `types/database.types.ts` via Supabase CLI on 2026-03-25.

**Core**: `leads`, `profiles`, `clients`, `deals`, `projects`, `tasks`, `follow_ups`
**Sales**: `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`, `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`, `market_insights`, `csv_uploads`
**Growth**: `content_pieces`, `seo_keywords`, `seo_pages`, `gmb_snapshots`, `review_requests`, `acquisition_targets`, `agency_growth_metrics`
**Strategy**: `strategy_runs`, `strategy_run_tasks`
**Finance**: `invoices`, `expenses`
**Team**: `sops`, `team_targets`, `build_tracker_modules`
**System**: `alerts`, `notifications`, `ai_usage_logs`, `audit_logs`
**Projects**: `client_resources`, `client_deliverables`, `client_reports`, `project_milestones`

---

## Pending Work

None at this time. App is production-ready.

---

## Non-Negotiable Rules (All Future Work)

1. **Never** use `createServerClient()` in page.tsx — always `createServerClientWithCookies()`
2. **Never** use `(supabase as any)` — if a table is missing from types, run `npx supabase gen types typescript`
3. Always add RLS policies for any new table
4. Never break existing routes — only add new routes
5. All forms: Server Actions (`"use server"`), not API routes
6. Every data-fetching page needs error handling on all queries
7. No `catch (err: any)` — always `catch (err) { err instanceof Error ? err.message : "Unknown error" }`
8. Mobile responsive — 44px+ touch targets
9. No AI API calls in the sales cockpit — local pitch-engine only
10. No `alert()` or `prompt()` — use state-based UI

---

## Tech Stack

- **Framework**: Next.js 16.1.6 App Router, TypeScript 5.x
- **Styling**: Tailwind CSS v4 — use existing design tokens only
- **Database**: Supabase (`cnwooodktqwvpzkucskm.supabase.co`) with RLS
- **Auth**: `@supabase/ssr` v0.8.0
- **Charts**: Recharts v3.5.1
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **PDF**: `@react-pdf/renderer`

## Design System

- Background: `bg-slate-50`
- Cards: `bg-white border border-slate-200 rounded-xl shadow-sm`
- Sidebar: `bg-slate-900`
- Brand Accent: `#42CA80` (FortuneMarq Green)
- KPI Cards: colored top-border (3px), `font-mono` numbers
- Server client: `lib/supabase-server.ts` → `createServerClientWithCookies()`
- Browser client: `lib/supabase.ts` → `createClient()`
