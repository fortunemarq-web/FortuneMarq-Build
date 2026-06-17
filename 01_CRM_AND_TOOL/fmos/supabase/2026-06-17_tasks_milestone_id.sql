-- 4.5 Plan deliverables — nest internal tasks under client-facing milestones.
-- Adds tasks.milestone_id (FK → project_milestones). Nullable so existing tasks
-- and non-milestone tasks are unaffected.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks (milestone_id);
