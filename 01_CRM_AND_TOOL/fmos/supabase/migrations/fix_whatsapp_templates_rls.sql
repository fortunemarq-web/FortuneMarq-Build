-- Fix: ensure authenticated users can SELECT from whatsapp_templates.
-- The phase_d_migrations.sql created the table without enabling RLS or adding policies.
-- If Supabase's "Require RLS" is on, or if RLS was later enabled, queries return empty.
-- This migration idempotently enables RLS and grants SELECT to all authenticated users.

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view whatsapp templates" ON whatsapp_templates;
CREATE POLICY "Authenticated users can view whatsapp templates"
  ON whatsapp_templates
  FOR SELECT
  TO authenticated
  USING (true);
