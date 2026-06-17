-- Bot conversation history + human-takeover flag
-- Run once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS bot_threads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     text        NOT NULL,
  channel     text        NOT NULL DEFAULT 'whatsapp',
  role        text        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     text        NOT NULL,
  escalated   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_threads_lead
  ON bot_threads (lead_id, created_at DESC);

-- Human-takeover flag on leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS bot_paused boolean NOT NULL DEFAULT false;
