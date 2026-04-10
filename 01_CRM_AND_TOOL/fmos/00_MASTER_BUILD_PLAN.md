# FortuneMarq Agency OS — Master Build Plan
**Version**: 3.0 | **Updated**: 2026-03-25
**Status**: Production Ready | **Current App Version**: v4.5

---

## Build Status — All Systems

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
