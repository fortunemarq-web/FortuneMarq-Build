-- ============================================================
-- FMOS Onboarding Tables Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- 1. Client Onboarding Tasks
CREATE TABLE IF NOT EXISTS client_onboarding_tasks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id      TEXT NOT NULL,                          -- e.g. 'WEBSITE', 'GMB', 'SEO'
  task_id         TEXT NOT NULL,                          -- e.g. 'WEB_01'
  task            TEXT NOT NULL,
  owner           TEXT NOT NULL,                          -- 'Jabeer', 'Zaid/Sufiyan'
  due_by          TEXT,                                   -- 'Day 0', 'Day 7 (ongoing)'
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','IN_PROGRESS','DONE','BLOCKED')),
  completed_at    TIMESTAMPTZ,
  completed_by    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_client ON client_onboarding_tasks(client_id);

-- 2. Client Asset Vault
CREATE TABLE IF NOT EXISTS client_asset_vault (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id      TEXT NOT NULL,
  asset_id        TEXT NOT NULL,                          -- e.g. 'WEB_LOGO'
  asset_name      TEXT NOT NULL,
  required        BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'NOT_COLLECTED'
                    CHECK (status IN ('NOT_COLLECTED','REQUESTED','RECEIVED','STORED')),
  file_url        TEXT,
  notes           TEXT,
  category        TEXT GENERATED ALWAYS AS (service_id) STORED,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_vault_client ON client_asset_vault(client_id);

-- 3. Add onboarding_completed flag to clients table (if not already there)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- ============================================================
-- VERIFY: After running, check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('client_onboarding_tasks', 'client_asset_vault');
-- ============================================================
