# FortuneMarq Agency OS — Claude Context File
# This file is auto-loaded at the start of every Claude Code session.

## What This Project Is
FMOS = FortuneMarq Agency OS. A Next.js 16 + TypeScript + Supabase CRM built for a digital marketing agency in Hubli, Karnataka. Sole builder is the agency owner (FortuneMarq).

**App path:** `/Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos`
**Stack:** Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase | Framer Motion | Lucide React | Recharts
**Version:** v4.5
**Supabase project:** `cnwooodktqwvpzkucskm.supabase.co`

---

## HOW WE WORK — READ THIS FIRST

1. **No code without a prompt file.** Any dev task → create a `.md` spec file in the fmos root → user reviews → Antigravity (separate AI) implements it.
2. **Writing prompts for Antigravity** is a primary task. Prompts must be self-contained with file paths, line numbers, exact code blocks, summary table, and a Rules section.
3. **After any work session**, update `documentation/SALES.md`, `00_MASTER_BUILD_PLAN.md`, `00_QUICK_REFERENCE.md`, and memory files.
4. **No AI API calls** in the sales cockpit — pitch engine is local only.
5. **Short, direct responses.** No filler. No emojis unless asked.

---

## CURRENT BUILD STATUS (v4.5) — Updated 2026-03-25

### ✅ Type Safety — COMPLETE (2026-03-25)
- `database.types.ts` regenerated via Supabase CLI — all 30+ tables now typed
- All 176 `(supabase as any)` global casts removed across 72 files
- Auth client standardized — all 14 page.tsx files now use `createServerClientWithCookies()`
- Build: clean `npx tsc --noEmit` + `npm run build`

### ✅ Sales Cockpit — COMPLETE
- 858 Hubli outbound leads imported (11 niches, all `lead_type = "outbound"`)
- `serp_ranked`, `serp_source`, `tags[]` columns live in Supabase
- Niche filter, City filter, Has Website / No Website toggle in top bar
- Calling card: auto-tags + SERP tags + manual tags + GMB Profile / Google Search button
- Follow-up tab: reconnect script, last contacted badge, notes reminder, last outcome badge
- Follow-up sidebar: priority sort (overdue→today→upcoming), niche/city filters

### ✅ Outreach Sales System — COMPLETE
- `/sales/outreach` — 7-stage Kanban (Touch 1 → PDF → Follow-up → Meeting → Proposal → Won/Lost)
- AdvanceStageModal adapts per stage, all transitions logged to `activity_events`
- 8 DB tables: `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`, `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`

### ✅ Phase 1 — Admin Dashboard + Build Tracker — COMPLETE
- `/admin` — KPI bar, Priority List, Pipeline Snapshot, Quick Actions, Agency Growth Card, Build Progress
- `/admin/build-tracker` — 3 systems, 35+ modules, inline status/notes updates, Framer Motion progress bars

### ✅ Phase 2 — Client Lifecycle — COMPLETE
- `/admin/clients` — full client list, health scores (5-dimension), MRR, service pills, upsell engine
- `/admin/clients/[id]` — 6-tab profile: Overview, Onboarding, Asset Vault, Projects, Finance, Strategy
- `/admin/clients/renewals` — renewal countdown + upsell opportunity tracker

### ✅ Phase 3 — Agency Growth — COMPLETE
- `/admin/growth` — organic + acquisition hub
- `/admin/growth/instagram`, `/linkedin`, `/facebook` — content calendar + kanban
- `/admin/growth/gmb` — performance metrics, posts calendar, optimization checklist, review tracker
- `/admin/growth/seo` — keyword tracker, pages tracker, traffic log
- `/admin/growth/acquisition/[city]` — per-city niche accordion with full acquisition breakdown

### ✅ Phase 4 — Strategy-to-Task Engine — COMPLETE
- `/admin/strategy` — paste strategy → configure destination → LLM generates tasks
- `/admin/strategy/archive` — past strategy runs
- `/admin/strategy/review` — review generated tasks before committing

### ✅ Phase 5 — Finance Module — COMPLETE
- `/admin/finance` — revenue dashboard, P&L, recent invoices
- `/admin/finance/invoices` — invoice manager with PDF generation
- `/admin/finance/expenses` — expense log with categories
- `/admin/finance/pnl` — P&L statement view

### ✅ Phase 6 — Team Management — COMPLETE (2026-03-25)
- `/admin/team` — member cards, aggregate stats, "Assign Task" modal, "Set Targets" modal wired up
- `/admin/team/sops` — SOP library with working search + category filters
- `/admin/team/sops/new` — SOP creation page (was missing, now built)
- `/admin/team/sops/[id]` — SOP edit/view page verified
- `/admin/team/scorecards` — weekly performance scorecards by role

### ✅ Strategist Dashboard — COMPLETE (2026-03-25)
- `/strategist` — full 6-stage Kanban pipeline (Qualified → Contract Signed)
- Close Deal modal: creates client + logs deal + provisions one project per service + updates lead status
- Dashboard View: Needs Proposal list, Needs Contract list, Loss Reason tally
- Amber highlight for today's follow-ups
- `/strategist/deals` — deals management list

---

## KEY FILES TO KNOW

| File | Purpose |
|---|---|
| `components/sales/sales-intelligence-cockpit.tsx` | Main sales cockpit (dialer, tags, filters, scripts) |
| `components/sales/follow-up-list.tsx` | Follow-up sidebar panel |
| `components/strategist/strategist-pipeline.tsx` | Strategist Kanban pipeline |
| `components/strategist/close-deal-modal.tsx` | Close Deal → creates client + deal + projects |
| `app/strategist/page.tsx` | Strategist dashboard server component |
| `app/sales/page.tsx` | Server component — fetches leads for cockpit |
| `app/admin/team/actions.ts` | Team server actions: upsertTeamTargets, createAssignedTask, createSop |
| `scripts/import_hubli_leads.py` | Bulk Hubli lead importer (deletes + re-imports) |
| `actions/upload-leads.ts` | Server action for CSV uploads |
| `types/database.types.ts` | All Supabase type definitions (REGENERATED — all 30+ tables) |
| `supabase/migrations/` | All SQL migration files |
| `lib/supabase-server.ts` | Server client WITH cookies — use for all page.tsx files |
| `lib/supabase.ts` | Browser client — use for client components only |
| `documentation/ADMIN.md` | Admin dashboard feature spec |
| `documentation/STRATEGY.md` | Strategist dashboard feature spec |
| `documentation/PROJECT_MANAGER.md` | PM dashboard feature spec |
| `documentation/STAFF.md` | Staff dashboard feature spec |
| `APPLICATION_DOCUMENTATION.md` | Full app documentation v4.1 |
| `00_MASTER_BUILD_PLAN.md` | Master plan + all phases |

---

## LEADS TABLE — KEY COLUMNS
```
id, company_name, phone, industry (niche), city, status, lead_type
has_website (bool), website_link, gmb_link
serp_ranked (bool), serp_source, tags (text[])
last_contacted_at, last_outcome, next_action_date, attempts, notes
```

## CSV UPLOAD FORMAT SUPPORTED
```
Business Name | Phone | Has Website (Y/N) | Website Link | Google Maps Link
SERP_Ranked (Y/N) | SERP_Source | Niche | City
```

---

## LAST SESSION LOG
See `last_session.md` for the most recent session summary.
