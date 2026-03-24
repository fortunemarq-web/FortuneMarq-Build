# FortuneMarq Agency OS — Full App Context
*Last updated: March 12, 2026 — Post Phase 6 Completion*

---

## App Overview
- **Framework**: Next.js 16.1.6 App Router
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Auth**: @supabase/ssr v0.8.0 with server-side cookie sessions
- **Charts**: Recharts v3.5.1
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **PDF**: @react-pdf/renderer
- **Dev URL**: localhost:3000

---

## Design System
- **Background**: bg-slate-50 (page), bg-white (cards)
- **Sidebar**: bg-slate-900
- **Borders**: border-slate-200
- **Radius**: rounded-xl
- **Accent**: #42CA80 (green)
- **Headings**: DM Sans
- **Body**: IBM Plex Sans
- **Theme**: SaaS Light

---

## Supabase Project
- **Project**: fotunemarq-ship-it's Project
- **Org**: fotunemarq-ship-it's Org
- **Dashboard**: supabase.com/dashboard/project/cnwooodktqwvpzkucskm

---

## Auth Users (Test Accounts)
| Email | Role |
|-------|------|
| admin@test.com | admin |
| staff@test.com | staff |
| pm@test.com | pm |
| strategy@test.com | strategist |
| sales@test.com | telecaller |
| contact@austindental.com | client |

---

## Database Tables (Complete List)

### Core
- `profiles` — User profiles with role (admin/pm/staff/strategist/telecaller/client)
- `clients` — Client records with business_name, niche, city, services, monthly_value, status, renewal_date
- `leads` — Sales pipeline leads
- `projects` — Client delivery projects (columns: id, name, client_id, status, service_type, build_type, health_status, start_date, deadline, completion_percentage, assigned_pm, assigned_to, delivery_stage, deal_id)
- `tasks` — All tasks (columns: id, title, status, priority, due_date, project_id [nullable], assigned_to, section_tag, estimated_minutes, strategy_run_id, client_id, type, description, estimated_hours, actual_hours, tags, sop_content)
- `task_status` enum: pending, not_started, in_progress, in_review, completed

### Client Management (Phase 2)
- `onboarding_checklists` — 21-item checklist per client, auto-populated
- `client_assets` — Credentials, brand assets, important links
- `client_call_logs` — Call history per client
- `project_qa_items` — QA checklist for projects
- `renewal_alerts` — VIEW: clients with upcoming renewals

### Marketing (existing)
- `content_pieces` — Social media content (extended: reach, likes, comments, shares, saves, engagement_rate, channel, belongs_to)
- `seo_keywords` — SEO keyword tracker (extended: belongs_to)
- `ad_campaigns` — Ad campaign tracking

### Agency Growth (Phase 3)
- `gmb_snapshots` — Google My Business monthly snapshots
- `gmb_checklist_items` — GMB optimization checklist (10 pre-seeded items)
- `review_requests` — Review request tracking
- `backlinks` — Backlink tracker
- `seo_pages` — SEO page tracker
- `acquisition_targets` — City + niche lead targets (seeded: Hubli × 6 niches = 229 leads)
- `agency_growth_metrics` — Monthly growth KPIs
- `monthly_value` — Column on clients table

### Strategy Engine (Phase 4)
- `strategy_runs` — Archives raw strategy + config (columns: id, strategy_type, client_id, destination, timeframe, raw_markdown, created_at)
- `strategy_run_tasks` — Bridge table linking strategy runs to tasks

### Finance (Phase 5)
- `invoices` — Invoice metadata (auto-number: FM-2026-XXX, GST 18%, status: draft/unpaid/paid/overdue)
- `invoice_line_items` — Line items per invoice
- `expenses` — Expense log with categories (ad_spend, salaries, subscriptions, office) and client attribution

### Team (Phase 6)
- `sops` — Standard Operating Procedures (id, title, category, steps JSONB, tools_required, estimated_minutes, created_by)
- `team_targets` — Daily/weekly targets per user (user_id, target_type, target_value)

### Build Tracker (Phase 1)
- `build_tracker_modules` — 36 modules across 3 systems with status tracking

---

## Complete Route Map

### Admin Routes
| Route | Description | Status |
|-------|-------------|--------|
| /admin | Command Hub — KPIs, Today's Priority, Pipeline Snapshot, Growth Snapshot, Build Progress | ✅ |
| /admin/build-tracker | 36-module build tracker with inline status editing | ✅ |
| /admin/clients | All clients list with health scores, filters, KPI cards | ✅ |
| /admin/clients/[id] | Client Profile — 7 tabs: Overview, Onboarding, Asset Vault, Projects, Finance, Strategy, Comms | ✅ |
| /admin/clients/renewals | Renewal countdown + upsell opportunities | ✅ |
| /admin/growth | Agency Growth Hub — Organic + Acquisition tabs | ✅ |
| /admin/growth/instagram | Instagram content calendar + KPIs | ✅ |
| /admin/growth/linkedin | LinkedIn content calendar + KPIs | ✅ |
| /admin/growth/facebook | Facebook content calendar + KPIs | ✅ |
| /admin/growth/gmb | GMB performance + optimization checklist | ✅ |
| /admin/growth/seo | SEO keyword tracker | ✅ |
| /admin/growth/acquisition | City overview (229 leads, 6 niches) | ✅ |
| /admin/growth/acquisition/[city] | Dynamic city+niche view | ✅ |
| /admin/strategy | Strategy Engine — 3-step: configure, API key, paste strategy | ✅ |
| /admin/strategy/review | Task review + inline editing + approve & save | ✅ |
| /admin/strategy/archive | All past strategy runs | ✅ |
| /admin/finance | Finance Dashboard — MRR, Revenue MTD, Outstanding, Expenses | ✅ |
| /admin/finance/invoices | Invoice Manager — create, PDF, track lifecycle | ✅ |
| /admin/finance/expenses | Expense Log — categorized, client-attributed | ✅ |
| /admin/finance/pnl | P&L View — 6-month profitability + margins | ✅ |
| /admin/team | Team Overview — member cards, daily targets | ✅ |
| /admin/team/sops | SOP Library — categorized, searchable, create/edit | ✅ |
| /admin/team/scorecards | Weekly Scorecards — per role with week selector | ✅ |
| /admin/marketing | Marketing module | ✅ |
| /admin/sales | Sales module | ✅ |
| /admin/financials | Financials | ✅ |
| /admin/reports | Reports | ✅ |

