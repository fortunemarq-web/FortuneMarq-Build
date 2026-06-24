-- 2026-06-25 — offline ad-conversion queue.
-- When a lead that arrived from a paid click (gclid/fbclid on its attribution)
-- reaches a real milestone — a booked meeting (qualified lead) or a won deal —
-- we upload that conversion back to the ad platforms so they optimize for REAL
-- outcomes, not cheap form-fills:
--   • Meta Conversions API (server-side) keyed by fbclid
--   • Google Ads Offline Conversion Import keyed by gclid
-- One row per (lead, event); status columns make the upload idempotent + retryable.
-- Run in the Supabase SQL editor. Idempotent.

create table if not exists public.ad_conversions (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  event_name    text not null,                       -- 'meeting' | 'won'
  occurred_at   timestamptz not null,
  gclid         text,
  fbclid        text,
  value         numeric,                             -- null = count-based (no revenue modelled)
  currency      text not null default 'INR',
  meta_status   text not null default 'pending',     -- pending|sent|skipped|no_token|failed
  google_status text not null default 'pending',     -- pending|sent|skipped|no_setup|failed
  meta_sent_at   timestamptz,
  google_sent_at timestamptz,
  meta_response   text,
  google_response text,
  attempts      int not null default 0,
  created_at    timestamptz not null default now(),
  unique (lead_id, event_name)
);

create index if not exists ad_conversions_meta_pending_idx
  on public.ad_conversions (meta_status) where meta_status = 'pending';
create index if not exists ad_conversions_google_pending_idx
  on public.ad_conversions (google_status) where google_status = 'pending';
