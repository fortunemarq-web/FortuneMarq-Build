"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function deleteLeadsByIndustry(industry: string) {
    const supabase = await createServerClientWithCookies();

    try {
        let leadsToDelete: { id: string }[] = [];
        let fetchError;

        if (industry === "uncategorized") {
            // Fetch IDs for NULL industry
            const { data: nullData, error: nullError } = await supabase
                .from("leads")
                .select("id")
                .is("industry", null);

            if (nullError) throw new Error(nullError.message);

            // Fetch IDs for empty string industry
            const { data: emptyData, error: emptyError } = await supabase
                .from("leads")
                .select("id")
                .eq("industry", "");

            if (emptyError) throw new Error(emptyError.message);

            // Combine both lists
            leadsToDelete = [...(nullData || []), ...(emptyData || [])];
        } else {
            // Normal Industry Fetch
            const { data, error } = await supabase
                .from("leads")
                .select("id")
                .eq("industry", industry);

            leadsToDelete = data || [];
            fetchError = error;
        }

        if (fetchError) throw new Error(fetchError.message);

        // Deduplicate IDs just in case
        const leadIds = Array.from(new Set(leadsToDelete.map((l: any) => l.id)));

        if (leadIds.length === 0) {
            return { success: true, message: `No leads found for industry: ${industry}` };
        }

        // 2. Delete data (Outcomes then Leads)
        const BATCH_SIZE = 1000;
        for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
            const batch = leadIds.slice(i, i + BATCH_SIZE);

            // Delete outcomes first
            await supabase
                .from("lead_outcomes")
                .delete()
                .in("lead_id", batch);

            // Delete leads by ID (safest method to ensure we delete exactly what we found)
            await supabase
                .from("leads")
                .delete()
                .in("id", batch);
        }

        // 4. Clean up market insights (Only if specific industry is selected, not mixed uncategorized/blank)
        if (industry !== "uncategorized") {
            await supabase.from("market_insights").delete().eq("industry", industry);
        }

        revalidatePath("/admin/data-management");
        revalidatePath("/admin/sales");
        revalidatePath("/sales");

        const displayIndustry = industry === "uncategorized" ? "Uncategorized (No Industry)" : industry;

        await logAudit({
            action: 'delete',
            resourceType: 'lead',
            resourceLabel: `Bulk Deleted ${leadIds.length} leads for: ${displayIndustry}`,
            oldValue: { industry: displayIndustry, count: leadIds.length }
        });

        return { success: true, message: `Successfully deleted ${leadIds.length} leads for: ${displayIndustry}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteSingleLead(leadId: string) {
    const supabase = await createServerClientWithCookies();
    try {
        const { data: lead } = await supabase.from("leads").select("company_name").eq("id", leadId).single();

        await supabase.from("lead_outcomes").delete().eq("lead_id", leadId);
        const { error } = await supabase.from("leads").delete().eq("id", leadId);

        if (error) throw error;

        await logAudit({
            action: 'delete',
            resourceType: 'lead',
            resourceId: leadId,
            resourceLabel: `Deleted lead: ${(lead as any)?.company_name || 'Unknown'}`,
            oldValue: lead
        });

        revalidatePath("/admin/data-management");
        return { success: true, message: "Lead deleted successfully" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
