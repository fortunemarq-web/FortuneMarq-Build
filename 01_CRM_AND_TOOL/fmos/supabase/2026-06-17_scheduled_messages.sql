-- scheduled_messages: deferred WhatsApp sends (follow-back reminders, meeting reminders)
-- Picked up by the daily-digest cron or a dedicated scheduled-send cron.

CREATE TABLE IF NOT EXISTS scheduled_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       text NOT NULL,
  phone         text NOT NULL,
  template_name text NOT NULL,
  params        jsonb,
  lang          text NOT NULL DEFAULT 'en',
  fire_at       timestamptz NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_fire_at
  ON scheduled_messages (fire_at)
  WHERE status = 'pending';
