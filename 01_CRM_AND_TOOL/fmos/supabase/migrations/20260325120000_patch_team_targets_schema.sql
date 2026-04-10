-- Update team_targets table to include daily and weekly targets per prompt schema
-- Migration: 20260325120000_patch_team_targets_schema.sql

-- Add new columns if they don't exist
ALTER TABLE team_targets ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT 0;
ALTER TABLE team_targets ADD COLUMN IF NOT EXISTS weekly_target INTEGER DEFAULT 0;

-- Optionally, migrate data from target_value to daily_target
UPDATE team_targets SET daily_target = CAST(target_value AS INTEGER) WHERE daily_target = 0 AND target_value > 0;

-- We'll keep target_value for backward compatibility or drop it if confident
-- For now, we'll just keep it but use the new columns in the UI.
