-- Team Management Module (Phase 6)

-- 1. SOP Library
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Sales & Outreach', 'Website Delivery', 'Client Onboarding', 'Monthly Reporting', 'Social Media', 'Finance'
  steps JSONB NOT NULL, -- [{"step_number": 1, "instruction": "..."}]
  tools_required TEXT,
  estimated_minutes INTEGER,
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for categories
CREATE INDEX IF NOT EXISTS idx_sops_category ON sops(category);

-- RLS for SOPs
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access sops" ON sops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- All authenticated users can Read
CREATE POLICY "All authenticated users can view sops" ON sops
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. Team Daily Targets
CREATE TABLE IF NOT EXISTS team_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- 'calls', 'tasks', 'sites', 'demos', 'revenue'
  target_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type)
);

-- RLS for team_targets
ALTER TABLE team_targets ENABLE ROW LEVEL SECURITY;

-- Admins can manage all targets
CREATE POLICY "Admins manage all targets" ON team_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can read their own targets
CREATE POLICY "Users view own targets" ON team_targets
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Trigger for updated_at on sops
CREATE OR REPLACE FUNCTION update_sops_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sops_updated_at ON sops;
CREATE TRIGGER update_sops_updated_at
    BEFORE UPDATE ON sops
    FOR EACH ROW EXECUTE PROCEDURE update_sops_modtime();
