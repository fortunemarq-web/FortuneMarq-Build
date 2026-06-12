-- ============================================================
-- FMOS FULL SCHEMA SYNC — generated 2026-06-12
-- Consolidates every unrun migration, made idempotent.
-- Safe to re-run. Apply in the Supabase SQL editor as one script.
-- ============================================================


-- ════════ BEGIN whatsapp_template_system.sql ════════
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
drop policy if exists "Admins can manage niches" on niches;
create policy "Admins can manage niches" on niches for all using (auth.uid() is not null);
drop policy if exists "Admins can manage cities" on cities;
create policy "Admins can manage cities" on cities for all using (auth.uid() is not null);
drop policy if exists "Admins can manage templates" on whatsapp_message_templates;
create policy "Admins can manage templates" on whatsapp_message_templates for all using (auth.uid() is not null);
drop policy if exists "Users can see templates" on whatsapp_message_templates;
create policy "Users can see templates" on whatsapp_message_templates for select using (auth.uid() is not null);
drop policy if exists "Users can manage logs" on whatsapp_logs;
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

    if dental_id is not null and hubli_id is not null and not exists (select 1 from whatsapp_message_templates) then
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

-- ════════ END whatsapp_template_system.sql ════════


-- ════════ BEGIN 20260311000001_niche_kit_manager.sql ════════
-- Migration: Create niche_kits table and storage bucket
-- Task: Niche Kit Manager

-- 1. Create niche_kits table
CREATE TABLE IF NOT EXISTS public.niche_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche_id UUID NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
    market_research_url TEXT,
    case_study_url TEXT,
    landing_page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one kit per niche
    CONSTRAINT unique_niche_kit UNIQUE (niche_id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_niche_kits_niche ON public.niche_kits(niche_id);

-- 3. Enable RLS
ALTER TABLE public.niche_kits ENABLE ROW LEVEL SECURITY;

-- 4. Admin Policies
drop policy if exists "Admins can manage niche kits" on public.niche_kits;
create policy "Admins can manage niche kits" on public.niche_kits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

drop policy if exists "Anyone authenticated can view niche kits" on public.niche_kits;
create policy "Anyone authenticated can view niche kits" on public.niche_kits
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

drop trigger if exists trg_niche_kits_updated_at on niche_kits;
create trigger trg_niche_kits_updated_at
    BEFORE UPDATE on niche_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Storage buckets are usually created via the Supabase Dashboard, 
-- but we can use SQL for completeness in some environments (though often requires extensions).
-- We'll assume the 'niche-kits' bucket is created manually or via the API.

-- ════════ END 20260311000001_niche_kit_manager.sql ════════


-- ════════ BEGIN attendance_module.sql ════════
-- Attendance Module Migration

-- 1. attendance_sessions
create table if not exists attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  session_date date not null, -- Asia/Kolkata date
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  status text not null default 'open', -- open | closed | flagged
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Partial index for only ONE open session per user
create unique index if not exists idx_unique_open_session_per_user 
on attendance_sessions(user_id) where (status = 'open');

create index if not exists idx_sessions_user_date on attendance_sessions(user_id, session_date desc);
create index if not exists idx_sessions_status_updated on attendance_sessions(status, updated_at desc);


-- 2. attendance_breaks
create table if not exists attendance_breaks (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null references attendance_sessions(id) on delete cascade,
  break_start_at timestamptz not null,
  break_end_at timestamptz,
  created_at timestamptz default now()
);

-- Partial index for only ONE open break per session
create unique index if not exists idx_unique_open_break_per_session
on attendance_breaks(session_id) where (break_end_at is null);

create index if not exists idx_breaks_session_start on attendance_breaks(session_id, break_start_at desc);


-- 3. attendance_daily_summary
create table if not exists attendance_daily_summary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  day date not null,
  gross_minutes int not null default 0,
  break_minutes int not null default 0,
  net_minutes int not null default 0,
  sessions_count int not null default 0,
  is_complete boolean not null default true, -- false if open session exists
  flags jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, day)
);

create index if not exists idx_summary_day on attendance_daily_summary(day desc);


-- 4. attendance_policies
create table if not exists attendance_policies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  standard_daily_minutes int not null default 540, -- 9h
  max_session_hours int not null default 14,
  break_required_after_minutes int not null default 300,
  grace_late_minutes int not null default 10,
  is_enabled boolean default true,
  created_at timestamptz default now()
);

-- Seed default policy
insert into attendance_policies (name, timezone, standard_daily_minutes, max_session_hours)
select 'Standard Asia/Kolkata', 'Asia/Kolkata', 540, 14
where not exists (select 1 from attendance_policies where name = 'Standard Asia/Kolkata');


-- 5. attendance_adjustments
create table if not exists attendance_adjustments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  day date not null,
  adjustment_minutes int not null default 0,
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_adjustments_user_day on attendance_adjustments(user_id, day);


-- 6. RLS Policies
alter table attendance_sessions enable row level security;
alter table attendance_breaks enable row level security;
alter table attendance_daily_summary enable row level security;
alter table attendance_policies enable row level security;
alter table attendance_adjustments enable row level security;

-- Sessions
drop policy if exists "Users manage their own sessions" on attendance_sessions;
create policy "Users manage their own sessions" on attendance_sessions
  for all using (auth.uid() = user_id);

drop policy if exists "Admins see all sessions" on attendance_sessions;
create policy "Admins see all sessions" on attendance_sessions
  for select using (auth.uid() in (select id from auth.users)); -- Simplify admin check (all users for strictly internal use, or real logic)
  -- For strictness: Assuming you rely on app-level checks or a role table. 
  -- We'll allow READ for all authenticated users (so PMs can see), but WRITE constrained.
  -- Actually, let's keep it tighter: Read their own OR Admin/PM (handled by app logic/admin user role if exists).
  -- Given no role table visible in context, we stick to standard 'auth.uid() = user_id' for write, and broad read for now until role system is cleaner.

-- Allow admins full access (Placeholder for admin check)
-- create policy "Admins all" ... 

-- Breaks
drop policy if exists "Users manage their own breaks" on attendance_breaks;
create policy "Users manage their own breaks" on attendance_breaks
  for all using (
    session_id in (select id from attendance_sessions where user_id = auth.uid())
  );

-- Summaries
drop policy if exists "Users read their summaries" on attendance_daily_summary;
create policy "Users read their summaries" on attendance_daily_summary
  for select using (auth.uid() = user_id);

-- Policies
drop policy if exists "Everyone reads policies" on attendance_policies;
create policy "Everyone reads policies" on attendance_policies
  for select using (true);
  
-- Adjustments
drop policy if exists "Users read own adjustments" on attendance_adjustments;
create policy "Users read own adjustments" on attendance_adjustments
  for select using (auth.uid() = user_id);
  
-- Allow updates to updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_attendance_sessions_modtime on attendance_sessions;
create trigger update_attendance_sessions_modtime
    before update on attendance_sessions
    for each row execute procedure update_updated_at_column();

drop trigger if exists update_attendance_summary_modtime on attendance_daily_summary;
create trigger update_attendance_summary_modtime
    before update on attendance_daily_summary
    for each row execute procedure update_updated_at_column();

-- ════════ END attendance_module.sql ════════


