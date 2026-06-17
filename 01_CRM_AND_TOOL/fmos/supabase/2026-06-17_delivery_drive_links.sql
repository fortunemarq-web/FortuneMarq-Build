-- 4.6 Execute & results — Drive links on delivery tasks (no file uploads, links only).
-- raw → edited → final production stages, each an external Drive URL.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS drive_raw_url text,
  ADD COLUMN IF NOT EXISTS drive_edited_url text,
  ADD COLUMN IF NOT EXISTS drive_final_url text;

-- Milestone-complete notify guard: stamp when the project_update WA was sent so
-- we never double-notify the client for the same milestone.
ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS client_notified_at timestamptz;
