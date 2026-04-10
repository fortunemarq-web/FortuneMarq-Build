-- ============================================================
-- PHASE 2 — Client Lifecycle Completion
-- Run in Supabase SQL Editor after all Phase 1 migrations
-- ============================================================

-- ── 1. Extend clients table ─────────────────────────────────
-- monthly_value and status already added in phase1_clients_and_metrics.sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS niche TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 3;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_upsell_attempt DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint for health_score range (safe: skips if exists)
DO $$ BEGIN
  ALTER TABLE clients ADD CONSTRAINT chk_health_score CHECK (health_score BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_renewal ON clients(renewal_date);
CREATE INDEX IF NOT EXISTS idx_clients_health ON clients(health_score);

-- ── 2. Extend projects table ────────────────────────────────
-- client_id already exists (confirmed in projects/page.tsx)
-- build_type already exists (added via add_build_type_to_projects.sql)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'website_build';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivery_stage TEXT DEFAULT 'brief';

-- delivery_stage values: 'brief', 'design', 'development', 'review', 'live', 'handed_over'
CREATE INDEX IF NOT EXISTS idx_projects_delivery_stage ON projects(delivery_stage);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ── 3. Onboarding Checklists ────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_client ON onboarding_checklists(client_id, sort_order);

ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and PM access onboarding" ON onboarding_checklists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

-- ── 4. Client Assets (Vault) ────────────────────────────────
CREATE TABLE IF NOT EXISTS client_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('credentials', 'brand_assets', 'links')),
  label TEXT NOT NULL,
  -- For credentials:
  username TEXT,
  -- Passwords stored plaintext — admin-only RLS enforced.
  -- Upgrade to pgp_sym_encrypt in future security pass.
  password_encrypted TEXT,
  url TEXT,
  -- For brand assets (files):
  file_url TEXT,
  file_type TEXT,
  -- For important links:
  link_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_assets_client ON client_assets(client_id, category);

ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access assets" ON client_assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. Client Call Logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id),
  call_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  outcome TEXT CHECK (outcome IN ('productive', 'no_answer', 'rescheduled', 'complaint', 'feedback')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_client ON client_call_logs(client_id, call_date DESC);

ALTER TABLE client_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and PM access call logs" ON client_call_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

-- ── 6. Project QA Items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_qa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_items_project ON project_qa_items(project_id, sort_order);

ALTER TABLE project_qa_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin and PM access QA items" ON project_qa_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
  );

-- ── 7. Renewal Alerts View ──────────────────────────────────
CREATE OR REPLACE VIEW renewal_alerts AS
SELECT *,
  (renewal_date - CURRENT_DATE) AS days_until_renewal
FROM clients
WHERE status = 'active'
  AND renewal_date IS NOT NULL
  AND renewal_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY renewal_date ASC;

-- ── 8. Function: Auto-populate onboarding checklist ─────────
CREATE OR REPLACE FUNCTION create_default_onboarding(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO onboarding_checklists (client_id, category, item_text, sort_order) VALUES
  -- Access & Credentials
  (p_client_id, 'Access & Credentials', 'Google My Business access granted', 1),
  (p_client_id, 'Access & Credentials', 'Google Ads account access granted (if applicable)', 2),
  (p_client_id, 'Access & Credentials', 'Meta Business Manager access granted (if applicable)', 3),
  (p_client_id, 'Access & Credentials', 'Website hosting/cPanel login received', 4),
  (p_client_id, 'Access & Credentials', 'Domain registrar login received', 5),
  (p_client_id, 'Access & Credentials', 'Google Analytics access granted', 6),
  -- Brand Assets
  (p_client_id, 'Brand Assets', 'Logo file received (PNG transparent + SVG)', 7),
  (p_client_id, 'Brand Assets', 'Brand colors confirmed (hex codes)', 8),
  (p_client_id, 'Brand Assets', 'Brand fonts confirmed', 9),
  (p_client_id, 'Brand Assets', 'Existing photos/images received', 10),
  -- Business Information
  (p_client_id, 'Business Information', 'Business description written (50-100 words)', 11),
  (p_client_id, 'Business Information', 'Services list with prices confirmed', 12),
  (p_client_id, 'Business Information', 'Target area/city confirmed', 13),
  (p_client_id, 'Business Information', 'Business hours confirmed', 14),
  (p_client_id, 'Business Information', 'USPs (3-5 points) confirmed', 15),
  -- Content & Copy
  (p_client_id, 'Content & Copy', 'Homepage copy approved', 16),
  (p_client_id, 'Content & Copy', 'Services page copy approved', 17),
  (p_client_id, 'Content & Copy', 'About Us copy approved', 18),
  -- Technical
  (p_client_id, 'Technical', 'Client WhatsApp number confirmed for contact button', 19),
  (p_client_id, 'Technical', 'Preferred contact form email confirmed', 20),
  (p_client_id, 'Technical', 'Analytics tracking code installed (verify)', 21);
END;
$$ LANGUAGE plpgsql;

-- ── 9. Function: Auto-populate QA checklist for website builds
CREATE OR REPLACE FUNCTION create_default_qa_checklist(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO project_qa_items (project_id, item_text, sort_order) VALUES
  (p_project_id, 'All pages load without errors', 1),
  (p_project_id, 'Mobile responsive — tested on iPhone and Android', 2),
  (p_project_id, 'Contact form submits and receives email', 3),
  (p_project_id, 'WhatsApp click-to-chat button works', 4),
  (p_project_id, 'Google Maps embed showing correct location', 5),
  (p_project_id, 'All images optimized (< 200kb each)', 6),
  (p_project_id, 'Meta title and description set on all pages', 7),
  (p_project_id, 'Google Analytics tracking code installed', 8),
  (p_project_id, 'GMB website URL updated to new website', 9),
  (p_project_id, 'Page speed score > 80 (test on PageSpeed Insights)', 10),
  (p_project_id, 'SSL certificate active (https://)', 11),
  (p_project_id, '404 page exists', 12);
END;
$$ LANGUAGE plpgsql;
