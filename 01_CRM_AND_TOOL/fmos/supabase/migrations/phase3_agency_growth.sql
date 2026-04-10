-- ============================================================
-- PHASE 3 — Agency Growth
-- Run in Supabase SQL Editor after Phase 2 migrations
-- ============================================================

-- ── 1. Extend content_pieces table ──────────────────────────
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'instagram';
-- channel values: 'instagram', 'linkedin', 'facebook', 'gmb', 'blog'

CREATE INDEX IF NOT EXISTS idx_content_channel ON content_pieces(channel);

-- ── 2. Extend seo_keywords table ────────────────────────────
ALTER TABLE seo_keywords ADD COLUMN IF NOT EXISTS belongs_to TEXT DEFAULT 'agency';
-- values: 'agency' for FortuneMarq's own site, 'client:[client_id]' for clients

CREATE INDEX IF NOT EXISTS idx_seo_keywords_belongs_to ON seo_keywords(belongs_to);

-- ── 3. GMB Snapshots ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gmb_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_month DATE NOT NULL, -- first day of month
  profile_views INTEGER DEFAULT 0,
  direction_requests INTEGER DEFAULT 0,
  calls INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  photo_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_month)
);

ALTER TABLE gmb_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access gmb_snapshots" ON gmb_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. GMB Checklist Items ──────────────────────────────────
CREATE TABLE IF NOT EXISTS gmb_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gmb_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access gmb_checklist" ON gmb_checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed GMB Checklist
INSERT INTO gmb_checklist_items (item_text, sort_order) VALUES
('Business name matches exact legal name', 1),
('Primary category set correctly', 2),
('3 secondary categories added', 3),
('Business description written (750 chars)', 4),
('All services listed with descriptions', 5),
('All photos added (exterior, interior, logo, cover)', 6),
('Business hours set (including special hours)', 7),
('Q&A section populated with 5+ FAQs', 8),
('Posts going out at least twice per week', 9),
('Responding to all reviews within 24 hours', 10);

-- ── 5. Review Requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  requested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT, -- 'whatsapp', 'email', 'in_person'
  review_received BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access review_requests" ON review_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 6. SEO Pages Tracker ────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  url TEXT NOT NULL,
  target_keyword TEXT,
  current_ranking INTEGER,
  status TEXT CHECK (status IN ('not_created', 'exists_not_optimized', 'optimized', 'ranking')),
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access seo_pages" ON seo_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed initial FortuneMarq pages
INSERT INTO seo_pages (page_name, url, status) VALUES
('Homepage', '/', 'exists_not_optimized'),
('Services - SEO', '/services/seo', 'not_created'),
('Services - Meta Ads', '/services/facebook-ads', 'not_created'),
('Services - Web Design', '/services/web-design', 'not_created');

-- ── 7. Backlinks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_domain TEXT NOT NULL,
  source_url TEXT,
  target_url TEXT,
  anchor_text TEXT,
  acquired_date DATE,
  domain_authority INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access backlinks" ON backlinks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 8. Acquisition Targets ──────────────────────────────────
CREATE TABLE IF NOT EXISTS acquisition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  city_slug TEXT NOT NULL, -- url-safe
  niche TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  next_actions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_slug, niche)
);

ALTER TABLE acquisition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access acquisition_targets" ON acquisition_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed acquisition targets
INSERT INTO acquisition_targets (city, city_slug, niche) VALUES
('Hubli', 'hubli', 'Dental Clinics'),
('Hubli', 'hubli', 'Gyms & Fitness Centers'),
('Hubli', 'hubli', 'Restaurants & Cafes'),
('Hubli', 'hubli', 'Real Estate Agents'),
('Hubli', 'hubli', 'Coaching Institutes'),
('Hubli', 'hubli', 'Salons & Spas')
ON CONFLICT (city_slug, niche) DO NOTHING;