-- ════════ BEGIN rules_engine.sql ════════
-- Automation Rules
create table if not exists automation_rules (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  entity_type text not null, -- 'lead'|'deal'|'project'|'task'
  trigger text not null,
  is_enabled boolean default true,
  priority int default 100,
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  throttle_minutes int default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_auto_rules_trigger on automation_rules(entity_type, trigger, is_enabled, priority);

-- Automation Runs (Logs)
create table if not exists automation_runs (
  id uuid default gen_random_uuid() primary key,
  rule_id uuid references automation_rules(id),
  entity_type text not null,
  entity_id uuid not null,
  trigger text not null,
  status text not null, -- 'skipped'|'success'|'failed'
  reason text,
  input_snapshot jsonb default '{}',
  actions_executed jsonb default '[]',
  created_at timestamptz default now()
);
create index if not exists idx_auto_runs_rule on automation_runs(rule_id, created_at desc);
create index if not exists idx_auto_runs_entity on automation_runs(entity_type, entity_id, created_at desc);

-- Automation Throttle
create table if not exists automation_throttle (
  id uuid default gen_random_uuid() primary key,
  rule_id uuid not null references automation_rules(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  last_ran_at timestamptz not null default now(),
  unique(rule_id, entity_type, entity_id)
);

-- SLA Policies
create table if not exists sla_policies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  entity_type text not null default 'lead',
  lead_type text, -- 'inbound'|'outbound'|null
  condition jsonb default '{}',
  contact_within_minutes int,
  followup_missed_minutes int,
  is_enabled boolean default true,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notifications_user on notifications(user_id, is_read, created_at desc);
-- lib/notifications.ts + notification-bell.tsx need these two columns
alter table public.notifications add column if not exists type text default 'system';
alter table public.notifications add column if not exists link text;

-- Round Robin Assignment
create table if not exists assignment_pools (
  id uuid default gen_random_uuid() primary key,
  pool_name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_active boolean default true,
  weight int default 1,
  created_at timestamptz default now(),
  unique(pool_name, user_id)
);

create table if not exists assignment_state (
  pool_name text primary key,
  last_user_id uuid,
  updated_at timestamptz default now()
);

-- RLS
alter table automation_rules enable row level security;
alter table automation_runs enable row level security;
alter table automation_throttle enable row level security;
alter table sla_policies enable row level security;
alter table notifications enable row level security;
alter table assignment_pools enable row level security;
alter table assignment_state enable row level security;

-- Admin policies
drop policy if exists "Admins manage rules" on automation_rules;
create policy "Admins manage rules" on automation_rules for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Read rules for engine" on automation_rules;
create policy "Read rules for engine" on automation_rules for select using (true);

drop policy if exists "Admins manage runs" on automation_runs;
create policy "Admins manage runs" on automation_runs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Engine inserts runs" on automation_runs;
create policy "Engine inserts runs" on automation_runs for insert with check (true);

drop policy if exists "Admins manage throttle" on automation_throttle;
create policy "Admins manage throttle" on automation_throttle for all using (true); -- simplified for engine usage

drop policy if exists "Admins manage sla" on sla_policies;
create policy "Admins manage sla" on sla_policies for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Read sla" on sla_policies;
create policy "Read sla" on sla_policies for select using (true);

-- Notification policies
drop policy if exists "Users read own notifications" on notifications;
create policy "Users read own notifications" on notifications for select using (
  auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications" on notifications for update using (
  auth.uid() = user_id
) with check ( auth.uid() = user_id );
drop policy if exists "Engine inserts notifications" on notifications;
create policy "Engine inserts notifications" on notifications for insert with check (true); -- allow system inserts

-- Assignment policies
drop policy if exists "Admins manage pools" on assignment_pools;
create policy "Admins manage pools" on assignment_pools for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Read pools" on assignment_pools;
create policy "Read pools" on assignment_pools for select using (true);
drop policy if exists "Manage assignment state" on assignment_state;
create policy "Manage assignment state" on assignment_state for all using (true);

-- Seed Default Rules (only when the table is empty)
insert into automation_rules (name, entity_type, trigger, actions, conditions, priority)
select seed.name, seed.entity_type, seed.trigger, seed.actions::jsonb, seed.conditions::jsonb, seed.priority
from (values
  ('Auto-Assign Inbound', 'lead', 'lead_created',
   '[{"type":"assign_owner","value":"round_robin:sales"}, {"type":"set_status","value":"calling"}, {"type":"notify_owner","value":{}}, {"type":"set_next_action_date","value":{"preset":"now_plus_10min"}}]',
   '{"all":[{"field":"lead_type","op":"eq","value":"inbound"}]}',
   10),
  ('Inbound SLA Check', 'lead', 'lead_sla_missed',
   '[{"type":"mark_stale","value":{"reason":"Inbound SLA Missed"}}, {"type":"notify_admin","value":{"message":"Inbound SLA missed"}}, {"type":"add_tag","value":"sla_missed"}]',
   '{"all":[{"field":"lead_type","op":"eq","value":"inbound"}]}',
   10),
  ('Outbound Setup', 'lead', 'lead_created',
   '[{"type":"assign_owner","value":"round_robin:sales"}, {"type":"set_next_action_date","value":{"preset":"today_6pm"}}]',
   '{"all":[{"field":"lead_type","op":"eq","value":"outbound"}]}',
   20),
  ('Follow-up Reminder', 'lead', 'lead_followup_due',
   '[{"type":"notify_owner","value":{"message":"Follow-up is due now"}}, {"type":"add_tag","value":"followup_due"}]',
   '{}',
   50)
) as seed(name, entity_type, trigger, actions, conditions, priority)
where not exists (select 1 from automation_rules);
-- ════════ END rules_engine.sql ════════


-- ════════ BEGIN telecaller_performance_system.sql ════════
-- Telecaller Performance & Call Logs System

-- 1. Create call_logs table for granular call tracking
create table if not exists call_logs (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references leads(id) on delete cascade,
    telecaller_id uuid references auth.users(id) on delete cascade,
    outcome text not null,
    duration_seconds int default 0,
    created_at timestamptz default now(),
    
    -- Metadata for analysis
    niche text,
    city text
);

-- Indexing for performance dashboards
create index if not exists idx_call_logs_telecaller on call_logs(telecaller_id, created_at desc);
create index if not exists idx_call_logs_outcome on call_logs(outcome);
create index if not exists idx_call_logs_niche on call_logs(niche);

-- 2. Telecaller Stats Table (for Streaks & Badges)
create table if not exists telecaller_stats (
    user_id uuid primary key references auth.users(id) on delete cascade,
    current_streak int default 0,
    highest_streak int default 0,
    total_calls int default 0,
    total_interested int default 0,
    last_call_at timestamptz,
    updated_at timestamptz default now()
);

-- 3. Leaderboard View
create or replace view telecaller_leaderboard as
select 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    count(c.id) as total_calls,
    count(case when c.outcome = 'interested' or c.outcome = 'strategy_booked' then 1 end) as interested_count,
    round(count(case when c.outcome = 'interested' or c.outcome = 'strategy_booked' then 1 end)::numeric / nullif(count(c.id), 0) * 100, 1) as conversion_rate,
    coalesce(s.current_streak, 0) as streak
from profiles p
left join call_logs c on p.id = c.telecaller_id
left join telecaller_stats s on p.id = s.user_id
where p.role in ('telecaller', 'manager', 'admin')
group by p.id, p.full_name, p.avatar_url, s.current_streak;

-- RLS Policies
alter table call_logs enable row level security;
alter table telecaller_stats enable row level security;

drop policy if exists "Admins can see all call logs" on call_logs;
create policy "Admins can see all call logs" on call_logs for select
    using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager')));

drop policy if exists "Telecallers can see own call logs" on call_logs;
create policy "Telecallers can see own call logs" on call_logs for select
    using (auth.uid() = telecaller_id);

drop policy if exists "Telecallers can insert own call logs" on call_logs;
create policy "Telecallers can insert own call logs" on call_logs for insert
    with check (auth.uid() = telecaller_id);

-- (removed: policies cannot be created on views)

drop policy if exists "Everyone can view telecaller stats" on telecaller_stats;
create policy "Everyone can view telecaller stats" on telecaller_stats for select
    using (true);

-- ════════ END telecaller_performance_system.sql ════════


-- ════════ BEGIN duplicates_merge.sql ════════
-- Helper function to normalize phone numbers
create or replace function normalize_phone(raw_phone text) returns text as $$
declare
  cleaned text;
begin
  if raw_phone is null then return null; end if;
  -- Remove all non-digit characters
  cleaned := regexp_replace(raw_phone, '[^0-9]', '', 'g');
  -- If empty after cleaning, return null
  if length(cleaned) = 0 then return null; end if;
  -- Take last 10 digits (default for IN/US common mobile formats)
  -- Adjust logic if international formats strictly required
  if length(cleaned) > 10 then
    cleaned := substring(cleaned from length(cleaned)-9 for 10);
  end if;
  return cleaned;
end;
$$ language plpgsql immutable;

-- Helper function to normalize emails
create or replace function normalize_email(raw_email text) returns text as $$
begin
  if raw_email is null then return null; end if;
  return lower(trim(raw_email));
end;
$$ language plpgsql immutable;

-- Helper function to extract domain from website
create or replace function extract_domain(url text) returns text as $$
declare
  domain text;
begin
  if url is null then return null; end if;
  domain := lower(trim(url));
  -- Remove protocol
  domain := regexp_replace(domain, '^https?://', '');
  -- Remove www.
  domain := regexp_replace(domain, '^www\.', '');
  -- Remove path/query
  domain := split_part(domain, '/', 1);
  return domain;
end;
$$ language plpgsql immutable;

-- Add normalized columns to leads
alter table leads add column if not exists phone_normalized text;
alter table leads add column if not exists email_normalized text;
alter table leads add column if not exists website_domain text;
alter table leads add column if not exists phone_raw text;

-- Add merge tracking columns to leads
alter table leads add column if not exists is_merged boolean default false;
alter table leads add column if not exists merged_into uuid references leads(id);

-- Create duplicate_candidates table
create table if not exists duplicate_candidates (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null default 'lead',
  primary_id uuid not null references leads(id) on delete cascade,
  duplicate_id uuid not null references leads(id) on delete cascade,
  match_type text not null, -- 'phone'|'email'|'domain'|'name_city'|'fuzzy'
  confidence int not null,
  reason jsonb default '{}',
  status text not null default 'open', -- 'open'|'ignored'|'merged'
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(entity_type, primary_id, duplicate_id, match_type)
);

-- Create merges table
create table if not exists merges (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null default 'lead',
  survivor_id uuid not null references leads(id),
  merged_id uuid not null references leads(id),
  merged_by uuid references auth.users(id),
  merge_strategy jsonb default '{}',
  undo_until timestamptz not null,
  is_undone boolean default false,
  created_at timestamptz default now()
);

-- Create lead_redirects table
create table if not exists lead_redirects (
  merged_id uuid primary key references leads(id),
  survivor_id uuid not null references leads(id),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_leads_phone_norm on leads(phone_normalized);
create index if not exists idx_leads_email_norm on leads(email_normalized);
create index if not exists idx_leads_website_domain on leads(website_domain);

create index if not exists idx_dup_candidates_status on duplicate_candidates(status, created_at desc);
create index if not exists idx_dup_candidates_primary on duplicate_candidates(primary_id);
create index if not exists idx_dup_candidates_duplicate on duplicate_candidates(duplicate_id);

create index if not exists idx_merges_survivor on merges(survivor_id);
create index if not exists idx_merges_merged on merges(merged_id);

-- Trigger to auto-normalize on insert/update
create or replace function trigger_normalize_lead_fields() returns trigger as $$
begin
  new.phone_normalized := normalize_phone(new.phone);
  new.email_normalized := normalize_email(new.email);
  -- If website exists, normalize domain
  if new.industry is not null then -- Using industry field as placeholder? No, wait, need checking if 'website' column exists.
     -- Assuming 'leads' has a 'website' column? The prompt implies it might exist or we just normalize based on provided fields.
     -- If there is a 'website' column in leads:
     -- new.website_domain := extract_domain(new.website);
     -- Checking `initialLeads` interface in previous file, there is no `website` column explicitly mentioned in `Lead` interface, but `email` allows determining website sometimes.
     -- BUT step 1 says "If existing columns are "phone", "email", "website", do NOT remove".
     -- I will check if website column exists in leads table via schema inspection logically, or just try to trigger.
     -- Since I can't check schema dynamically in this block easily without erroring if column missing, I'll skip website domain auto-calc in trigger for safety unless I'm sure column exists. 
     -- Safest is to rely on app-side normalization which I will implement in step 4.
     null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_normalized_fields on leads;
create trigger set_normalized_fields
    before insert or update on leads
for each row
execute function trigger_normalize_lead_fields();

-- Enable RLS
alter table duplicate_candidates enable row level security;
alter table merges enable row level security;
alter table lead_redirects enable row level security;

-- Policies

-- Duplicate Candidates
-- Admin: full access
drop policy if exists "Admins full access candidates" on duplicate_candidates;
create policy "Admins full access candidates" on duplicate_candidates
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Sales/Strategist: Read own candidates (simplified to read all open candidates for now, restricted by logic in app)
drop policy if exists "Staff read candidates" on duplicate_candidates;
create policy "Staff read candidates" on duplicate_candidates
  for select using (auth.uid() is not null);

-- Merges
drop policy if exists "Admins manage merges" on merges;
create policy "Admins manage merges" on merges
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Staff read merges" on merges;
create policy "Staff read merges" on merges
  for select using (auth.uid() is not null);

-- Redirects
drop policy if exists "Everyone read redirects" on lead_redirects;
create policy "Everyone read redirects" on lead_redirects
  for select using (true);

-- ════════ END duplicates_merge.sql ════════


-- ════════ BEGIN follow_up_engine.sql ════════
-- Table: follow_ups
create table if not exists follow_ups (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_type text check (follow_up_type in ('call', 'whatsapp', 'email')),
  scheduled_at timestamptz not null,
  notes text,
  status text default 'pending' check (status in ('pending', 'completed', 'missed', 'rescheduled')),
  completed_at timestamptz,
  outcome_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table follow_ups enable row level security;

drop policy if exists "Users can view their own assigned follow ups or created follow ups" on follow_ups;
create policy "Users can view their own assigned follow ups or created follow ups" on follow_ups
  for select
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Users can insert follow ups" on follow_ups;
create policy "Users can insert follow ups" on follow_ups
  for insert
  to authenticated
  with check (true);

drop policy if exists "Users can update their own follow ups" on follow_ups;
create policy "Users can update their own follow ups" on follow_ups
  for update
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Users can delete their own follow ups" on follow_ups;
create policy "Users can delete their own follow ups" on follow_ups
  for delete
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Indexes for performance
create index if not exists follow_ups_lead_id_idx on follow_ups(lead_id);
create index if not exists follow_ups_assigned_to_idx on follow_ups(assigned_to);
create index if not exists follow_ups_status_idx on follow_ups(status);
create index if not exists follow_ups_scheduled_at_idx on follow_ups(scheduled_at);

-- ════════ END follow_up_engine.sql ════════


-- ════════ BEGIN upgrade_sales_workflow.sql ════════
-- Create Lead Outcomes Table
create table if not exists lead_outcomes (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid not null references leads(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  outcome text not null, -- 'interested','follow_up','no_answer','not_reachable','busy','not_interested','wrong_number','invalid_number','strategy_booked'
  reason_code text,
  reason_note text,
  next_action_date timestamptz,
  call_notes text,
  created_at timestamptz default now()
);

create index if not exists idx_lead_outcomes_lead on lead_outcomes(lead_id, created_at desc);
create index if not exists idx_lead_outcomes_actor on lead_outcomes(actor_id, created_at desc);
create index if not exists idx_lead_outcomes_outcome on lead_outcomes(outcome, created_at desc);

-- Create Lead Reason Codes Table
create table if not exists lead_reason_codes (
  id uuid default gen_random_uuid() primary key,
  outcome text not null,
  code text not null,
  label text not null,
  is_active boolean default true,
  sort_order int default 0,
  unique(outcome, code)
);

-- Seed Reason Codes
insert into lead_reason_codes (outcome, code, label, sort_order) values
('not_interested', 'budget', 'Budget Constraints', 10),
('not_interested', 'already_has_agency', 'Already has Agency/Partner', 20),
('not_interested', 'not_decision_maker', 'Not Decision Maker', 30),
('not_interested', 'not_needed_now', 'Not Needed Right Now', 40),
('not_interested', 'bad_experience', 'Bad Past Experience', 50),
('not_interested', 'prefers_referral', 'Prefers Referral Only', 60),
('follow_up', 'asked_callback', 'Asked for Callback', 10),
('follow_up', 'needs_discuss_partner', 'Needs to Discuss with Partner', 20),
('follow_up', 'send_details', 'Requested More Details', 30),
('follow_up', 'timing_issue', 'Bad Timing', 40),
('wrong_number', 'invalid_contact', 'Invalid Contact Info', 10),
('invalid_number', 'invalid_contact', 'Invalid Contact Info', 10)
on conflict (outcome, code) do nothing;

-- Enhance Leads Table
alter table leads add column if not exists last_contacted_at timestamptz;
alter table leads add column if not exists last_outcome text;
alter table leads add column if not exists last_outcome_reason text;
alter table leads add column if not exists next_action_date timestamptz;
alter table leads add column if not exists stale_flag boolean default false;
alter table leads add column if not exists stale_reason text;

-- Create Sales Daily Metrics Table
create table if not exists sales_daily_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  day date not null,
  calls_made int default 0,
  connected int default 0,
  followups_set int default 0,
  strategy_booked int default 0,
  not_interested int default 0,
  created_at timestamptz default now(),
  unique(user_id, day)
);

-- Create Sales Scripts Table
create table if not exists sales_scripts (
  id uuid default gen_random_uuid() primary key,
  industry text, -- null for global
  city text,
  language text default 'en',
  script_title text not null,
  script_body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Create Objection Bank Table
create table if not exists objection_bank (
  id uuid default gen_random_uuid() primary key,
  industry text,
  objection text not null,
  rebuttal text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table lead_outcomes enable row level security;
alter table lead_reason_codes enable row level security;
alter table sales_daily_metrics enable row level security;
alter table sales_scripts enable row level security;
alter table objection_bank enable row level security;

-- Policies

-- lead_outcomes
drop policy if exists "Sales can insert outcomes" on lead_outcomes;
create policy "Sales can insert outcomes" on lead_outcomes for insert
  with check (auth.uid() = actor_id);

drop policy if exists "Sales can read outcomes" on lead_outcomes;
create policy "Sales can read outcomes" on lead_outcomes for select
  using (true); -- Simplified, usually strictly for assigned leads but keeping it open for team visibility for now

-- lead_reason_codes
drop policy if exists "Everyone can read reason codes" on lead_reason_codes;
create policy "Everyone can read reason codes" on lead_reason_codes for select
  using (true);

-- sales_daily_metrics
drop policy if exists "Users can read own metrics" on sales_daily_metrics;
create policy "Users can read own metrics" on sales_daily_metrics for select
  using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can update own metrics" on sales_daily_metrics;
create policy "Users can update own metrics" on sales_daily_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sales_scripts & objection_bank
drop policy if exists "Everyone can read scripts" on sales_scripts;
create policy "Everyone can read scripts" on sales_scripts for select using (true);
drop policy if exists "Everyone can read objections" on objection_bank;
create policy "Everyone can read objections" on objection_bank for select using (true);
drop policy if exists "Admins manage scripts" on sales_scripts;
create policy "Admins manage scripts" on sales_scripts for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins manage objections" on objection_bank;
create policy "Admins manage objections" on objection_bank for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ════════ END upgrade_sales_workflow.sql ════════


-- ════════ BEGIN ai_brain_system.sql ════════
-- Table: ai_usage_logs
create table if not exists ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  feature text not null, -- e.g., 'script_suggester', 'objection_handler', 'morning_brief', 'weekly_report'
  input_summary text,
  output_summary text,
  tokens_used integer default 0,
  model text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table ai_usage_logs enable row level security;

drop policy if exists "Users can view their own AI usage logs" on ai_usage_logs;
create policy "Users can view their own AI usage logs" on ai_usage_logs
  for select
  to authenticated
  using (
    created_by = auth.uid() 
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "System can insert AI usage logs" on ai_usage_logs;
create policy "System can insert AI usage logs" on ai_usage_logs
  for insert
  to authenticated
  with check (true);

-- Indexes
create index if not exists ai_usage_logs_created_by_idx on ai_usage_logs(created_by);
create index if not exists ai_usage_logs_feature_idx on ai_usage_logs(feature);
create index if not exists ai_usage_logs_created_at_idx on ai_usage_logs(created_at);

-- ════════ END ai_brain_system.sql ════════


-- ════════ BEGIN create_saved_views_and_tags.sql ════════
-- Create Saved Views Table
create table if not exists saved_views (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  entity_type text not null, -- 'lead', 'deal', 'project', 'task'
  owner_id uuid references auth.users(id), -- null for global views
  visibility text not null default 'private', -- 'private', 'role', 'global'
  role_scope text, -- 'admin', 'sales', 'strategist', 'pm', 'staff', 'client'
  filters jsonb not null default '{}'::jsonb,
  sort jsonb not null default '{}'::jsonb,
  columns jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for Saved Views
create index if not exists idx_saved_views_entity_owner on saved_views(entity_type, owner_id);
create index if not exists idx_saved_views_visibility on saved_views(entity_type, visibility, role_scope);

-- Create Entity Tags Table
create table if not exists entity_tags (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null,
  entity_id uuid not null,
  tag text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(entity_type, entity_id, tag)
);

-- Index for Entity Tags
create index if not exists idx_entity_tags_lookup on entity_tags(entity_type, tag);
create index if not exists idx_entity_tags_entity on entity_tags(entity_type, entity_id);

-- Trigger for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_saved_views_updated_at on saved_views;
create trigger update_saved_views_updated_at
    before update on saved_views
    for each row
    execute function update_updated_at_column();

-- Enable RLS
alter table saved_views enable row level security;
alter table entity_tags enable row level security;

-- Saved Views Policies

-- Read Policy
drop policy if exists "Users can read their own, global, or role-based views" on saved_views;
create policy "Users can read their own, global, or role-based views" on saved_views for select
  using (
    -- Own views
    owner_id = auth.uid()
    -- Global views
    or (visibility = 'global' and owner_id is null)
    -- Role-based views (simplified check against profiles)
    or (
      visibility = 'role' 
      and exists (
        select 1 from profiles 
        where profiles.id = auth.uid() 
        and profiles.role::text = role_scope
      )
    )
  );

-- Insert Policy
drop policy if exists "Users can create their own views, Admins can create global" on saved_views;
create policy "Users can create their own views, Admins can create global" on saved_views for insert
  with check (
    -- Private views
    (owner_id = auth.uid() and visibility = 'private')
    -- Admin creating global/role views
    or (
      exists (select 1 from profiles where id = auth.uid() and role = 'admin')
      and (
        (owner_id is null and visibility = 'global')
        or (visibility = 'role')
      )
    )
  );

-- Update Policy
drop policy if exists "Users can update their own views, Admins update global" on saved_views;
create policy "Users can update their own views, Admins update global" on saved_views for update
  using (
    (owner_id = auth.uid())
    or (
      owner_id is null 
      and visibility = 'global' 
      and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  );

-- Delete Policy
drop policy if exists "Users can delete their own views, Admins delete global" on saved_views;
create policy "Users can delete their own views, Admins delete global" on saved_views for delete
  using (
    (owner_id = auth.uid())
    or (
      owner_id is null 
      and visibility = 'global' 
      and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  );

-- Entity Tags Policies

-- Read Policy (Admin read all, others read related - simplified to all authenticated for now as per "allow for now")
drop policy if exists "Authenticated users can read tags" on entity_tags;
create policy "Authenticated users can read tags" on entity_tags for select
  using (auth.role() = 'authenticated');

-- Insert/Delete Policy (Admin can manage all, others detailed control later)
drop policy if exists "Authenticated users can manage tags" on entity_tags;
create policy "Authenticated users can manage tags" on entity_tags for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════ END create_saved_views_and_tags.sql ════════


-- ════════ BEGIN project_delivery_upgrade.sql ════════
-- Task Checklists
create table if not exists task_checklist_items (
  id uuid default gen_random_uuid() primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  sort_order int default 0,
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_checklist_task on task_checklist_items(task_id, sort_order);

-- Task Dependencies
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  dependency_type text not null default 'blocks', -- blocks | relates
  created_at timestamptz default now(),
  unique(task_id, depends_on_task_id)
);
create index if not exists idx_deps_task on task_dependencies(task_id);
create index if not exists idx_deps_depends on task_dependencies(depends_on_task_id);

-- Milestone Approvals
create table if not exists milestone_approvals (
  id uuid default gen_random_uuid() primary key,
  milestone_id uuid not null references project_milestones(id) on delete cascade,
  requested_by uuid references auth.users(id),
  requested_at timestamptz default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  status text not null default 'pending', -- pending|approved|rejected
  feedback text,
  created_at timestamptz default now()
);
create index if not exists idx_milestone_approvals on milestone_approvals(milestone_id, requested_at desc);

-- Change Requests
create table if not exists change_requests (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  title text not null,
  description text not null,
  priority text default 'medium',
  impact_timeline_days int,
  impact_cost numeric,
  status text not null default 'requested', -- requested|reviewing|approved|rejected|implemented
  decision_by uuid references auth.users(id),
  decision_at timestamptz,
  decision_note text
);
create index if not exists idx_cr_project on change_requests(project_id, created_at desc);

-- Deliverables
create table if not exists deliverables (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  milestone_id uuid references project_milestones(id),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  type text not null, -- 'file'|'link'|'note'
  title text not null,
  url text,
  storage_path text,
  version text,
  description text
);
create index if not exists idx_deliverables_project on deliverables(project_id, created_at desc);

-- RLS Policies

-- Checklist
alter table task_checklist_items enable row level security;
drop policy if exists "Users manage checklist for visible tasks" on task_checklist_items;
create policy "Users manage checklist for visible tasks" on task_checklist_items
  for all using (
    exists (
       select 1 from tasks t
       join projects p on t.project_id = p.id
       where t.id = task_checklist_items.task_id
       -- Simplify: If user can access project (or is admin)
       -- Assuming users have project access logic or simple open access for staff
       and (auth.uid() is not null) 
    )
  );

-- Dependencies
alter table task_dependencies enable row level security;
drop policy if exists "Users view dependencies" on task_dependencies;
create policy "Users view dependencies" on task_dependencies for select using (true);
drop policy if exists "Staff manage dependencies" on task_dependencies;
create policy "Staff manage dependencies" on task_dependencies for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'strategist', 'sales'))
);

-- Milestone Approvals
alter table milestone_approvals enable row level security;
drop policy if exists "Users view milestone approvals" on milestone_approvals;
create policy "Users view milestone approvals" on milestone_approvals for select using (true);
drop policy if exists "Users manage milestone approvals" on milestone_approvals;
create policy "Users manage milestone approvals" on milestone_approvals for all using (auth.uid() is not null);

-- Change Requests
alter table change_requests enable row level security;
drop policy if exists "Users view change requests" on change_requests;
create policy "Users view change requests" on change_requests for select using (true);
drop policy if exists "Users manage change requests" on change_requests;
create policy "Users manage change requests" on change_requests for all using (auth.uid() is not null);

-- Deliverables
alter table deliverables enable row level security;
drop policy if exists "Users view deliverables" on deliverables;
create policy "Users view deliverables" on deliverables for select using (true);
drop policy if exists "Users manage deliverables" on deliverables;
create policy "Users manage deliverables" on deliverables for all using (auth.uid() is not null);

-- ════════ END project_delivery_upgrade.sql ════════


-- ════════ BEGIN client_portal_enhancement.sql ════════
-- Task 7: Client Portal Enhancement

-- 1. Create client_reports table
create table if not exists public.client_reports (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references clients(id) on delete cascade,
    project_id uuid references projects(id) on delete cascade,
    report_month date not null, -- first day of the month
    report_type text not null check (report_type in ('monthly', 'weekly', 'custom')),
    ai_summary text,
    data_snapshot jsonb default '{}'::jsonb,
    pdf_url text,
    magic_link_token uuid default gen_random_uuid() unique,
    magic_link_expires_at timestamptz,
    is_published boolean default false,
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
);

-- 2. Create client_deliverables table
create table if not exists public.client_deliverables (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references projects(id) on delete cascade,
    title text not null,
    description text,
    deliverable_type text not null check (deliverable_type in ('design', 'content', 'report', 'ad_creative', 'other')),
    file_url text,
    status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'revision_requested')),
    client_feedback text,
    reviewed_at timestamptz,
    created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_client_reports_client on client_reports(client_id);
create index if not exists idx_client_reports_project on client_reports(project_id);
create index if not exists idx_client_reports_magic_link on client_reports(magic_link_token);
create index if not exists idx_client_deliverables_project on client_deliverables(project_id);

-- RLS Policies
alter table public.client_reports enable row level security;
alter table public.client_deliverables enable row level security;

-- Reports Policies
drop policy if exists "Admins manage reports" on client_reports;
create policy "Admins manage reports" on client_reports for all 
    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Clients view published reports" on client_reports;
create policy "Clients view published reports" on client_reports for select
    using (is_published = true); -- We'll refine this if we have client accounts, but for magic links it works.

drop policy if exists "Public view via magic link" on client_reports;
create policy "Public view via magic link" on client_reports for select
    using (magic_link_token is not null); -- Logic will be handled in the route

-- Deliverables Policies
drop policy if exists "Staff manage deliverables" on client_deliverables;
create policy "Staff manage deliverables" on client_deliverables for all 
    using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'strategist', 'sales')));

drop policy if exists "Clients view deliverables" on client_deliverables;
create policy "Clients view deliverables" on client_deliverables for select
    using (true); -- Usually restricted to their project, but keeping broad for now.

drop policy if exists "Clients update deliverable status" on client_deliverables;
create policy "Clients update deliverable status" on client_deliverables for update
    using (true)
    with check (true);

-- ════════ END client_portal_enhancement.sql ════════


-- ════════ BEGIN add_client_resources.sql ════════

-- Create a table for client resources (Google Drive links, etc.)
create table if not exists client_resources (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  resource_type text check (resource_type in ('drive_folder', 'file', 'link', 'other')),
  title text not null,
  url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table client_resources enable row level security;

-- Policies
drop policy if exists "Users can view client resources" on client_resources;
create policy "Users can view client resources" on client_resources for select using (true);
drop policy if exists "Users can insert client resources" on client_resources;
create policy "Users can insert client resources" on client_resources for insert with check (true);
drop policy if exists "Users can update client resources" on client_resources;
create policy "Users can update client resources" on client_resources for update using (true);
drop policy if exists "Users can delete client resources" on client_resources;
create policy "Users can delete client resources" on client_resources for delete using (true);

-- ════════ END add_client_resources.sql ════════


-- ════════ BEGIN user_sessions.sql ════════
-- User Sessions Migration

-- 1. user_sessions table
create table if not exists user_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id),
    login_at timestamptz not null default now(),
    logout_at timestamptz,
    last_seen_at timestamptz not null default now(),
    ended_reason text, -- 'logout' | 'timeout' | 'forced' | 'unknown'
    ip_address text,
    user_agent text,
    metadata jsonb not null default '{}',
    created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_sessions_user_login on user_sessions(user_id, login_at desc);
create index if not exists idx_sessions_logout on user_sessions(logout_at);
create index if not exists idx_sessions_last_seen on user_sessions(last_seen_at desc);

-- 2. Optional Convenient View
create or replace view user_sessions_view as
select 
    *,
    EXTRACT(EPOCH FROM (COALESCE(logout_at, now()) - login_at))::bigint AS duration_seconds
from user_sessions;

-- 3. RLS
alter table user_sessions enable row level security;

-- Read: Users own sessions, Admin all
drop policy if exists "Users read own sessions" on user_sessions;
create policy "Users read own sessions" on user_sessions
    for select using (auth.uid() = user_id);

-- Placeholder Admin policy - Assuming app logic handles admin check or explicit role logic
-- For now, allowing all authed users to insert (required for logging in)
-- But only update own session

drop policy if exists "Users insert own session" on user_sessions;
create policy "Users insert own session" on user_sessions
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own session" on user_sessions;
create policy "Users update own session" on user_sessions
    for update using (auth.uid() = user_id);

-- Explicitly allow service/admin role via 'true' if we had roles, but here rely on "all authenticated for select if admin" logic usually done
-- Since we don't have a robust role system in context, we assume ADMIN pages will use a client with permissions or just filtered queries.
-- We'll add a broad Select policy for now to ensure Admin pages work for all rows if the user is authenticated (simplest for this specific prompt context without external keys)
-- Ideally: policy "Admins read all" using (public.is_admin())
-- We'll add a permissive select for now to unblock Admin UI:
drop policy if exists "Authenticated read all sessions" on user_sessions;
create policy "Authenticated read all sessions" on user_sessions
    for select using (auth.role() = 'authenticated'); 
-- NOTE: In a real app with sensitive data, restrict this to admin role only.

-- 4. Session Timeout Cleanup Function (Security Definer)
create or replace function cleanup_inactive_sessions(timeout_minutes int default 20)
returns int
language plpgsql
security definer
as $$
declare
    v_count int;
begin
    with closed_sessions as (
        update user_sessions
        set 
            logout_at = last_seen_at,
            ended_reason = 'timeout'
        where 
            logout_at is null 
            and last_seen_at < (now() - (timeout_minutes || ' minutes')::interval)
        returning id
    )
    select count(*) into v_count from closed_sessions;
    
    return v_count;
end;
$$;

-- ════════ END user_sessions.sql ════════


-- ════════ BEGIN 20260309184740_create_agency_marketing_tables.sql ════════
-- Migration: Create Agency Marketing Tables
-- Description: Creates tables for content pieces, SEO keywords, organic traffic snapshots, ad campaigns, lead source attribution, and weekly briefs.

--- TABLE 1: content_pieces ---
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'reel', 'carousel', 'story', 'video', 'email', 'case_study', 'other')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'linkedin', 'website', 'youtube', 'facebook', 'whatsapp', 'multiple')),
  target_keyword TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'in_review', 'scheduled', 'published')),
  scheduled_date DATE,
  published_date DATE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  content_url TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  leads_attributed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 2: seo_keywords ---
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_url TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('low', 'medium', 'high')),
  last_checked_at TIMESTAMPTZ,
  notes TEXT,
  is_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 3: organic_traffic_snapshots ---
