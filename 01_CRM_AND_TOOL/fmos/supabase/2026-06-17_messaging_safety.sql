-- 6.3 / 6.4 — messaging layer safety + observability.

-- Active-inbound-thread detection: stamp the last time the lead messaged US.
-- Proactive automated outbound (direct report, outcome) is suppressed while a
-- lead is inside the live customer window.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

-- Backfill from the most recent inbound message we already have on file.
UPDATE leads l
SET last_inbound_at = sub.last_in
FROM (
  SELECT lead_id, MAX(sent_at) AS last_in
  FROM whatsapp_logs
  WHERE direction = 'inbound' AND lead_id IS NOT NULL
  GROUP BY lead_id
) sub
WHERE sub.lead_id = l.id AND l.last_inbound_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_last_inbound ON leads (last_inbound_at);

-- Throttle/quality counters live in app_settings (key/value jsonb) — no schema needed:
--   whatsapp_daily_cap_alerted : { date: 'YYYY-MM-DD' }  (de-dupe the cap alert)
--   whatsapp_messaging_health  : { quality_rating, messaging_tier, checked_at }
