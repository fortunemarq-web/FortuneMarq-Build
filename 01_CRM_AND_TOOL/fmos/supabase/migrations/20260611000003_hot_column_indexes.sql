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
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to    ON public.leads (assigned_to) WHERE assigned_to IS NOT NULL;
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