CREATE TABLE IF NOT EXISTS organic_traffic_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  organic_sessions INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  top_landing_page TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_analytics', 'google_search_console')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 4: ad_campaigns ---
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'linkedin', 'youtube', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  objective TEXT CHECK (objective IN ('lead_generation', 'brand_awareness', 'traffic', 'conversions', 'reach')),
  monthly_budget DECIMAL(12,2) DEFAULT 0,
  spend_mtd DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  external_campaign_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 5: lead_source_attribution ---
CREATE TABLE IF NOT EXISTS lead_source_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  ad_campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- TABLE 6: marketing_weekly_briefs ---
CREATE TABLE IF NOT EXISTS marketing_weekly_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary_text TEXT,
  key_wins TEXT[],
  key_concerns TEXT[],
  recommended_action TEXT,
  organic_sessions_delta DECIMAL(5,2),
  paid_spend_delta DECIMAL(5,2),
  leads_delta DECIMAL(5,2),
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled_date ON content_pieces(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_is_tracking ON seo_keywords(is_tracking);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_organic_traffic_snapshots_date ON organic_traffic_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_lead_source_attribution_lead_id ON lead_source_attribution(lead_id);

-- ENABLE RLS
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE organic_traffic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_weekly_briefs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES Pattern: Same as other tables in the codebase
-- Admin has full access.
-- Others have SELECT only.

DO $$
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY['content_pieces', 'seo_keywords', 'organic_traffic_snapshots', 'ad_campaigns', 'lead_source_attribution', 'marketing_weekly_briefs'];
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Admin full access on ' || t || '" ON ' || t;
        EXECUTE 'CREATE POLICY "Admin full access on ' || t || '" ON ' || t || ' FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
        )';

        EXECUTE 'DROP POLICY IF EXISTS "All others select on ' || t || '" ON ' || t;
        EXECUTE 'CREATE POLICY "All others select on ' || t || '" ON ' || t || ' FOR SELECT USING (true)';
    END LOOP;
