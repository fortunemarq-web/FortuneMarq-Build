/**
 * Append-only / event child tables that reference a lead via `lead_id`. On a lead
 * merge these are re-pointed from the merged lead to the survivor so the survivor
 * keeps the full contact history. They are all multi-row-per-lead log tables with
 * no UNIQUE(lead_id) constraint, so re-pointing can't collide.
 *
 * Intentionally excluded: outreach_sequences (one-row-per-lead/stage — re-point could
 * violate a uniqueness assumption) and deals/proposals/agreements (financial records
 * — merging those is a separate, deliberate decision, not an automatic side effect).
 */
export const LEAD_CHILD_TABLES = [
  "lead_outcomes",
  "outreach_logs",
  "call_logs",
  "call_activities",
  "whatsapp_logs",
  "follow_ups",
  "meetings",
  "pdf_deliveries",
  "bot_threads",
] as const;

/** activity_events is keyed by (entity_type='lead', entity_id) rather than lead_id. */
export const ACTIVITY_EVENTS_TABLE = "activity_events";

/** Shape persisted in merges.moved_children: { table_name: [row ids re-pointed] }. */
export type MovedChildren = Record<string, string[]>;
