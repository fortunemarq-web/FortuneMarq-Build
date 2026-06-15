import { createClient } from "@/lib/supabase";

export type NotificationType =
    | 'task_assigned'
    | 'follow_up_due'
    | 'follow_up_overdue'
    | 'lead_status_changed'
    | 'deliverable_approval_requested'
    | 'deliverable_approved'
    | 'deliverable_revision'
    | 'deal_closed'
    | 'report_published'
    | 'ai_insight'
    | 'system';

export async function sendNotification({
    userId,
    type,
    title,
    body,
    link,
    entityType,
    entityId
}: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    entityType?: string;
    entityId?: string;
}) {
    const supabase = createClient() as any;

    // 1. Deduplication: Check if similar notification exists in last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("entity_id", entityId)
        .gt("created_at", twelveHoursAgo)
        .limit(1);

    if (existing && existing.length > 0) return;

    // 2. Insert
    const { error } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            type,
            title,
            body,
            link,
            entity_type: entityType,
            entity_id: entityId
        });

    if (error) {
        console.error("Error sending notification:", error);
    }
}