END $$;

-- UPDATE TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

drop trigger if exists update_content_pieces_updated_at on content_pieces;
create trigger update_content_pieces_updated_at
    BEFORE UPDATE on content_pieces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
drop trigger if exists update_seo_keywords_updated_at on seo_keywords;
create trigger update_seo_keywords_updated_at
    BEFORE UPDATE on seo_keywords FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
drop trigger if exists update_ad_campaigns_updated_at on ad_campaigns;
create trigger update_ad_campaigns_updated_at
    BEFORE UPDATE on ad_campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ════════ END 20260309184740_create_agency_marketing_tables.sql ════════


-- ============================================================
-- EXTRAS (added 2026-06-12 during schema sync)
-- ============================================================

-- /manager/pipeline expects this column (rest of the legacy
-- pipeline_stage system is intentionally NOT applied — the app
-- uses outreach_stage as the single source of truth).
alter table public.leads add column if not exists lead_quality_score integer default 0;

-- /admin/sessions + sessions CSV export read this view.
create or replace view public.user_sessions_clamped as
select
  s.*,
  round(
    (extract(epoch from (coalesce(s.logout_at, least(s.last_seen_at + interval '20 minutes', now())) - s.login_at)) / 3600.0)::numeric,
    2
  ) as duration_hours_clamped
