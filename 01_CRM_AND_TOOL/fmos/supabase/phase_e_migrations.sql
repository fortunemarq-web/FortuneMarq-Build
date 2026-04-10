-- ════════════════════════════════════════════════════════════
-- FMOS Phase E — Finance, Forecast, Retainer Package System
-- Run ONCE in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════

-- E1: revenue_type on invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revenue_type TEXT DEFAULT 'mrr'
  CHECK (revenue_type IN ('mrr', 'setup_fee', 'one_time'));

-- E3: Retainer package columns on clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_tier TEXT
  CHECK (package_tier IN ('starter','growth','pro','custom'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services_active JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_eligible BOOLEAN DEFAULT FALSE;

-- Backfill: existing invoices without revenue_type default to 'mrr'
UPDATE invoices SET revenue_type = 'mrr' WHERE revenue_type IS NULL;
