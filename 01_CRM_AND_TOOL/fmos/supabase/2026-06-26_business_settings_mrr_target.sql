-- Configurable monthly MRR target for the Revenue Forecast widget (Phase E).
-- 0 = no target set (the forecast's target/progress UI stays dormant — e.g. build month).
-- Set this to 50000 when the ₹50K MRR goal goes live (Q3).

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS mrr_target numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN business_settings.mrr_target IS
  'Monthly MRR target in rupees. 0 = no target set (forecast target UI hidden).';