from public.user_sessions s;


-- ════════ BEGIN 20260611000001_leads_meeting_columns.sql ════════
-- Meetings page (app/admin/meetings) writes these two columns.
-- Previously tracked only as a manual snippet in CLAUDE.md; this is
-- the versioned migration so every environment gets them.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_notes TEXT;

-- Team management (app/admin/team/user-actions.ts): deactivation flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Partial payments (recordInvoicePayment in app/admin/finance/actions.ts)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- ════════ END 20260611000001_leads_meeting_columns.sql ════════


-- ════════ BEGIN 20260611000000_harden_rls_policies.sql ════════
-- ============================================================
-- HARDEN RLS — 2026-06-11
--
-- Before this migration, most tables had catch-all policies of
-- the form  USING (true) WITH CHECK (true)  applied to ALL roles
-- (including anon). Since the anon key ships in the browser
-- bundle, the entire database was publicly readable and writable.
--
-- This migration:
--   1. Drops every truly-permissive policy (qual/with_check = true
--      granted to the public role set).
--   2. Enables RLS on every table in the public schema.
--   3. Adds an authenticated-only catch-all policy to any table
--      left without policies, so the app keeps working for
--      logged-in staff while anon is fully locked out.
--   4. Role-scopes sensitive tables (finance, audit, profiles).
--
-- Public-by-design flows (landing-page lead capture, magic-link
-- client reports) no longer rely on anon table access — they go
-- through server-side service-role code paths.
-- ============================================================

