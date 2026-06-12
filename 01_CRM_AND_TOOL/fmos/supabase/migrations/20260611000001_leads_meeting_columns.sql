-- Meetings page (app/admin/meetings) writes these two columns.
-- Previously tracked only as a manual snippet in CLAUDE.md; this is
-- the versioned migration so every environment gets them.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_notes TEXT;
