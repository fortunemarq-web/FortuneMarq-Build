-- 2026-06-15 — Drop the orphaned whatsapp_message_templates table.
--
-- Context (audit H1): the app consolidated on `whatsapp_templates` as the single
-- WhatsApp template library (read by the sales picker, managed by the admin
-- Template Engine). The old niche × city × outcome table `whatsapp_message_templates`
-- held only 3 seed rows and its sole reader (whatsapp-template-button.tsx) was deleted,
-- so no application code references it anymore.
--
-- The only remaining dependency is the FK whatsapp_logs.template_id -> this table.
-- whatsapp_logs is ACTIVE (live WhatsApp webhook + lib/whatsapp/send.ts write to it),
-- but the active senders do not set template_id from this table, and the column is a
-- nullable "on delete set null" reference. Removing the constraint leaves the
-- nullable template_id column intact and changes nothing at runtime.
--
-- niches / cities are intentionally NOT dropped — other features still use them.
--
-- Idempotent: safe to run once via the Supabase SQL editor.

BEGIN;

ALTER TABLE public.whatsapp_logs
  DROP CONSTRAINT IF EXISTS whatsapp_logs_template_id_fkey;

DROP TABLE IF EXISTS public.whatsapp_message_templates;

COMMIT;
