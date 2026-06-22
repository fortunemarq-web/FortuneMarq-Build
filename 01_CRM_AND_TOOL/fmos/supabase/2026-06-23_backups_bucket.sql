-- ============================================================================
-- 6.9 Backups — create the private Storage bucket for daily data snapshots.
-- Run in the Supabase dashboard SQL editor. Idempotent.
-- Uploads + downloads happen via the service role (cron + admin signed URLs),
-- so no public access and no extra storage RLS policies are required.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
