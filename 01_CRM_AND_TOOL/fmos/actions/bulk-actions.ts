"use server";

import { createServerClient } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

type TableName = "leads" | "deals" | "projects" | "tasks";

interface BulkUpdateResult {
    successCount: number;
    failedIds: string[];
}

export async function bulkUpdateEntity(
    entityType: string,
    ids: string[],
    updates: Record<string, unknown>,
    actionName: string = "bulk_update"
): Promise<BulkUpdateResult> {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    let successCount = 0;
    const failedIds: string[] = [];

    // Important: We process one by one or in batches to ensure Audit Logs are correct.
    // A single bulk update SQL is faster but harder to capture distinct "before" states for detailed audit logs unless we fetch first.

    // Strategy: Fetch all targets first
    let tableName: TableName;
    switch (entityType) {
        case 'lead': tableName = 'leads'; break;
        case 'deal': tableName = 'deals'; break;
        case 'project': tableName = 'projects'; break;
        case 'task': tableName = 'tasks'; break;
        default: throw new Error("Invalid entity type");
    }

    // Split into chunks of 50 to avoid massive loading? For now, simple loop max 50-100 is fine given requirements.
    const { data: currentRecords, error } = await supabase
        .from(tableName as any)
        .select("*")
        .in("id", ids);

    if (error || !currentRecords) {
        console.error("Bulk update fetch error", error);
        return { successCount: 0, failedIds: ids };
    }

    // Perform updates
    for (const record of (currentRecords as any) as Array<{ id: string }>) {
        try {
            // Apply update
            const { error: updateError } = await supabase
                .from(tableName as any)
                .update(updates as any)
                .eq("id", record.id);

            if (updateError) {
                failedIds.push(record.id);
                continue;
            }

            successCount++;

            // Log Audit
            await logAudit({
                action: 'update',
                resourceType: entityType as any,
                resourceId: record.id,
                resourceLabel: `Bulk Action: ${actionName}`,
                oldValue: record,
                newValue: { ...record, ...updates }
            });

        } catch (e) {
            console.error(`Failed to update ${entityType} ${record.id}`, e);
            failedIds.push(record.id);
        }
    }

    return { successCount, failedIds };
}

export async function bulkExport(
    entityType: string,
    filterQuery: any // In real implementation, pass filter config and reconstruct query
) {
    // This is better handled via a Route Handler (GET request) to stream the CSV download
    // See app/api/export/route.ts
}
