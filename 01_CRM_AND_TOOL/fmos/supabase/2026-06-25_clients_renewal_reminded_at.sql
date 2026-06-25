-- 2026-06-25 — track when a client was last sent a renewal reminder (4.8 renewals).
-- The renewals cron sends one renewal_reminder per renewal cycle; this column
-- dedups so a client isn't reminded daily through the 14-day window.
-- Run in the Supabase SQL editor. Idempotent.

alter table public.clients
  add column if not exists renewal_reminded_at timestamptz;
