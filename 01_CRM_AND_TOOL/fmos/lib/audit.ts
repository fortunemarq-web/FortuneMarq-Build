import { createClient } from "./supabase";

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'stage_change';
export type ResourceType = 'lead' | 'client' | 'task' | 'template' | 'niche_kit' | 'deliverable' | 'report' | 'profile';

interface AuditParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceLabel?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Logs an action to the audit_logs table.
 * Designed to be called from Server Actions (preferred) or Client Components.
 */
export async function logAudit({
  action,
  resourceType,
  resourceId,
  resourceLabel,
  oldValue,
  newValue
}: AuditParams) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id ?? null;

    const { error } = await supabase.from("audit_logs").insert({
      actor_id: userId,
      action,
      entity_type: resourceType,
      entity_id: resourceId ?? "system",
      before_data: oldValue ?? null,
      after_data: newValue ?? (resourceLabel ? { label: resourceLabel } : null),
    });

    if (error) {
      console.error("Failed to log audit:", error);
    }
  } catch (err) {
    console.error("Error in logAudit:", err);
  }
}
