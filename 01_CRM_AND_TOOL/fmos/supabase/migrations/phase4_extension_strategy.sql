-- Phase 4 Extension: Client Strategy Tab
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE strategy_runs ADD COLUMN IF NOT EXISTS strategy_type TEXT;
ALTER TABLE strategy_runs ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