-- ---------------------------------------------------------
-- 0. SECURITY DEFINER role helper (avoids RLS recursion when
--    policies need the caller's role from profiles)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fmos_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.fmos_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.fmos_role() TO authenticated;

-- Resolves the clients.id for a portal user (matched by login email).
CREATE OR REPLACE FUNCTION public.fmos_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients
  WHERE primary_email = auth.jwt()->>'email'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fmos_client_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.fmos_client_id() TO authenticated;

-- True for internal staff (everything except the client portal role).
CREATE OR REPLACE FUNCTION public.fmos_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'telecaller', 'strategist', 'pm', 'staff', 'manager')
     FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.fmos_is_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.fmos_is_staff() TO authenticated;

-- ---------------------------------------------------------
-- 1. Drop truly-permissive policies (USING (true) open to all
--    roles). Leaves properly-scoped policies untouched.
-- ---------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles = '{public}'::name[]
      AND (qual IS NULL OR qual = 'true')
      AND (with_check IS NULL OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- 2. Enable RLS on every table; 3. add authenticated catch-all
--    where a table would otherwise have no policies at all.
-- ---------------------------------------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t.tablename
    ) THEN
      -- Staff-only, not merely authenticated: portal users (role
      -- 'client') must not get blanket access to CRM tables.
      EXECUTE format(
        'CREATE POLICY fmos_staff_all ON public.%I FOR ALL TO authenticated USING (public.fmos_is_staff()) WITH CHECK (public.fmos_is_staff())',
        t.tablename
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- 4. Role-scoped policies for sensitive tables.
--    Replace whatever catch-all landed on them above.
-- ---------------------------------------------------------

-- ---- profiles: everyone signed-in can read (role lookups are
--      used app-wide); users may update only their own row;
--      admins manage all rows.
DROP POLICY IF EXISTS fmos_staff_all ON public.profiles;
  DROP POLICY IF EXISTS fmos_authenticated_all ON public.profiles;
DROP POLICY IF EXISTS fmos_profiles_select ON public.profiles;
DROP POLICY IF EXISTS fmos_profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS fmos_profiles_admin_all ON public.profiles;

CREATE POLICY fmos_profiles_select ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fmos_profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY fmos_profiles_admin_all ON public.profiles
  FOR ALL TO authenticated USING (public.fmos_role() = 'admin') WITH CHECK (public.fmos_role() = 'admin');

-- ---- finance tables: admin only
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['invoices', 'invoice_line_items', 'expenses']
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS fmos_staff_all ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS fmos_authenticated_all ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS fmos_admin_only ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY fmos_admin_only ON public.%I FOR ALL TO authenticated USING (public.fmos_role() = ''admin'') WITH CHECK (public.fmos_role() = ''admin'')',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ---- audit_logs: any signed-in user may insert their own rows;
--      only admins may read; nobody may update or delete.
DROP POLICY IF EXISTS fmos_staff_all ON public.audit_logs;
  DROP POLICY IF EXISTS fmos_authenticated_all ON public.audit_logs;
DROP POLICY IF EXISTS fmos_audit_insert ON public.audit_logs;
DROP POLICY IF EXISTS fmos_audit_admin_read ON public.audit_logs;

CREATE POLICY fmos_audit_insert ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fmos_audit_admin_read ON public.audit_logs
  FOR SELECT TO authenticated USING (public.fmos_role() = 'admin');

-- ---- user_sessions / attendance: users see and write their own
--      rows; admins see everything.
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['user_sessions', 'attendance_sessions']
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS fmos_staff_all ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS fmos_authenticated_all ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS fmos_own_rows ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS fmos_admin_read ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY fmos_own_rows ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY fmos_admin_read ON public.%I FOR SELECT TO authenticated USING (public.fmos_role() = ''admin'')',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ---- attendance_breaks has no user_id; scope through the
--      owning attendance session.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'attendance_breaks' AND c.relkind = 'r'
  ) THEN
    DROP POLICY IF EXISTS fmos_staff_all ON public.attendance_breaks;
  DROP POLICY IF EXISTS fmos_authenticated_all ON public.attendance_breaks;
    DROP POLICY IF EXISTS fmos_own_breaks ON public.attendance_breaks;
    DROP POLICY IF EXISTS fmos_admin_read_breaks ON public.attendance_breaks;
    CREATE POLICY fmos_own_breaks ON public.attendance_breaks
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = session_id AND s.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = session_id AND s.user_id = auth.uid()
      ));
    CREATE POLICY fmos_admin_read_breaks ON public.attendance_breaks
      FOR SELECT TO authenticated USING (public.fmos_role() = 'admin');
  END IF;
