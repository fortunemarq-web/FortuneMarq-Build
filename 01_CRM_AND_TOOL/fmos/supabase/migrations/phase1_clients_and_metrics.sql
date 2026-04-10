-- ============================================================
-- Phase 1: Clients table extensions + Agency Growth Metrics table
-- ============================================================

-- Extend clients table with missing columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'churned', 'onboarding'));

-- ============================================================
-- Agency Growth Metrics table
-- Stores editable social/web metrics for FortuneMarq's own growth
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_growth_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  metric_label TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  last_month_value INTEGER DEFAULT 0,
  icon TEXT DEFAULT '📊',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agency_growth_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only - growth metrics" ON agency_growth_metrics;
CREATE POLICY "Admin only - growth metrics" ON agency_growth_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow read for all authenticated users (admins can see on dashboard)
DROP POLICY IF EXISTS "Authenticated read - growth metrics" ON agency_growth_metrics;
CREATE POLICY "Authenticated read - growth metrics" ON agency_growth_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed default metrics
INSERT INTO agency_growth_metrics (metric_key, metric_label, icon, current_value, last_month_value) VALUES
  ('instagram_followers', 'Instagram Followers', '📸', 0, 0),
  ('linkedin_followers', 'LinkedIn Followers', '💼', 0, 0),
  ('facebook_followers', 'Facebook Followers', '👥', 0, 0),
  ('gmb_views', 'GMB Views (MTD)', '🗺️', 0, 0),
  ('website_sessions', 'Website Sessions (MTD)', '🌐', 0, 0)
ON CONFLICT (metric_key) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_agency_growth_metrics_key ON agency_growth_metrics(metric_key);
