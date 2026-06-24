-- 2026-06-24 — store ad click IDs on lead attribution.
-- Lets a downstream conversion (meeting booked / deal won) be uploaded back to
-- Google Ads (Offline Conversion Import via gclid) and Meta (Conversions API via
-- fbclid), so the platforms optimize for real leads, not just form-fills.
--
-- Run this in the Supabase SQL editor BEFORE deploying the matching app change
-- (lib/inbound/capture.ts now writes these columns; without them the whole
-- lead_source_attribution insert would error). Idempotent.

alter table public.lead_source_attribution
  add column if not exists gclid  text,
  add column if not exists fbclid text;