END $$;

-- ---------------------------------------------------------
-- 5. Client-portal access (role = 'client', matched to a clients
--    row by login email). Grants only what /client/dashboard uses:
--    read own client/projects/milestones/deliverables/reports,
--    approve milestones, review deliverables, send notifications.
-- ---------------------------------------------------------
DO $$
BEGIN
  -- clients: read own row
  DROP POLICY IF EXISTS fmos_client_read_own ON public.clients;
  CREATE POLICY fmos_client_read_own ON public.clients
    FOR SELECT TO authenticated USING (id = public.fmos_client_id());

  -- projects: read own projects
  DROP POLICY IF EXISTS fmos_client_read_projects ON public.projects;
  CREATE POLICY fmos_client_read_projects ON public.projects
    FOR SELECT TO authenticated USING (client_id = public.fmos_client_id());

  -- project_milestones: read + approve on own projects
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'project_milestones') THEN
    DROP POLICY IF EXISTS fmos_client_milestones ON public.project_milestones;
    CREATE POLICY fmos_client_milestones ON public.project_milestones
      FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM public.projects WHERE client_id = public.fmos_client_id()))
      WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE client_id = public.fmos_client_id()));
  END IF;

  -- client_deliverables: read + review on own projects
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'client_deliverables') THEN
    DROP POLICY IF EXISTS fmos_client_deliverables ON public.client_deliverables;
    CREATE POLICY fmos_client_deliverables ON public.client_deliverables
      FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM public.projects WHERE client_id = public.fmos_client_id()))
      WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE client_id = public.fmos_client_id()));
  END IF;

  -- client_reports: read own reports
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'client_reports') THEN
    DROP POLICY IF EXISTS fmos_client_reports ON public.client_reports;
    CREATE POLICY fmos_client_reports ON public.client_reports
      FOR SELECT TO authenticated USING (client_id = public.fmos_client_id());
  END IF;

  -- notifications: portal users may notify staff (deliverable
  -- reviewed / milestone approved) and read their own.
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'notifications') THEN
    DROP POLICY IF EXISTS fmos_client_notifications_insert ON public.notifications;
    CREATE POLICY fmos_client_notifications_insert ON public.notifications
      FOR INSERT TO authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS fmos_client_notifications_own ON public.notifications;
    CREATE POLICY fmos_client_notifications_own ON public.notifications
      FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.fmos_is_staff());
  END IF;
END $$;

-- ---------------------------------------------------------
-- 6. Verification (run manually after applying):
--
--   SELECT tablename, policyname, roles, qual
--   FROM pg_policies WHERE schemaname = 'public'
--   ORDER BY tablename;
--
--   Expect: no rows with roles = {public} and qual = true.
-- ---------------------------------------------------------

-- ════════ END 20260611000000_harden_rls_policies.sql ════════


-- ════════ BEGIN 20260611000002_audit_triggers.sql ════════
-- ============================================================
-- SERVER-SIDE AUDIT TRIGGERS — 2026-06-11
--
-- Until now auditing relied on lib/audit.ts running in the
-- browser: best-effort, skippable, and absent from the busiest
-- write path (telecaller outcome logging). These triggers make
-- the database itself record every insert/update/delete on core
-- CRM tables, regardless of which client performed the write.
--
-- Client-side logAudit() calls keep working — they add richer
-- human summaries — but the trigger trail is the source of truth.
-- ============================================================

-- Stores only the keys that actually changed (plus id) for updates.
CREATE OR REPLACE FUNCTION public.fmos_jsonb_diff(old_row jsonb, new_row jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    jsonb_object_agg(key, value),
    '{}'::jsonb
  )
  FROM jsonb_each(new_row)
  WHERE old_row -> key IS DISTINCT FROM value;
$$;

CREATE OR REPLACE FUNCTION public.fmos_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_user_name text := 'system';
  v_user_role text := 'system';
  v_action text := lower(TG_OP);
  v_resource_id text;
  v_label text;
  v_old jsonb;
  v_new jsonb;
  v_summary text;
  v_old_stage text;
  v_new_stage text;
