-- ─────────────────────────────────────────────────────────────────────────────
-- STAGING SCHEMA PARITY — foreign keys the E2E staging DB was missing vs prod.
--
-- The staging Supabase (fmos-staging / nconijmbssfowwfqimlj) was built from the
-- consolidated schema SQL, which created the TABLES but NOT prod's FOREIGN KEYS.
-- PostgREST resolves embedded selects (e.g. proposals.select('*, lead:leads(...)'))
-- via FK constraints — so on staging those embeds errored and the list pages
-- (/admin/proposals, /admin/finance/invoices) returned empty / "Could not find a
-- relationship ... in the schema cache". The E2E specs (proposal-agreement,
-- record-payment) caught this. Prod HAS these FKs, so prod is fine — this is a
-- staging-fidelity gap, NOT a prod bug.
--
-- These three FKs are the ones the current E2E suite needs. Run them on any fresh
-- staging rebuild (then NOTIFY pgrst to reload the schema cache).
--
-- ⚠ BROADER FINDING: prod has ~140 FK constraints; staging had ~none. For a fully
-- faithful staging replica, regenerate the schema from prod (e.g. `supabase db dump
-- --schema-only` / `pg_dump --schema-only`) instead of the hand-maintained
-- consolidated SQL. The three below are a targeted unblock, not a full sync.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.proposals
  add constraint proposals_lead_id_fkey
  foreign key (lead_id) references public.leads(id) on delete cascade;

alter table public.invoice_line_items
  add constraint invoice_line_items_invoice_id_fkey
  foreign key (invoice_id) references public.invoices(id) on delete cascade;

alter table public.invoices
  add constraint invoices_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete set null;

-- /admin/agreements embeds lead:leads(...) AND proposal:proposals(...) — both FKs missing on staging.
alter table public.agreements
  add constraint agreements_lead_id_fkey
  foreign key (lead_id) references public.leads(id) on delete cascade;

alter table public.agreements
  add constraint agreements_proposal_id_fkey
  foreign key (proposal_id) references public.proposals(id) on delete set null;

-- Tell PostgREST to pick up the new relationships.
notify pgrst, 'reload schema';
