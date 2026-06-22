# Command Center + Safety Nets — Build Spec (6.5 / 6.8 / 6.9)

Status: PROPOSED (awaiting owner approval). Branch `continue-on-mac`. Scoped to `01_CRM_AND_TOOL/fmos`.
Goal: harden the live system — know instantly when something breaks, see the whole business on one screen, and never lose the data.

Build order: **6.8 (health) → 6.5 (funnel) → 6.9 (backups)** — each shippable on its own, verified before the next.

---

## 6.8 — Automation Health Monitoring  (build first — biggest safety gap)
Right now if a cron stops firing (GitHub Action breaks, secret rotates, route 500s) nothing tells anyone.

**DB (one new table):** `cron_heartbeats` — one row per job: `job_name (pk), last_run_at, last_status (ok|error), last_error, last_duration_ms, run_count`. SQL in `supabase/2026-06-23_cron_heartbeats.sql`.

**Heartbeat helper:** `lib/cron-heartbeat.ts → recordRun(job, status, error?, ms?)` (upsert, fail-open). Wrap all 9 existing cron routes to call it at start/finish — additive, never changes their behaviour.

**Health-check cron:** `/api/cron/health` (added to the existing every-15-min GitHub schedule). For each expected job, compares `last_run_at` vs its expected interval → flags **stale**; also counts recent `automation_runs` with `status='error'` and checks WhatsApp webhook last-seen + bot errors. Any unhealthy → writes an alert (existing alerts table) + **WhatsApp alert to the owner** (see note).

**Status view:** `/admin/operations` (extend) — a health grid: each job green/red, last run, last error; recent automation failures; webhook/bot last-seen. Auto-refresh.

**Owner WhatsApp alert note:** messaging the owner outside a 24h window needs an approved **utility template** (e.g. `system_health_alert`). I'll build the alert path + in-app/status-view now and gate the WhatsApp send behind that template; if it's not approved yet, alerts still land in `/admin/operations` + the alerts feed (and we can submit the template). Owner number from a new `OWNER_WHATSAPP` env (fallback to the existing alert number).

## 6.5 — Master Funnel Dashboard (Command Center)
**New:** `/admin/command` (or a section on `/admin`) — one cross-engine funnel:
`leads → contacted → engaged(replied/bot) → meetings → proposals → won → active clients → MRR`,
each with count + conversion %, segmented by **source/engine** (outbound vs inbound vs campaign). Plus **MRR + revenue roll-up** (sum `clients.monthly_value` for active; this month's invoiced/collected) and delivery load.
Reuses `lib/pipeline.ts` stages + existing finance queries. Server component, parallel queries.
**Founder daily digest:** verify/extend the existing `lib/reports/dailyReport.ts` so the funnel snapshot + MRR go out in the daily founder summary.

## 6.9 — Backups / Data Export
**Backup cron:** `/api/cron/backup-export` (daily) — exports key tables (`leads, clients, invoices, proposals, market_insights, activity_events`) to CSV/JSON into a private Supabase Storage bucket `backups/` with date-stamped filenames; keep last 30, prune older.
**Admin:** a "Download latest export" action on `/admin/data-management`.
**Doc:** `BACKUP_RESTORE.md` — what's backed up, where, retention, and a step-by-step restore procedure (incl. Supabase's own PITR if on Pro).

---

## Conventions / constraints
- Cron routes: `verifyCronSecret` + `createAdminClient` only (existing pattern). All heartbeat/health writes fail-open — monitoring must never break a working cron.
- New SQL delivered as `supabase/2026-06-23_*.sql` to run in the dashboard SQL editor (current workflow), unless owner prefers I apply via the Supabase MCP.
- `tsc=0` + `npm run build` green before each commit. No merge to `main` without owner approval.
- Additive only — no changes to existing cron behaviour, lead-stage writes via `lib/pipeline.ts`.

## Open decisions for owner
1. Build order ok (6.8 → 6.5 → 6.9)?
2. New SQL: run via **dashboard** (I hand you files) or **I apply via Supabase MCP**?
3. 6.8 owner alerts: WhatsApp (needs a utility template approved) vs in-app/status-view-only for now?