### Other Routes
| Route | Description |
|-------|-------------|
| /sales | Sales Intelligence Cockpit (Power dialer, AI Brain, Follow-ups) |
| /manager/performance | Manager performance view |
| /manager/pipeline | Niche kanban pipeline |
| /client/dashboard | Client portal |
| /telecaller/my-stats | Telecaller stats |
| /tasks | Task Board — all tasks, My Tasks, Completed |
| /projects | Project management |
| /strategist | Strategy pipeline |
| /lp/[niche]/[city] | VSL landing pages |

---

## Key Components

### Strategy Engine
- `components/admin/strategy/LLMKeyManager.tsx` — API key management (sessionStorage only)
- `components/admin/strategy/StrategyPastePanel.tsx` — LLM call + task extraction
- `components/admin/clients/tabs/StrategyTab.tsx` — Client strategy tab
- `components/admin/clients/tabs/StrategyGeneratorModal.tsx` — Client strategy modal
- **LLM**: Anthropic API directly, model: claude-sonnet-4-20250514
- **Endpoint**: https://api.anthropic.com/v1/messages
- **Key storage**: sessionStorage as ANTHROPIC_API_KEY (never in DB)

### Finance
- `components/admin/finance/InvoiceCreateModal.tsx` — Create invoice with line items + GST toggle
- `components/admin/finance/PDFGenerator.tsx` — @react-pdf/renderer invoice PDFs
- Invoice auto-numbering: FM-2026-XXX

### Client Profile Tabs
- Overview, Onboarding (21-item checklist), Asset Vault, Projects, Finance, Strategy, Comms

---

## Critical Supabase Notes

### RLS Policies Fixed
During build we fixed several broken RLS policies that referenced `public.users` (doesn't exist):
- Dropped: "Clients view own projects" on projects (old version using auth.users subquery)
- Dropped: "Clients view own milestones" on project_milestones
- Dropped: "Clients view own messages" on project_messages  
- Dropped: "Clients view own files" on project_files
- Kept: "Clients can view own projects" (new version using auth.jwt())

### Permissions Granted
```sql
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
```

### Tasks Table Notes
- `project_id` is NULLABLE (strategy tasks have no project)
- `status` enum includes: pending, not_started, in_progress, in_review, completed
- Strategy tasks have `section_tag` set (e.g. 'instagram', 'client_seo')
- Strategy tasks have `strategy_run_id` linking to strategy_runs

---

## Server-Side Supabase Client Pattern
**CRITICAL**: All server components MUST use cookie-based auth client, NOT the browser client.

```typescript
// CORRECT — use this in all server pages
import { createServerClientWithCookies } from '@/lib/supabase-server'
// OR check how app/admin/page.tsx imports it

// WRONG — never use this in server components
import { createClient } from '@/lib/supabase'
```

---

## AI Integration Points

### Strategy Engine (Anthropic)
- Client-side API call only (never server-side)
- Key from sessionStorage, never in DB
- System prompt extracts JSON tasks from strategy documents
- Saves to: strategy_runs + strategy_run_tasks + tasks tables

### Sales AI Brain (OpenRouter)
- File: `lib/openrouter.ts`
- Uses: `process.env.OPENROUTER_API_KEY` (env variable)
- Model: `mistralai/mistral-7b-instruct:free`
- Used for: call scripts, objection handling, daily briefs

---

## Known Issues / Tech Debt
1. **User display names**: All profiles show "New User" — need real names set
2. **App not deployed**: Running on localhost:3000 only, not on production URL
3. **No real client data**: Austin Dental Spa and OM SAI TRAVELS not fully set up in system
4. **project_status enum**: Has "active" value issue in some queries (projects fetch error on tasks page)
5. **2 Issues indicator** showing in bottom left of app — pre-existing, non-critical

---

## Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=           # For Sales AI Brain
# Anthropic key is NOT stored in env — entered by user in browser per session
```

---

## Build Tracker Progress (as of Phase 6 completion)
- **System 1 (Agency OS)**: All 18 modules = COMPLETE ✅
- **System 2 (Website Generation)**: 0/9 modules started
- **System 3 (Performance Marketing)**: 0/9 modules started
- **Total**: 18/36 modules complete

---

## Phase Build Files Location
All phase spec files at: `/mnt/user-data/outputs/fortunemarq_build/`
- `00_QUICK_REFERENCE.md`
- `00_MASTER_BUILD_PLAN.md`
- `PHASE_1_Command_Center_and_Build_Tracker.md`
- `PHASE_2_Client_Lifecycle.md`
- `PHASE_3_Agency_Growth.md`
- `PHASE_4_Strategy_to_Task_Engine.md`
- `PHASE_5_and_6_Finance_and_Team.md`

---

## Workflow Pattern with Antigravity
1. Give Antigravity phase file + context files
2. Antigravity confirms understanding (files, DB changes, assumptions)
3. Paste confirmation here for review
4. Confirm → Antigravity executes
5. Run SQL migrations in Supabase SQL Editor
6. Test in browser, fix bugs
7. Mark modules Done in Build Tracker

