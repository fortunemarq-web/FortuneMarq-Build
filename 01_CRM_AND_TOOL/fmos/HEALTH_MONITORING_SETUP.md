# 6.8 Automation Health Monitoring — Setup

What this gives you: every scheduled cron records a heartbeat; a health check (runs every 15 min)
detects any cron that has **stopped** or is **failing**, surfaces it on **/admin/system-health**, and
WhatsApps you when something breaks. So automations can't die silently.

## What was built (code — already in the branch)
- `cron_heartbeats` table + `cron_heartbeat()` RPC (SQL below).
- `lib/cron-heartbeat.ts` (`recordRun` + `withHeartbeat`) — wraps all 9 cron routes; **fail-open** (never affects a cron).
- `lib/cron-jobs.ts` — registry of watched jobs + staleness thresholds.
- `/api/cron/health` — the health check (stale jobs + last-run errors + automation_runs failures → alert + WhatsApp).
- `/admin/system-health` — status grid (added to the sidebar under **Tools**).
- `.github/workflows/cron.yml` — health check added to the every-15-min batch.

## Owner steps to activate (3)

### 1. Run the SQL (dashboard SQL editor)
Run `supabase/2026-06-23_cron_heartbeats.sql` in the Supabase dashboard (project `cnwooodktqwvpzkucskm`).
Idempotent and additive — safe to re-run.

### 2. Set the owner number env
Add to `.env.local` **and** Vercel (Project → Settings → Environment Variables):
```
OWNER_WHATSAPP=9193530XXXXX   # your WhatsApp number, country code, no +
```
Until this is set, alerts still appear on `/admin/system-health` — only the WhatsApp push is skipped.

### 3. Submit the WhatsApp template (Meta)
Failure alerts to your phone are sent outside any 24h window, so Meta needs an approved **utility** template.
Submit this in WhatsApp Manager → Message Templates:

- **Name:** `system_health_alert`
- **Category:** Utility
- **Language:** English
- **Body:**
  ```
  FMOS health alert: {{1}}. Open the System Health dashboard to investigate.
  ```
- **Sample for {{1}}:** `daily-digest stale 1500m · sla error HTTP 500`
- Buttons: none.

Once approved, the health check sends it automatically (deduped: at most once per 6h). No code change needed.

## How it reads
- **Healthy** — checked in within ~2.5× its cadence, last run ok.
- **Stale** — stopped checking in (usually the GitHub Action or its `FMOS_BASE_URL`/`CRON_SECRET` secrets broke).
- **Error** — last run threw / returned non-2xx.
- **Never run** — no heartbeat yet (first run pending, or the SQL above hasn't been applied).

Watched jobs: sla, followups, scheduled-messages, whatsapp-quality (15-min) · daily-digest, admin-alerts,
session-timeout, invoice-reminders (daily). The health check also records its own heartbeat (`health`).
