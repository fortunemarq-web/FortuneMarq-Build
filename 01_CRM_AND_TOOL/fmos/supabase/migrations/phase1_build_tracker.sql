-- ============================================================
-- Phase 1: Build Tracker Module
-- Creates the build_tracker_modules table with RLS + seed data
-- ============================================================

CREATE TABLE IF NOT EXISTS build_tracker_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id INTEGER NOT NULL CHECK (system_id IN (1, 2, 3)),
  system_name TEXT NOT NULL,
  module_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE build_tracker_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only - build tracker" ON build_tracker_modules;
CREATE POLICY "Admin only - build tracker" ON build_tracker_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for faster ordering
CREATE INDEX IF NOT EXISTS idx_build_tracker_system ON build_tracker_modules(system_id, sort_order);

-- ============================================================
-- SEED DATA — System 1: Agency OS
-- ============================================================
INSERT INTO build_tracker_modules (system_id, system_name, module_name, status, priority, sort_order) VALUES
  (1, 'Agency OS', 'Admin Dashboard Enhancement', 'done', 'high', 1),
  (1, 'Agency OS', 'Build Tracker (this page)', 'done', 'high', 2),
  (1, 'Agency OS', 'Client Management — All Clients List', 'not_started', 'high', 3),
  (1, 'Agency OS', 'Client Management — Client Profile Page', 'not_started', 'high', 4),
  (1, 'Agency OS', 'Client Management — Onboarding Tracker', 'not_started', 'high', 5),
  (1, 'Agency OS', 'Client Management — Asset Vault', 'not_started', 'medium', 6),
  (1, 'Agency OS', 'Client Management — Renewal & Upsell Tracker', 'not_started', 'medium', 7),
  (1, 'Agency OS', 'Project Delivery — Project Board', 'not_started', 'high', 8),
  (1, 'Agency OS', 'Project Delivery — Project Detail Page', 'not_started', 'high', 9),
  (1, 'Agency OS', 'Project Delivery — QA Checklist', 'not_started', 'medium', 10),
  (1, 'Agency OS', 'Finance — Revenue Dashboard', 'not_started', 'medium', 11),
  (1, 'Agency OS', 'Finance — Invoice Manager', 'not_started', 'medium', 12),
  (1, 'Agency OS', 'Finance — Expense Log', 'not_started', 'low', 13),
  (1, 'Agency OS', 'Finance — P&L View', 'not_started', 'low', 14),
  (1, 'Agency OS', 'Agency Growth — Organic Dashboard', 'not_started', 'high', 15),
  (1, 'Agency OS', 'Agency Growth — Instagram Tracker', 'not_started', 'high', 16),
  (1, 'Agency OS', 'Agency Growth — GMB Manager', 'not_started', 'high', 17),
  (1, 'Agency OS', 'Agency Growth — LinkedIn Tracker', 'not_started', 'medium', 18),
  (1, 'Agency OS', 'Agency Growth — Facebook Tracker', 'not_started', 'medium', 19),
  (1, 'Agency OS', 'Agency Growth — Website & SEO', 'not_started', 'high', 20),
  (1, 'Agency OS', 'Agency Growth — Acquisition Overview', 'not_started', 'high', 21),
  (1, 'Agency OS', 'Agency Growth — City+Niche View', 'not_started', 'high', 22),
  (1, 'Agency OS', 'Strategy-to-Task AI Engine', 'not_started', 'high', 23),
  (1, 'Agency OS', 'Team Management Module', 'not_started', 'low', 24)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — System 2: Website Generation System
-- ============================================================
INSERT INTO build_tracker_modules (system_id, system_name, module_name, status, priority, sort_order) VALUES
  (2, 'Website Generation System', 'Website Brief Input Form', 'not_started', 'high', 1),
  (2, 'Website Generation System', 'Antigravity Prompt File Generator', 'not_started', 'high', 2),
  (2, 'Website Generation System', 'Image Generation Prompt File Generator', 'not_started', 'high', 3),
  (2, 'Website Generation System', 'Brief History & Archive', 'not_started', 'medium', 4),
  (2, 'Website Generation System', 'Niche Template Library', 'not_started', 'medium', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — System 3: Performance Marketing System
-- ============================================================
INSERT INTO build_tracker_modules (system_id, system_name, module_name, status, priority, sort_order) VALUES
  (3, 'Performance Marketing System', 'Business & Goals Input Form', 'not_started', 'high', 1),
  (3, 'Performance Marketing System', 'Strategy Builder (AI)', 'not_started', 'high', 2),
  (3, 'Performance Marketing System', 'Campaign Execution (Meta API)', 'not_started', 'high', 3),
  (3, 'Performance Marketing System', 'Campaign Execution (Google API)', 'not_started', 'high', 4),
  (3, 'Performance Marketing System', 'Conversion Action Setup (existing — needs fixes)', 'in_progress', 'high', 5),
  (3, 'Performance Marketing System', 'Performance Dashboard', 'not_started', 'medium', 6),
  (3, 'Performance Marketing System', 'A/B Testing Manager', 'not_started', 'low', 7)
ON CONFLICT DO NOTHING;
