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

create policy "Admins can see all call logs" on call_logs for select
    using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager')));

create policy "Telecallers can see own call logs" on call_logs for select
    using (auth.uid() = telecaller_id);

create policy "Telecallers can insert own call logs" on call_logs for insert
    with check (auth.uid() = telecaller_id);

create policy "Everyone can view leaderboard" on telecaller_leaderboard
    using (true);

create policy "Everyone can view telecaller stats" on telecaller_stats for select
    using (true);
