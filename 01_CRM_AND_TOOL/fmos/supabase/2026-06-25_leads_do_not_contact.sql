-- 2026-06-25 — add the missing leads.do_not_contact column.
--
-- COMPLIANCE FIX: lib/whatsapp/suppression.ts getLeadGuardState() selects
-- (wa_opt_out, do_not_contact, last_inbound_at). The column never existed, so the
-- select errored and the guard fail-open'd to optedOut=false — i.e. STOP/opt-out
-- was NOT actually enforced on any proactive send. (Masked pre-go-live only by the
-- allowlist.) Adding the column makes getLeadGuardState read correctly and enables
-- the manual do-not-contact override the code already references.
-- Run in the Supabase SQL editor. Idempotent.

alter table public.leads
  add column if not exists do_not_contact boolean not null default false;
