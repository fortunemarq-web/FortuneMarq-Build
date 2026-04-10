-- Migration: Create Agency Marketing Tables
-- Description: Creates tables for content pieces, SEO keywords, organic traffic snapshots, ad campaigns, lead source attribution, and weekly briefs.

--- TABLE 1: content_pieces ---
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'reel', 'carousel', 'story', 'video', 'email', 'case_study', 'other')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'linkedin', 'website', 'youtube', 'facebook', 'whatsapp', 'multiple')),
  target_keyword TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'in_review', 'scheduled', 'published')),
  scheduled_date DATE,
  published_date DATE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  content_url TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  leads_attributed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 2: seo_keywords ---
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_url TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('low', 'medium', 'high')),
  last_checked_at TIMESTAMPTZ,
  notes TEXT,
  is_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 3: organic_traffic_snapshots ---
CREATE TABLE IF NOT EXISTS organic_traffic_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  organic_sessions INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  top_landing_page TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_analytics', 'google_search_console')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 4: ad_campaigns ---
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'linkedin', 'youtube', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  objective TEXT CHECK (objective IN ('lead_generation', 'brand_awareness', 'traffic', 'conversions', 'reach')),
  monthly_budget DECIMAL(12,2) DEFAULT 0,
  spend_mtd DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  external_campaign_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 5: lead_source_attribution ---
CREATE TABLE IF NOT EXISTS lead_source_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  ad_campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 6: marketing_weekly_briefs ---
CREATE TABLE IF NOT EXISTS marketing_weekly_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary_text TEXT,
  key_wins TEXT[],
  key_concerns TEXT[],
  recommended_action TEXT,
  organic_sessions_delta DECIMAL(5,2),
  paid_spend_delta DECIMAL(5,2),
  leads_delta DECIMAL(5,2),
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled_date ON content_pieces(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_is_tracking ON seo_keywords(is_tracking);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_organic_traffic_snapshots_date ON organic_traffic_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_lead_source_attribution_lead_id ON lead_source_attribution(lead_id);

-- ENABLE RLS
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE organic_traffic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_weekly_briefs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES Pattern: Same as other tables in the codebase
-- Admin has full access.
-- Others have SELECT only.

DO $$
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY['content_pieces', 'seo_keywords', 'organic_traffic_snapshots', 'ad_campaigns', 'lead_source_attribution', 'marketing_weekly_briefs'];
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Admin full access on ' || t || '" ON ' || t;
        EXECUTE 'CREATE POLICY "Admin full access on ' || t || '" ON ' || t || ' FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
        )';

        EXECUTE 'DROP POLICY IF EXISTS "All others select on ' || t || '" ON ' || t;
        EXECUTE 'CREATE POLICY "All others select on ' || t || '" ON ' || t || ' FOR SELECT USING (true)';
    END LOOP;
END $$;

-- UPDATE TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
