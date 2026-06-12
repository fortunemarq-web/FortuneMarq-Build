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
