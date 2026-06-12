import { createClient } from "./supabase";

export type AuditAction =
  | 'create' | 'update' | 'delete'
  | 'stage_change' | 'login' | 'logout' | 'export'
  | 'proposal_sent' | 'proposal_confirmed' | 'agreement_confirmed'
  | 'client_created' | 'meeting_outcome' | 'invoice_paid' | 'onboarding_complete';

export type ResourceType =
  | 'lead' | 'client' | 'proposal' | 'agreement' | 'invoice'
  | 'meeting' | 'task' | 'template' | 'niche_kit' | 'deliverable'
  | 'report' | 'profile' | 'onboarding';

interface AuditParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceLabel?: string;
  oldValue?: any;
  newValue?: any;
  summary?: string; // human-readable one-liner, e.g. "Stage changed: pdf_sent → follow_up_due"
}

/**
 * Logs an action to the audit_logs table.
 * Fetches the current user's name + role so the log is fully self-contained.
 */
export async function logAudit({
  action,
  resourceType,
  resourceId,
  resourceLabel,
  oldValue,
  newValue,
  summary,
}: AuditParams) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch name + role (best-effort — never throws)
    let userName = user.email?.split("@")[0] ?? "unknown";
    let userRole = "unknown";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      if (profile) {
        userName = (profile as any).full_name || userName;
        userRole = (profile as any).role || userRole;
      }
    } catch (_) {}

    const { error } = await (supabase.from("audit_logs") as any).insert({
      // identity
      actor_id: user.id,
      user_name: userName,
      user_role: userRole,
      // what happened
      action,
      resource_type: resourceType,
      resource_label: resourceLabel ?? null,
      resource_id: resourceId ?? null,
      // diff
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      // human summary
      summary: summary ?? null,
      // old schema compat — set to satisfy NOT NULL if migration hasn't run yet
      entity_type: resourceType ?? "unknown",
      entity_id: resourceId ?? "00000000-0000-0000-0000-000000000000",
    });

    if (error) console.error("[audit]", error.message);
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
