-- outreach_logs: tracks every touch in the outreach sequence
-- (calls, WhatsApp sends, PDF sends, follow-ups)

CREATE TABLE IF NOT EXISTS outreach_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  touch_type  TEXT        NOT NULL,
  -- touch_type values: 'call', 'whatsapp_sent', 'pdf_sent', 'follow_up', 'meeting_booked', 'email_sent'
  outcome     TEXT,
  -- outcome values (for calls): 'interested_book', 'interested_follow_up', 'interested_send_info',
  --   'not_interested', 'follow_back', 'wrong_number', 'no_answer'
  pdf_name    TEXT,
  -- pdf_name: the filename of the PDF sent (e.g. "Hubli_Gyms_EN.pdf")
  notes       TEXT,
  actor_id    UUID        REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_outreach_logs_lead_id
  ON outreach_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_created_at
  ON outreach_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_actor_id
  ON outreach_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_touch_type
  ON outreach_logs(touch_type);

-- RLS: telecallers can insert their own logs; admin can read all
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_logs_insert_own"
  ON outreach_logs FOR INSERT
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "outreach_logs_select_own"
  ON outreach_logs FOR SELECT
  USING (actor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
