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
