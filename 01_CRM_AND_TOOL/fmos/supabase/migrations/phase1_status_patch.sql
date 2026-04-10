-- ============================================================
-- Phase 1 Status Patch — Mark completed modules as Done
-- Run this in Supabase SQL Editor after phase1_build_tracker.sql
-- ============================================================

UPDATE build_tracker_modules
SET
  status = 'done',
  last_updated = NOW()
WHERE
  system_id = 1
  AND module_name IN (
    'Admin Dashboard Enhancement',
    'Build Tracker (this page)'
  );
