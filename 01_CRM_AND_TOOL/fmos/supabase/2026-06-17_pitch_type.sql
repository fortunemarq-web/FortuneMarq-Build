-- ============================================================
-- 2026-06-17 · pitch_type + is_low_volume on leads
-- ============================================================
-- pitch_type (A/B/C/D) is the deterministic outreach-angle field.
-- Separate from lead_type (outbound/inbound = source axis).
--
-- Assignment order: D → A → B → C
--   D = niche×city monthly search volume < 1,000  (set by the
--       1.3 keyword-ingest step when it writes market_insights)
--   A = serp_ranked = true
--   B = has_website = true, not ranked
--   C = everything else (GMB only / no web presence)
--
-- This migration:
--   1. Adds pitch_type + is_low_volume columns.
--   2. Back-fills A/B/C from current serp_ranked / has_website data.
--      D is NOT set here — it requires market_insights volume data
--      (populated in task 1.3). The 1.3 ingest will:
--        UPDATE leads SET is_low_volume = true, pitch_type = 'D'
--        WHERE industry = <niche> AND city = <city>
--        AND (market_insights.general_insights->>'monthlySearchDemand')::int < 1000
-- ============================================================

-- 1. Add columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pitch_type    TEXT CHECK (pitch_type IN ('A','B','C','D')),
  ADD COLUMN IF NOT EXISTS is_low_volume BOOLEAN NOT NULL DEFAULT false;

-- 2. Back-fill A/B/C for all existing leads (idempotent: only touches NULL rows)
UPDATE leads
SET pitch_type = CASE
  WHEN serp_ranked = true THEN 'A'
  WHEN has_website = true THEN 'B'
  ELSE                         'C'
END
WHERE pitch_type IS NULL;

-- 3. Index for fast type-filtered queries (outreach dashboard, direct-report send)
CREATE INDEX IF NOT EXISTS leads_pitch_type_idx ON leads (pitch_type);
CREATE INDEX IF NOT EXISTS leads_is_low_volume_idx ON leads (is_low_volume) WHERE is_low_volume = true;
