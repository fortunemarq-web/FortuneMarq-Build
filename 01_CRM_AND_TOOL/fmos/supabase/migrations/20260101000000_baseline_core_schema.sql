-- ============================================================================
-- BASELINE CORE SCHEMA (audit A1)
-- ----------------------------------------------------------------------------
-- No prior migration CREATEs the core tables (leads, clients, projects,
-- proposals, profiles) — they only ALTER them — so a clean replay into a fresh
-- database never builds them. This baseline creates them (plus their enums,
-- primary keys, checks, intra-core / auth foreign keys, and indexes) reproduced
-- from the live schema as of 2026-06-15.
--
-- The timestamp prefix (20260101000000) sorts BEFORE every existing migration,
-- so it runs first. Every statement is idempotent (IF NOT EXISTS / guarded DO
-- blocks), so running it against the existing production database is a no-op.
--
-- Foreign keys to NON-core tables (projects.deal_id -> deals,
-- proposals.meeting_id -> meetings, proposals.sequence_id -> outreach_sequences)
-- are added at the end via guarded blocks that only fire once the referenced
-- table exists, so this file is self-consistent whether replayed alone or as
-- part of the full migration set.
--
-- NOTE: RLS policies are intentionally NOT set here — 20260611000000_harden_rls_policies
-- owns that. This file only establishes table structure.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'lead_status' and n.nspname = 'public') then
    create type public.lead_status as enum (
      'new', 'first_call_pending', 'calling', 'contacted', 'qualified',
      'strategy_booked', 'strategy_completed', 'nurture', 'disqualified',
      'closed_won', 'closed_lost', 'proposal_sent'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'project_status' and n.nspname = 'public') then
    create type public.project_status as enum (
      'not_started', 'in_progress', 'needs_attention', 'on_hold', 'completed', 'closed'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum (
      'admin', 'sales_executive', 'marketing_strategist', 'project_manager',
      'execution_specialist', 'client'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        not null primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text        default 'sales_executive'::user_role,
  avatar_url  text,
  created_at  timestamptz not null default timezone('utc'::text, now()),
  first_name  text,
  last_name   text,
  is_active   boolean     default true
);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id                   uuid        not null default gen_random_uuid() primary key,
  user_id              uuid        references public.profiles(id),
  business_name        text        not null,
  primary_email        text,
  created_at           timestamptz not null default timezone('utc'::text, now()),
  monthly_value        numeric     default 0,
  status               text        default 'active'::text
                         constraint clients_status_check
                         check (status = any (array['active','inactive','churned','onboarding'])),
  city                 text,
  niche                text,
  services             text[],
  health_score         integer     default 3
                         constraint chk_health_score check (health_score >= 1 and health_score <= 5),
  renewal_date         date,
  onboarding_completed boolean     default false,
  last_upsell_attempt  date,
  upsell_notes         text,
  owner_name           text,
  phone                text,
  start_date           date        default CURRENT_DATE,
  notes                text,
  package_tier         text        constraint clients_package_tier_check
                         check (package_tier = any (array['starter','growth','pro','custom'])),
  services_active      jsonb       default '[]'::jsonb,
  upsell_eligible      boolean     default false
);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                       uuid        not null default gen_random_uuid() primary key,
  company_name             text        not null,
  contact_person           text,
  email                    text,
  phone                    text,
  industry                 text,
  city                     text,
  status                   public.lead_status default 'new'::lead_status,
  assigned_sales_exec      uuid        references public.profiles(id),
  assigned_strategist      uuid        references public.profiles(id),
  import_batch_id          text,
  next_action_date         timestamptz,
  notes                    text,
  created_at               timestamptz not null default now(),
  lead_source              text        default 'Manual Upload'::text,
  tags                     text[]      default '{}'::text[],
  last_interaction_note    text,
  intent_score             integer     default 0,
  website_url              text,
  has_website              boolean,
  gmb_link                 text,
  has_gmb                  boolean     default false,
  current_traffic_estimate text,
  strategy_session_at      timestamptz,
  deal_probability         integer     default 0,
  proposal_link            text,
  lead_type                text        default 'outbound'::text,
  source                   text,
  website_link             text,
  last_activity_at         timestamptz default now(),
  call_attempts            integer     default 0,
  last_call_outcome        text,
  last_connected_at        timestamptz,
  last_contacted_at        timestamptz,
  last_outcome             text,
  stale_flag               boolean     default false,
  meeting_booked_at        timestamptz,
  proposal_sent_at         timestamptz,
  outreach_stage           text        default 'touch1_pending'::text,
  serp_ranked              boolean,
  serp_source              text,
  last_outreach_at         timestamptz,
  pdf_sent_at              timestamptz,
  pdf_name                 text,
  follow_up_date           timestamptz,
  no_answer_count          integer     default 0,
  search_volume            integer,
  meeting_link             text,
  meeting_notes            text,
  gatekeeper_count         integer     default 0,
  phone_normalized         text,
  email_normalized         text,
  website_domain           text,
  phone_raw                text,
  is_merged                boolean     default false,
  merged_into              uuid        references public.leads(id),
  last_outcome_reason      text,
  stale_reason             text,
  lead_quality_score       integer     default 0,
  captured_at              timestamptz,
  first_contact_at         timestamptz
);

