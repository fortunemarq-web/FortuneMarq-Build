-- Phase 4 Strategic AI Engine DB additions

-- 1. Create strategy_runs table to archive the generated strategies
CREATE TABLE strategy_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  timeframe TEXT,
  strategy_text TEXT NOT NULL,
  tasks_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE strategy_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON strategy_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Add columns to tasks table for strategies
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section_tag TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS strategy_run_id UUID REFERENCES strategy_runs(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- 3. Create mapping table between strategy_runs and tasks
CREATE TABLE strategy_run_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_run_id UUID REFERENCES strategy_runs(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

ALTER TABLE strategy_run_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON strategy_run_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
