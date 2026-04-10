-- migration: whatsapp_template_system.sql
-- Task 1: WhatsApp Message Template System

-- 1. Niches Table
create table if not exists niches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  icon text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Cities Table
create table if not exists cities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  state text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. WhatsApp Message Templates Table
create table if not exists whatsapp_message_templates (
  id uuid default gen_random_uuid() primary key,
  niche_id uuid references niches(id) on delete cascade,
  city_id uuid references cities(id) on delete cascade,
  outcome text not null check (outcome in ('no_answer', 'not_interested', 'interested')),
  message_body text not null,
  version integer default 1,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. WhatsApp Logs Table
create table if not exists whatsapp_logs (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade,
  template_id uuid references whatsapp_message_templates(id) on delete set null,
  outcome text check (outcome in ('no_answer', 'not_interested', 'interested')),
  message_sent text,
  sent_by uuid references auth.users(id),
  sent_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_whatsapp_templates_niche_city_outcome on whatsapp_message_templates(niche_id, city_id, outcome);
create index if not exists idx_whatsapp_logs_lead on whatsapp_logs(lead_id);
create index if not exists idx_whatsapp_logs_sent_by on whatsapp_logs(sent_by);

-- RLS Policies
alter table niches enable row level security;
alter table cities enable row level security;
alter table whatsapp_message_templates enable row level security;
alter table whatsapp_logs enable row level security;

-- Admin access (auth.uid check as per project pattern)
create policy "Admins can manage niches" on niches for all using (auth.uid() is not null);
create policy "Admins can manage cities" on cities for all using (auth.uid() is not null);
create policy "Admins can manage templates" on whatsapp_message_templates for all using (auth.uid() is not null);
create policy "Users can see templates" on whatsapp_message_templates for select using (auth.uid() is not null);
create policy "Users can manage logs" on whatsapp_logs for all using (auth.uid() is not null);

-- Seeding Niches
insert into niches (name, slug, icon) values
('Tuition Centre', 'tuition-centre', '📚'),
('Skin Clinic', 'skin-clinic', '✨'),
('Real Estate Agent', 'real-estate-agent', '🏠'),
('Physiotherapy Clinics', 'physiotherapy-clinics', '🏥'),
('NEET Coaching', 'neet-coaching', '🎓'),
('Modular Kitchen', 'modular-kitchen', '🍳'),
('JEE Coaching', 'jee-coaching', '📐'),
('IVF Fertility Clinic', 'ivf-fertility-clinic', '👶'),
('Interior Designer', 'interior-designer', '🖼️'),
('IELTS Coaching', 'ielts-coaching', '🗣️'),
('Gym', 'gym', '🏋️'),
('Dental Clinics', 'dental-clinics', '🦷'),
('Computer Training Institute', 'computer-training-institute', '💻'),
('Car Rental', 'car-rental', '🚗')
on conflict (slug) do nothing;

-- Seeding Hubli City
insert into cities (name, state) values ('Hubli', 'Karnataka')
on conflict do nothing;

-- Seeding starter templates for Dental Clinics (Hubli)
do $$
declare
    dental_id uuid;
    hubli_id uuid;
begin
    select id into dental_id from niches where slug = 'dental-clinics' limit 1;
    select id into hubli_id from cities where name = 'Hubli' limit 1;

    if dental_id is not null and hubli_id is not null then
        -- No Answer Template
        insert into whatsapp_message_templates (niche_id, city_id, outcome, message_body) values (
            dental_id,
            hubli_id,
            'no_answer',
            'Hi {lead_name} 👋

We tried reaching you at {business_name} today but couldn''t connect.

We''re a digital marketing agency helping dental clinics in Hubli get more patient appointments through Google & Meta ads.

Would love to share how we''ve helped similar clinics grow. When would be a good time to connect?

— Team FortuneMarq'
        );

        -- Not Interested Template
        insert into whatsapp_message_templates (niche_id, city_id, outcome, message_body) values (
            dental_id,
            hubli_id,
            'not_interested',
            'Hi {lead_name},

Totally understand — no pressure at all! 🙏

Just wanted to leave this here: we recently helped a dental clinic in Hubli increase patient walk-ins by 40% in 3 months using targeted local ads.

If you ever reconsider or want to see the full case study, just reply here. We''re always around.

— Team FortuneMarq'
        );

        -- Interested Template
        insert into whatsapp_message_templates (niche_id, city_id, outcome, message_body) values (
            dental_id,
            hubli_id,
            'interested',
            'Hi {lead_name} 😊

Great speaking with you! As promised, here''s what we''ve put together specifically for dental clinics in Hubli:

📊 Market Research & Demand Report: {market_pdf_url}
🌐 See our work: {landing_page_url}
🏆 Results we''ve delivered: {case_study_url}

Let''s schedule a quick 15-minute call to walk you through everything. When works best for you?

— Team FortuneMarq'
        );
    end if;
end $$;
