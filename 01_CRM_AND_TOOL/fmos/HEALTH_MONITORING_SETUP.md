# 6.8 Automation Health Monitoring — Setup

What this gives you: every scheduled cron records a heartbeat; a health check (runs every 15 min)
detects any cron that has **stopped** (stale) or is **failing**, surfaces it on **/admin/system-health**,
and WhatsApps you when something breaks. So automations can't die silently.

## What was built (code — already in the branch)
- `cron_heartbeats` table + `cron_heartbeat()` RPC.
- `lib/cron-heartbeat.ts` (`recordRun` + `withHeartbeat`) — wraps all 9 cron routes; **fail-open** (never affects a cron).
- `lib/cron-jobs.ts` — registry of watched jobs + staleness thresholds.
- `/api/cron/health` — the health check (stale jobs + last-run errors + `automation_runs` failures → alert + WhatsApp).
- `/admin/system-health` — status grid (added to the sidebar under **Tools**).
- `.github/workflows/cron.yml` — health check added to the every-15-min batch.

## Activation

### 1. Run the SQL (dashboard SQL editor) — ✅ DONE
`supabase/2026-06-23_cron_heartbeats.sql` (verified live: table + RPC present).

### 2. Alerts — already wired, nothing to configure
Failure alerts **reuse the existing admin-alert channel**: the Meta-approved **`admin_alert`** template
sent to every number in **`ADMIN_WHATSAPP_NUMBERS`** (which already includes the owner, 919353082656).
No new env, no new template, no Vercel change. To change who gets alerts, edit `ADMIN_WHATSAPP_NUMBERS`.
Alerts are deduped to at most once per 6h, and always appear on `/admin/system-health` regardless.

### 3. Go live in production
Merge `continue-on-mac` → `main` (deploys the new cron routes). The every-15-min GitHub Action then
pings `/api/cron/health` automatically. (Sends honor `WHATSAPP_SEND_MODE`; in `test` they route to
`WHATSAPP_TEST_RECIPIENTS`, which includes the owner.)

## How it reads (/admin/system-health)
- **Healthy** — checked in within ~2.5× its cadence, last run ok.
- **Stale** — was running, then stopped (usually the GitHub Action or its `FMOS_BASE_URL`/`CRON_SECRET` secrets broke). **→ alerts.**
- **Error** — last run threw / returned non-2xx. **→ alerts.**
- **Never run** — no heartbeat yet (first run pending). Shown for awareness, **does not alert** (avoids first-deploy false alarms).

Watched jobs: sla, followups, scheduled-messages, whatsapp-quality (15-min) · daily-digest, admin-alerts,
session-timeout, invoice-reminders, backup-export (daily). The health check also records its own heartbeat (`health`).
