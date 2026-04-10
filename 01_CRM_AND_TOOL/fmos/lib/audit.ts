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

    let userName = "Public / System";
    let userRole = "guest";
    let userId = null;

    if (user) {
      userId = user.id;
      // Fetch user profile for name and role
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single() as any;

      userName = (profile as any)?.full_name || user.email || "Unknown User";
      userRole = (profile as any)?.role || "unknown";
    }

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_label: resourceLabel,
      old_value: oldValue,
      new_value: newValue,
    } as any);

    if (error) {
      console.error("Failed to log audit:", error);
    }
  } catch (err) {
    console.error("Error in logAudit:", err);
  }
}