BEGIN
  -- Resolve actor identity when a user session exists
  IF v_actor IS NOT NULL THEN
    SELECT COALESCE(full_name, 'unknown'), COALESCE(role, 'unknown')
      INTO v_user_name, v_user_role
      FROM public.profiles WHERE id = v_actor;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_resource_id := v_new ->> 'id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_resource_id := v_new ->> 'id';

    -- Skip no-op updates (e.g. touch writes that change nothing)
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;

    -- Keep updates compact: store only changed keys
    v_new := public.fmos_jsonb_diff(v_old, to_jsonb(NEW));
    v_old := public.fmos_jsonb_diff(to_jsonb(NEW), v_old);

    -- Surface lead stage moves as their own action type
    IF TG_TABLE_NAME = 'leads'
       AND (v_old ? 'outreach_stage' OR v_old ? 'status') THEN
      v_action := 'stage_change';
      v_old_stage := to_jsonb(OLD) ->> 'outreach_stage';
      v_new_stage := to_jsonb(NEW) ->> 'outreach_stage';
    END IF;
  ELSE -- DELETE
    v_old := to_jsonb(OLD);
    v_resource_id := v_old ->> 'id';
  END IF;

  v_label := COALESCE(
    COALESCE(v_new, v_old) ->> 'company_name',
    COALESCE(v_new, v_old) ->> 'business_name',
    COALESCE(v_new, v_old) ->> 'proposal_number',
    COALESCE(v_new, v_old) ->> 'agreement_number',
    COALESCE(v_new, v_old) ->> 'invoice_number',
    COALESCE(v_new, v_old) ->> 'title',
    COALESCE(v_new, v_old) ->> 'name',
    to_jsonb(COALESCE(OLD, NEW)) ->> 'company_name',
    to_jsonb(COALESCE(OLD, NEW)) ->> 'business_name',
    to_jsonb(COALESCE(OLD, NEW)) ->> 'title'
  );

  v_summary := CASE
    WHEN v_action = 'stage_change' THEN
      format('Stage: %s → %s', COALESCE(v_old_stage, '—'), COALESCE(v_new_stage, '—'))
    ELSE
      format('%s %s%s', initcap(v_action), rtrim(TG_TABLE_NAME, 's'),
             CASE WHEN v_label IS NOT NULL THEN ' · ' || v_label ELSE '' END)
  END;

  INSERT INTO public.audit_logs (
    actor_id, user_name, user_role,
    action, resource_type, resource_id, resource_label,
    old_value, new_value, summary,
    entity_type, entity_id
  ) VALUES (
    v_actor, v_user_name, v_user_role,
    v_action, rtrim(TG_TABLE_NAME, 's'), v_resource_id, v_label,
    v_old, v_new, v_summary,
    rtrim(TG_TABLE_NAME, 's'),
    CASE WHEN v_resource_id ~ '^[0-9a-f]{8}-' THEN v_resource_id::uuid ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Auditing must never block the business write
  RAISE WARNING 'fmos_audit_trigger failed on %: %', TG_TABLE_NAME, SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to every core CRM table that exists
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'leads', 'clients', 'proposals', 'agreements', 'invoices',
    'expenses', 'tasks', 'projects', 'deals', 'meetings'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS fmos_audit ON public.%I', tbl);
      EXECUTE format(
        'CREATE TRIGGER fmos_audit
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.fmos_audit_trigger()',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- audit_logs itself must never be audited (infinite loop) and the
-- trigger function writes with definer rights, so no extra policy
-- changes are needed beyond the hardened RLS migration.

-- ════════ END 20260611000002_audit_triggers.sql ════════


-- ════════ BEGIN 20260611000003_hot_column_indexes.sql ════════
-- ============================================================
-- HOT-COLUMN INDEXES — 2026-06-11
--
-- The most-filtered columns in the app had no indexes (the leads
-- table had exactly one). These cover the cockpit queue, outreach
-- board, meetings page, follow-up checks, duplicate detection,
-- task views, and the cron sweeps.
-- ============================================================

-- leads: pipeline position + queue ordering
CREATE INDEX IF NOT EXISTS idx_leads_outreach_stage ON public.leads (outreach_stage);
CREATE INDEX IF NOT EXISTS idx_leads_status         ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON public.leads (follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_exec  ON public.leads (assigned_sales_exec) WHERE assigned_sales_exec IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_city           ON public.leads (city);
CREATE INDEX IF NOT EXISTS idx_leads_industry       ON public.leads (industry);
CREATE INDEX IF NOT EXISTS idx_leads_phone          ON public.leads (phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at     ON public.leads (created_at DESC);
-- cron SLA sweeps filter on these together
CREATE INDEX IF NOT EXISTS idx_leads_sla_sweep      ON public.leads (lead_type, last_contacted_at, created_at) WHERE last_contacted_at IS NULL;

-- tasks: board + overdue cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON public.tasks (status, due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned   ON public.tasks (assigned_to) WHERE assigned_to IS NOT NULL;
  END IF;
END $$;

-- proposals / agreements: lead profile lookups
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'proposals') THEN
    CREATE INDEX IF NOT EXISTS idx_proposals_lead   ON public.proposals (lead_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals (status);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'agreements') THEN
    CREATE INDEX IF NOT EXISTS idx_agreements_lead ON public.agreements (lead_id, created_at DESC);
  END IF;
END $$;

-- outreach_logs: lead profile history + telecaller stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'outreach_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_outreach_logs_lead  ON public.outreach_logs (lead_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_outreach_logs_actor ON public.outreach_logs (actor_id, created_at DESC);
  END IF;
END $$;

-- clients: list filters + portal email lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'clients') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_status        ON public.clients (status);
    CREATE INDEX IF NOT EXISTS idx_clients_primary_email ON public.clients (primary_email);
  END IF;
END $$;

-- invoices: finance dashboard filters
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'invoices') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON public.invoices (status, due_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_client     ON public.invoices (client_id);
  END IF;
END $$;

-- ════════ END 20260611000003_hot_column_indexes.sql ════════
-- ════════ PHASE F Stage 0 — inbound + ads tracking ════════

-- Raw webhook/event log: every inbound hit is recorded before processing
create table if not exists inbound_events (
  id uuid default gen_random_uuid() primary key,
  channel text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status in ('received','processed','duplicate','failed')),
  error text,
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_inbound_events_channel on inbound_events(channel, created_at desc);
create index if not exists idx_inbound_events_status on inbound_events(status);
alter table inbound_events enable row level security;
drop policy if exists "Authenticated read inbound events" on inbound_events;
create policy "Authenticated read inbound events" on inbound_events for select using (auth.uid() is not null);

-- Daily-grain ad performance (CSV import now, API sync later)
create table if not exists ad_insights_daily (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  campaign_id uuid references ad_campaigns(id) on delete cascade,
  platform text not null check (platform in ('meta','google','linkedin','youtube','other')),
  campaign_external_id text,
  adset_name text,
  ad_name text,
  spend numeric(12,2) default 0,
  impressions integer default 0,
  clicks integer default 0,
  leads integer default 0,
  created_at timestamptz default now()
);
create unique index if not exists idx_ad_insights_unique
  on ad_insights_daily(date, platform, coalesce(campaign_external_id,''), coalesce(adset_name,''), coalesce(ad_name,''));
create index if not exists idx_ad_insights_campaign on ad_insights_daily(campaign_id, date desc);
alter table ad_insights_daily enable row level security;
drop policy if exists "Authenticated manage ad insights" on ad_insights_daily;
create policy "Authenticated manage ad insights" on ad_insights_daily for all using (auth.uid() is not null);

-- Lead source quick-filters + speed-to-lead timestamps
alter table leads add column if not exists lead_source text;
alter table leads add column if not exists captured_at timestamptz;
alter table leads add column if not exists first_contact_at timestamptz;
create index if not exists idx_leads_lead_source on leads(lead_source);

notify pgrst, 'reload schema';
-- ad_campaigns existed pre-sync with an older shape; align it to the expected schema
alter table public.ad_campaigns add column if not exists objective text;
alter table public.ad_campaigns add column if not exists monthly_budget numeric(12,2) default 0;
alter table public.ad_campaigns add column if not exists spend_mtd numeric(12,2) default 0;
alter table public.ad_campaigns add column if not exists impressions integer default 0;
alter table public.ad_campaigns add column if not exists clicks integer default 0;
alter table public.ad_campaigns add column if not exists leads_generated integer default 0;
alter table public.ad_campaigns add column if not exists conversions integer default 0;
alter table public.ad_campaigns add column if not exists cpc numeric(10,2) default 0;
alter table public.ad_campaigns add column if not exists cpl numeric(10,2) default 0;
alter table public.ad_campaigns add column if not exists roas numeric(10,2) default 0;
alter table public.ad_campaigns add column if not exists start_date date;
alter table public.ad_campaigns add column if not exists end_date date;
alter table public.ad_campaigns add column if not exists external_campaign_id text;
alter table public.ad_campaigns add column if not exists notes text;
alter table public.ad_campaigns add column if not exists cpl_target numeric(10,2);
notify pgrst, 'reload schema';

-- ============================================================
-- 2026-06-12 (PHASE F STAGE 1) — WhatsApp Cloud API webhook
-- Idempotent. Run via dashboard SQL editor.
-- ============================================================

-- whatsapp_logs: support inbound messages + delivery receipts
alter table public.whatsapp_logs add column if not exists direction text not null default 'outbound';
alter table public.whatsapp_logs add column if not exists wa_message_id text;
alter table public.whatsapp_logs add column if not exists message_type text;
alter table public.whatsapp_logs add column if not exists delivery_status text;
alter table public.whatsapp_logs add column if not exists phone text;
create index if not exists idx_whatsapp_logs_wa_message_id on public.whatsapp_logs(wa_message_id);
create index if not exists idx_whatsapp_logs_direction on public.whatsapp_logs(direction);

-- app_settings: generic key/value store (first use: WhatsApp auto-greeting toggle)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "Authenticated can read settings" on public.app_settings;
create policy "Authenticated can read settings" on public.app_settings
  for select using (auth.uid() is not null);
drop policy if exists "Authenticated can write settings" on public.app_settings;
create policy "Authenticated can write settings" on public.app_settings
  for all using (auth.uid() is not null);

insert into public.app_settings (key, value) values
  ('whatsapp_auto_greeting',
   '{"enabled": true, "message": "Got your enquiry — we''ll call you shortly. 😊\n— FortuneMarq"}'::jsonb)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