-- ---------------------------------------------------------------------------
-- projects  (deal_id FK added later — see guarded block)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id                    uuid        not null default gen_random_uuid() primary key,
  client_id             uuid        not null references public.clients(id),
  deal_id               uuid,
  service_type          text,
  status                public.project_status default 'not_started'::project_status,
  start_date            date,
  deadline              date,
  created_at            timestamptz not null default now(),
  health_status         text        default 'on_track'::text,
  build_type            text,
  assigned_pm           uuid        references auth.users(id),
  name                  text,
  project_type          text        default 'website_build'::text,
  completion_percentage integer     default 0,
  assigned_to           uuid        references public.profiles(id),
  delivery_stage        text        default 'brief'::text
);

-- ---------------------------------------------------------------------------
-- proposals  (meeting_id / sequence_id FKs added later — see guarded block)
-- ---------------------------------------------------------------------------
create table if not exists public.proposals (
  id                uuid        not null default gen_random_uuid() primary key,
  lead_id           uuid        not null references public.leads(id) on delete cascade,
  sequence_id       uuid,
  meeting_id        uuid,
  proposal_number   text        not null,
  proposal_type     text,
  sent_at           timestamptz default now(),
  sent_by           uuid        references auth.users(id),
  status            text        not null default 'sent'::text,
  quotation_sent_at timestamptz,
  agreement_sent_at timestamptz,
  closed_at         timestamptz,
  monthly_value     numeric,
  onetime_value     numeric,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  services          jsonb,
  total_setup       numeric,
  total_monthly     numeric,
  start_date        date,
  created_by        uuid        references public.profiles(id)
);

-- ---------------------------------------------------------------------------
-- Deferred foreign keys to non-core tables (only if the target table exists)
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'deals')
     and not exists (select 1 from pg_constraint where conname = 'projects_deal_id_fkey') then
    alter table public.projects
      add constraint projects_deal_id_fkey foreign key (deal_id) references public.deals(id);
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'meetings')
     and not exists (select 1 from pg_constraint where conname = 'proposals_meeting_id_fkey') then
    alter table public.proposals
      add constraint proposals_meeting_id_fkey foreign key (meeting_id) references public.meetings(id);
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'outreach_sequences')
     and not exists (select 1 from pg_constraint where conname = 'proposals_sequence_id_fkey') then
    alter table public.proposals
      add constraint proposals_sequence_id_fkey foreign key (sequence_id) references public.outreach_sequences(id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes (reproduced from live; PK indexes are implicit)
-- ---------------------------------------------------------------------------
-- clients
create index if not exists idx_clients_email         on public.clients (primary_email);
create index if not exists idx_clients_primary_email  on public.clients (primary_email);
create index if not exists idx_clients_health         on public.clients (health_score);
create index if not exists idx_clients_name           on public.clients (business_name);
create index if not exists idx_clients_renewal        on public.clients (renewal_date);
create index if not exists idx_clients_status         on public.clients (status);

-- leads
create index if not exists idx_leads_assigned_exec        on public.leads (assigned_sales_exec) where (assigned_sales_exec is not null);
create index if not exists idx_leads_assigned_sales       on public.leads (assigned_sales_exec);
create index if not exists idx_leads_assigned_strategist  on public.leads (assigned_strategist);
create index if not exists idx_leads_city                 on public.leads (city);
create index if not exists idx_leads_city_industry_status on public.leads (city, industry, status);
create index if not exists idx_leads_created_at           on public.leads (created_at desc);
create index if not exists idx_leads_email_norm           on public.leads (email_normalized);
create index if not exists idx_leads_follow_up_date       on public.leads (follow_up_date) where (follow_up_date is not null);
create index if not exists idx_leads_industry             on public.leads (industry);
create index if not exists idx_leads_last_activity        on public.leads (last_activity_at);
create index if not exists idx_leads_lead_source          on public.leads (lead_source);
create index if not exists idx_leads_next_action          on public.leads (next_action_date);
create index if not exists idx_leads_next_action_assigned on public.leads (next_action_date, assigned_sales_exec);
create index if not exists idx_leads_outreach_stage       on public.leads (outreach_stage);
create index if not exists idx_leads_phone                on public.leads (phone);
create index if not exists idx_leads_phone_norm           on public.leads (phone_normalized);
create index if not exists idx_leads_sla_sweep            on public.leads (lead_type, last_contacted_at, created_at) where (last_contacted_at is null);
create index if not exists idx_leads_status               on public.leads (status);
create index if not exists idx_leads_website_domain       on public.leads (website_domain);

-- projects
create index if not exists idx_projects_assigned_pm    on public.projects (assigned_pm);
create index if not exists idx_projects_client         on public.projects (client_id);
create index if not exists idx_projects_client_id      on public.projects (client_id);
create index if not exists idx_projects_delivery_stage on public.projects (delivery_stage);
create index if not exists idx_projects_status         on public.projects (status);

-- proposals
create index if not exists idx_proposals_lead    on public.proposals (lead_id, created_at desc);
create index if not exists idx_proposals_lead_id on public.proposals (lead_id);
create index if not exists idx_proposals_status  on public.proposals (status);
