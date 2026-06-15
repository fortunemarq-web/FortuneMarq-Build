-- ============================================================================
-- FMOS — Pre-middleware schema verification + safety batch
-- Date: 2026-06-15
-- ============================================================================
-- WHY: We froze the schema until "no pending SQL" so we can finally build
-- middleware.ts without it breaking again. The generated types
-- (types/database.types.ts) already show every column + table the code uses,
-- which means the 2026-06-12 full sync already covered them and NOTHING is
-- pending. This script lets you confirm that with certainty.
--
-- HOW TO USE (Supabase dashboard → SQL editor → new query → paste → Run):
--   STEP 1 — run the two SELECTs in PART A.
--            If BOTH return zero rows → schema is fully in sync → freeze ends.
--   STEP 2 — only if PART A lists any missing leads columns, run PART B.
--            PART B is idempotent (IF NOT EXISTS) and harmless either way.
-- ============================================================================


-- ============================================================================
-- PART A — VERIFY (read-only). Lists anything the code expects that is MISSING.
-- ============================================================================

-- A1. Required `leads` columns
WITH required_cols(col) AS (VALUES
  ('meeting_link'), ('meeting_notes'), ('last_contacted_at'), ('first_contact_at'),
  ('last_activity_at'), ('meeting_booked_at'), ('next_action_date'), ('stale_flag'),
  ('no_answer_count'), ('gatekeeper_count'), ('assigned_sales_exec'), ('source'),
  ('lead_source'), ('captured_at'), ('serp_ranked'), ('has_website'), ('outreach_stage')
)
SELECT rc.col AS missing_leads_column
FROM required_cols rc
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = 'leads' AND c.column_name = rc.col
WHERE c.column_name IS NULL;

-- A2. Required tables
WITH required_tables(tbl) AS (VALUES
  ('leads'), ('outreach_logs'), ('proposals'), ('agreements'), ('clients'),
  ('client_packages'), ('client_deliverables'), ('client_onboarding_tasks'),
  ('client_asset_vault'), ('projects'), ('project_milestones'), ('invoices'),
  ('content_pieces'), ('ad_campaigns'), ('ad_insights_daily'), ('strategy_runs'),
  ('strategy_run_tasks'), ('automation_rules'), ('automation_runs'), ('automation_throttle'),
  ('inbound_events'), ('acquisition_targets'), ('gmb_snapshots'),
  ('marketing_weekly_briefs'), ('organic_traffic_snapshots'), ('profiles')
)
SELECT rt.tbl AS missing_table
FROM required_tables rt
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = rt.tbl
WHERE t.table_name IS NULL;

-- EXPECTED RESULT: both queries return 0 rows.


-- ============================================================================
-- PART B — SAFETY BATCH (idempotent). Only needed if A1 listed missing columns.
-- Safe to run regardless: ADD COLUMN IF NOT EXISTS is a no-op when present.
-- ============================================================================

-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_link      text;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_notes     text;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_contact_at  timestamptz;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at  timestamptz;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_booked_at timestamptz;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_date  timestamptz;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stale_flag        boolean DEFAULT false;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS no_answer_count   integer DEFAULT 0;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gatekeeper_count  integer DEFAULT 0;

-- (Uncomment the lines above only if PART A reported them missing.)
