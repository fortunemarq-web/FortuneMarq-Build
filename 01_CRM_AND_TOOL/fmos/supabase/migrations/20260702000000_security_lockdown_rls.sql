-- ============================================================================
-- SECURITY LOCKDOWN 2026-07-02  (APPLIED TO PROD 2026-07-02 via Supabase)
-- Root problem: blanket "any authenticated user" RLS policies (USING true /
-- auth.role()='authenticated') let client-portal logins read+write all internal
-- CRM data and self-escalate to admin, plus an RLS-off leads backup + ad table
-- readable by the anon key. Replace blanket policies with STAFF-scoped ones.
-- Staff = has a profiles row (get_my_role() not null). Client-portal users have
-- no profiles row, so they are cleanly excluded. Service-role bypasses RLS.
-- Verified post-apply: admin+telecaller keep full access; a no-profile "client"
-- sees 0 leads/clients/tasks; a non-admin cannot change any profile role.
-- ============================================================================

-- 1. Drop the exposed, RLS-off leads backup (full lead DB readable via anon key)
drop table if exists public.leads_backup_20260619;

-- 2. ad_conversions: was RLS-off + anon ALL. Enable RLS => only the service-role
--    uploader (bypasses RLS) can touch it.
alter table public.ad_conversions enable row level security;

-- helper: is the caller a staff member (has a profiles row with a staff role)?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path to 'public'
as $$ select coalesce(public.get_my_role() in
  ('admin','telecaller','strategist','pm','staff'), false) $$;

-- 3. LEADS
drop policy if exists "Allow all for auth users" on public.leads;
drop policy if exists "Allow authenticated users to view leads" on public.leads;
drop policy if exists "Allow authenticated users to update leads" on public.leads;
drop policy if exists "Allow authenticated users to insert leads" on public.leads;
drop policy if exists fmos_leads_staff_all on public.leads;
create policy fmos_leads_staff_all on public.leads for all
  using (public.is_staff()) with check (public.is_staff());

-- 4. CLIENTS (staff full access; clients keep own-record read)
drop policy if exists "Enable select for authenticated users only" on public.clients;
drop policy if exists "Enable insert for authenticated users only" on public.clients;
drop policy if exists "Staff view all clients" on public.clients;
drop policy if exists fmos_clients_staff_all on public.clients;
create policy fmos_clients_staff_all on public.clients for all
  using (public.is_staff()) with check (public.is_staff());

-- 5. TASKS
drop policy if exists "Enable select for authenticated users only" on public.tasks;
drop policy if exists "Enable insert for authenticated users only" on public.tasks;
drop policy if exists "Enable update for authenticated users only" on public.tasks;
drop policy if exists "Internal view all tasks" on public.tasks;
drop policy if exists fmos_tasks_staff_all on public.tasks;
create policy fmos_tasks_staff_all on public.tasks for all
  using (public.is_staff()) with check (public.is_staff());

-- 6. PROFILES: remove blanket ALL (escalation vector) + blanket reads.
drop policy if exists "Allow all for auth users" on public.profiles;
drop policy if exists "Allow authenticated read profiles" on public.profiles;
drop policy if exists fmos_profiles_select on public.profiles;
drop policy if exists "Users view own profile" on public.profiles;
-- keep: "Users can read own profile", "Admins/PMs view all profiles",
--       fmos_profiles_update_self, fmos_profiles_admin_all

-- 7. Block privilege escalation: non-admins cannot change any profile's role
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role and coalesce(public.get_my_role(),'') <> 'admin' then
    raise exception 'Only an admin may change a profile role';
  end if;
  return new;
end $$;
drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 8. Orphaned public storage bucket (0 files, unused) -> private
update storage.buckets set public = false where id = 'agency-files';
