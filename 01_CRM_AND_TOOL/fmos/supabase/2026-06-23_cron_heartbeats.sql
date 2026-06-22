-- ============================================================================
-- 6.8 Automation Health Monitoring — cron heartbeat
-- Run in the Supabase dashboard SQL editor (project cnwooodktqwvpzkucskm).
-- Additive only. Safe to re-run (idempotent).
-- ============================================================================

create table if not exists public.cron_heartbeats (
  job_name         text primary key,
  last_run_at      timestamptz not null default now(),
  last_status      text        not null default 'ok',   -- 'ok' | 'error'
  last_error       text,
  last_duration_ms integer,
  run_count        bigint      not null default 0,
  updated_at       timestamptz not null default now()
);

alter table public.cron_heartbeats enable row level security;

-- Admins can read the health grid in the app. Writes happen via the service role
-- (cron routes) / the SECURITY DEFINER function below — never from the browser.
drop policy if exists "cron_heartbeats admin read" on public.cron_heartbeats;
create policy "cron_heartbeats admin read" on public.cron_heartbeats
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Atomic upsert + run_count increment. Called by lib/cron-heartbeat.ts → recordRun().
create or replace function public.cron_heartbeat(
  p_job    text,
  p_status text    default 'ok',
  p_error  text    default null,
  p_ms     integer default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cron_heartbeats as h
    (job_name, last_run_at, last_status, last_error, last_duration_ms, run_count, updated_at)
  values
    (p_job, now(), coalesce(p_status, 'ok'), p_error, p_ms, 1, now())
  on conflict (job_name) do update set
    last_run_at      = now(),
    last_status      = coalesce(p_status, 'ok'),
    last_error       = p_error,
    last_duration_ms = p_ms,
    run_count        = h.run_count + 1,
    updated_at       = now();
end;
$$;

grant execute on function public.cron_heartbeat(text, text, text, integer) to service_role, authenticated;
