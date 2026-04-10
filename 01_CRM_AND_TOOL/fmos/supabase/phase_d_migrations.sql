-- ════════════════════════════════════════════════════════════
-- FMOS Phase D — Full Migration SQL
-- Run this ONCE in the Supabase SQL Editor
-- ════════════════════════════════════════════════════════════

-- ─── D4: WhatsApp Templates table (create from scratch) ────
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  lead_type TEXT,
  variables JSONB DEFAULT '[]',
  requires_meta_approval BOOLEAN DEFAULT TRUE,
  meta_category TEXT,
  sent_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── D3: Onboarding tables ──────────────────────────────────
CREATE TABLE IF NOT EXISTS client_onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_by TEXT,
  notes TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','DONE','BLOCKED')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_asset_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'NOT_COLLECTED' CHECK (status IN ('NOT_COLLECTED','REQUESTED','RECEIVED','STORED')),
  file_url TEXT,
  notes TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── D2: Agreements table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  proposal_id UUID REFERENCES proposals(id),
  agreement_number TEXT,
  proposal_ref TEXT,
  services JSONB,
  total_setup NUMERIC,
  total_monthly NUMERIC,
  start_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── D1: Proposals table additions (safe if already exist) ──
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_number TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS services JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_setup NUMERIC;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_monthly NUMERIC;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- ─── D4: Seed all 17 WhatsApp Templates ────────────────────
INSERT INTO whatsapp_templates (id, name, content, category, lead_type, variables, requires_meta_approval, meta_category, sent_by)
VALUES
  -- CURIOSITY (4)
  ('CURIOSITY_TYPE_A', 'Curiosity — Already Ranking',
'Hi {{businessName}}! 👋

We did a market research for {{niche}} businesses here in {{city}} and found some interesting data about your online position.

Your business is already showing up on Google — but there''s a clear gap in how much of that traffic is actually reaching you vs going elsewhere.

We''ve put together a short report on this. Want me to send it across? Takes 2 mins to read.

— FortuneMarq, {{city}}
🔗 fortunemarq.com',
  'CURIOSITY', 'A', '["businessName","city","niche"]', TRUE, 'MARKETING', 'jabeer_manual'),

  ('CURIOSITY_TYPE_B', 'Curiosity — Has Website, Not Ranking',
'Hi {{businessName}}! 👋

We recently did a market research for {{niche}} businesses in {{city}} and noticed something interesting — {{searchVolume}}+ people here search for your service on Google every month, but your website isn''t showing up in those results.

We''ve put together a short report on exactly why that''s happening and what the opportunity looks like. Want me to send it?

— FortuneMarq, {{city}}
🔗 fortunemarq.com',
  'CURIOSITY', 'B', '["businessName","city","niche","searchVolume"]', TRUE, 'MARKETING', 'jabeer_manual'),

  ('CURIOSITY_TYPE_C', 'Curiosity — No Website, GMB Only',
'Hi {{businessName}}! 👋

We did a market research for {{niche}} businesses in {{city}} and found that {{searchVolume}}+ people here search for your service on Google every month — and most of them look for a website before deciding who to call.

We''ve put together a short report on this opportunity. Want me to send it across?

— FortuneMarq, {{city}}
🔗 fortunemarq.com',
  'CURIOSITY', 'C', '["businessName","city","niche","searchVolume"]', TRUE, 'MARKETING', 'jabeer_manual'),

  ('CURIOSITY_TYPE_D', 'Curiosity — Low Search Volume',
'Hi {{businessName}}! 👋

We did a market research for {{niche}} businesses here in {{city}} and found something interesting — most people looking for your service aren''t finding businesses through direct search. They''re coming through Google Maps, social media, and referrals.

We''ve put together a short report on where the actual demand is coming from and how much of it is being missed. Want me to send it?

— FortuneMarq, {{city}}
🔗 fortunemarq.com',
  'CURIOSITY', 'D', '["businessName","city","niche"]', TRUE, 'MARKETING', 'jabeer_manual'),

  -- BOT REPLY (4)
  ('BOT_REPLY_TYPE_A', 'Bot Reply — Already Ranking',
'Thanks for your reply, {{businessName}}! 😊

We''ve put together a full breakdown on {{niche}} businesses in {{city}} — search volumes, online visibility gaps, and growth opportunities.

Check it out here: {{landingPageLink}}

If you''d like to go deeper on what this means specifically for your business, our founder Jabeer is happy to walk you through it in a quick meeting. Completely free.

— FortuneMarq',
  'BOT_REPLY', 'A', '["businessName","city","niche","landingPageLink"]', FALSE, NULL, 'bot_auto'),

  ('BOT_REPLY_TYPE_B', 'Bot Reply — Has Website, Not Ranking',
'Thanks for your reply, {{businessName}}! 😊

We''ve put together a full breakdown on {{niche}} businesses in {{city}} — how many people are searching, why most websites aren''t showing up, and what the opportunity looks like.

Check it out here: {{landingPageLink}}

If you''d like to know exactly what''s happening with your website specifically, our founder Jabeer can walk you through it in a quick meeting. No commitment at all.

— FortuneMarq',
  'BOT_REPLY', 'B', '["businessName","city","niche","landingPageLink"]', FALSE, NULL, 'bot_auto'),

  ('BOT_REPLY_TYPE_C', 'Bot Reply — No Website, GMB Only',
'Thanks for your reply, {{businessName}}! 😊

We''ve put together a full breakdown on {{niche}} businesses in {{city}} — how many people are searching for your service every month and how much of that demand is being captured by businesses with an online presence.

Check it out here: {{landingPageLink}}

Our founder Jabeer can show you exactly what this opportunity looks like for your business in a quick meeting. Free, no strings attached.

— FortuneMarq',
  'BOT_REPLY', 'C', '["businessName","city","niche","landingPageLink"]', FALSE, NULL, 'bot_auto'),

  ('BOT_REPLY_TYPE_D', 'Bot Reply — Low Search Volume',
'Thanks for your reply, {{businessName}}! 😊

We''ve put together a full breakdown on {{niche}} businesses in {{city}} — where the actual demand is coming from and how similar businesses in other cities are capturing it.

Check it out here: {{landingPageLink}}

Our founder Jabeer can walk you through what this looks like specifically for your business in a quick meeting. Completely free.

— FortuneMarq',
  'BOT_REPLY', 'D', '["businessName","city","niche","landingPageLink"]', FALSE, NULL, 'bot_auto'),

  -- OUTCOME TRIGGERED (4)
  ('OUTCOME_BOOK_MEETING', 'Meeting Confirmation',
'Hi {{businessName}}! 🙌

Just confirming your meeting with Jabeer from FortuneMarq —

📅 {{meetingDate}}
⏰ {{meetingTime}}
📲 Google Meet: {{meetLink}}

He''ll walk you through a presentation built specifically for your business. See you then!',
  'OUTCOME_TRIGGERED', NULL, '["businessName","meetingDate","meetingTime","meetLink"]', TRUE, 'UTILITY', 'fmos_auto_on_outcome_log'),

  ('OUTCOME_FOLLOW_UP_LATER', 'Follow Up Later Confirmation',
'Hi {{businessName}}!

Thanks for your time today. I''ll follow up with you on {{followUpDate}} as discussed.

In the meantime, check out what we do here: {{landingPageLink}}

Talk soon!
— Afifa, FortuneMarq',
  'OUTCOME_TRIGGERED', NULL, '["businessName","followUpDate","landingPageLink"]', TRUE, 'UTILITY', 'fmos_auto_on_outcome_log'),

  ('OUTCOME_NOT_INTERESTED', 'Not Interested — Soft Close',
'Hi {{businessName}}!

No worries at all — really appreciate you taking the time to speak with me.

If things change or you''d ever like to know more about what''s happening in your market, feel free to reach out anytime. We''re always here.

Have a great day! 😊
— FortuneMarq',
  'OUTCOME_TRIGGERED', NULL, '["businessName"]', TRUE, 'UTILITY', 'fmos_auto_on_outcome_log'),

  ('OUTCOME_FOLLOW_BACK', 'Follow Back Confirmation',
'Hi {{businessName}}!

No problem at all! I''ll give you a call on {{followBackDate}} at around {{followBackTime}}.

Have a good day!
— Afifa, FortuneMarq',
  'OUTCOME_TRIGGERED', NULL, '["businessName","followBackDate","followBackTime"]', TRUE, 'UTILITY', 'fmos_auto_on_outcome_log'),

  -- FOLLOWBACK REMINDER (1)
  ('FOLLOWBACK_REMINDER', 'Follow-Back Day Reminder',
'Hi {{businessName}}! 👋

Just a heads up — I''ll be giving you a call today as we discussed, sometime around {{callTime}}.

Here''s the link again if you''d like to look before the call: {{landingPageLink}}

Talk soon!
— Afifa, FortuneMarq',
  'FOLLOWBACK_REMINDER', NULL, '["businessName","callTime","landingPageLink"]', TRUE, 'UTILITY', 'afifa_fmos_button'),

  -- POST MEETING (4)
  ('POST_MEETING_PROPOSAL_SENT', 'Proposal Sent',
'Hi {{name}}! 😊

Really good speaking with you today. As discussed, here''s the proposal for {{businessName}} —

📄 {{proposalLink}}

Everything we covered is in there — services, pricing, timelines. Have a look when you get a chance and let me know if you have any questions. Happy to clarify anything.

— Jabeer, FortuneMarq',
  'POST_MEETING', NULL, '["name","businessName","proposalLink"]', TRUE, 'UTILITY', 'jabeer_manual'),

  ('POST_MEETING_PROPOSAL_FOLLOWUP', 'Proposal Follow-Up (48hrs no reply)',
'Hi {{name}}! 👋

Just checking in — did you get a chance to look at the proposal I sent across?

No rush at all — just wanted to make sure it reached you okay and see if you have any questions.

— Jabeer, FortuneMarq',
  'POST_MEETING', NULL, '["name"]', TRUE, 'UTILITY', 'jabeer_manual'),

  ('POST_MEETING_AGREEMENT_REQUEST', 'Agreement Request',
'Hi {{name}}! 😊

Great to know you''d like to move forward! To confirm, please just reply to this message with a simple *"Yes, confirmed"* and we''ll get started.

Just to recap what we''re starting with:
✅ {{service1}}
✅ {{service2}}

Once confirmed, I''ll send across the invoice and we''ll kick things off from there.

— Jabeer, FortuneMarq',
  'POST_MEETING', NULL, '["name","service1","service2"]', TRUE, 'UTILITY', 'jabeer_manual'),

  ('POST_MEETING_INVOICE_SENT', 'Invoice Sent',
'Hi {{name}}! 🎉

Welcome to FortuneMarq! Here''s your invoice —

🧾 {{invoiceLink}}

Once payment is done, we''ll start immediately. Onboarding checklist will come right after so we can get everything we need from your end quickly.

Excited to get started on this!

— Jabeer, FortuneMarq',
  'POST_MEETING', NULL, '["name","invoiceLink"]', TRUE, 'UTILITY', 'jabeer_manual')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  lead_type = EXCLUDED.lead_type,
  variables = EXCLUDED.variables,
  requires_meta_approval = EXCLUDED.requires_meta_approval,
  meta_category = EXCLUDED.meta_category,
  sent_by = EXCLUDED.sent_by;
