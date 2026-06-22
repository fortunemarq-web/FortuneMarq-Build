# 6.9 Backups & Restore

Two layers of protection for the data the whole company runs on:

1. **Supabase PITR (platform)** — point-in-time recovery of the *entire* database (all tables,
   including audit/activity). This is the primary restore path. Available on Supabase Pro;
   manage retention in Dashboard → Database → Backups.
2. **App-level snapshots (this feature)** — a daily JSON export of the **core business tables**
   (`leads, clients, invoices, proposals, market_insights, profiles`) to the private `backups`
   Storage bucket. A lean, portable safety net you fully control and can download anytime.

## Setup (one-time)
1. Run `supabase/2026-06-23_backups_bucket.sql` in the dashboard (creates the private `backups` bucket).
2. That's it — the daily cron (`/api/cron/backup-export`, in the daily GitHub Actions batch) starts
   snapshotting. Or open **/admin/backups → Run backup now** to create the first snapshot immediately.

## What a snapshot contains
One file per day: `fmos-backup-YYYY-MM-DD.json`:
```json
{ "generated_at": "...", "retention_days": 30, "counts": { "leads": 7960, ... },
  "tables": { "leads": [ ...rows... ], "clients": [...], "invoices": [...],
              "proposals": [...], "market_insights": [...], "profiles": [...] } }
```
Snapshots older than 30 days are pruned automatically. `activity_events`/audit logs are **not**
in the JSON (large; covered by PITR).

## Restore
**Preferred — full DB:** use Supabase PITR (Dashboard → Database → Backups → restore to a timestamp).

**Targeted — from a JSON snapshot** (e.g. recover an accidentally-deleted set of leads):
1. Download the snapshot from **/admin/backups** (signed link, 1h validity).
2. Inspect `tables.<name>` for the rows you need.
3. Re-insert via the dashboard SQL editor or `/admin/bulk-import` (leads), e.g.:
   ```sql
   -- example: re-insert specific leads from the snapshot (paste the JSON array)
   insert into leads (...columns...)
   select * from json_populate_recordset(null::leads, '<paste tables.leads JSON here>')
   on conflict (id) do nothing;
   ```
4. Verify counts on **/admin/command** (the funnel) and spot-check the restored records.

## Monitoring
The backup cron reports a heartbeat (`backup-export`) to **/admin/system-health**, so a failed or
stopped backup shows up there (and triggers the health alert) like any other automation.
