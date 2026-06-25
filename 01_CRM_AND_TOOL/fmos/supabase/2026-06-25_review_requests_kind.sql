-- 2026-06-25 — track review vs referral asks on review_requests (4.8 flywheel).
-- The auto review/referral cron logs one row per (client, kind) so a client is
-- never double-asked. Existing rows + the manual Growth-hub logger default to
-- 'review'. No unique constraint (the manual flow may log multiple over time;
-- the cron dedups in app code). Run in the Supabase SQL editor. Idempotent.

alter table public.review_requests
  add column if not exists kind text not null default 'review';
