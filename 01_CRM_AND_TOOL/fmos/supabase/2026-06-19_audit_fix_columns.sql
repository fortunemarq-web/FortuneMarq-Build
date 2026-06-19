-- 2026-06-19 — Audit fix: additive columns (all nullable, non-destructive).
-- Applied to live DB via Supabase MCP on creation; kept here for provenance.
--
-- 1) content_pieces / seo_keywords — fields the growth + marketing content forms
--    were already trying to write (the inserts had been stripped to avoid errors).
alter table public.content_pieces
  add column if not exists target_keyword text,
  add column if not exists notes         text,
  add column if not exists caption_draft text,
  add column if not exists image_prompt  text,
  add column if not exists cta_type       text,
  add column if not exists cta_url        text;

alter table public.seo_keywords
  add column if not exists notes text;

-- 2) leads.gcal_event_id — dedicated home for the Google Calendar event id so
--    bookMeeting no longer overwrites the human-written leads.meeting_notes.
alter table public.leads
  add column if not exists gcal_event_id text;
