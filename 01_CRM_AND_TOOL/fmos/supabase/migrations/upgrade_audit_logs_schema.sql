-- ─────────────────────────────────────────────────────────────────────────────
-- Upgrade audit_logs to new schema
-- Adds: resource_type, resource_id, resource_label, user_name, user_role,
--       old_value, new_value, summary
-- Keeps old columns for backwards-compat; new inserts use new columns only.
-- ─────────────────────────────────────────────────────────────────────────────

alter table audit_logs
  add column if not exists resource_type    text,
  add column if not exists resource_id      text,
  add column if not exists resource_label   text,
  add column if not exists user_name        text,
  add column if not exists user_role        text,
  add column if not exists old_value        jsonb,
  add column if not exists new_value        jsonb,
  add column if not exists summary          text;

-- Helpful indexes for the audit-log page filters
create index if not exists idx_audit_logs_resource_type on audit_logs(resource_type, created_at desc);
create index if not exists idx_audit_logs_action        on audit_logs(action, created_at desc);
create index if not exists idx_audit_logs_user_name     on audit_logs(user_name);

-- Make actor_id nullable (log can be created without auth in edge cases)
alter table audit_logs alter column actor_id drop not null;

-- Drop the old NOT NULL on entity_type / entity_id so new inserts (which
-- only fill resource_* columns) don't fail.
alter table audit_logs alter column entity_type drop not null;
alter table audit_logs alter column entity_id   drop not null;
