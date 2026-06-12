"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export type UploadLeadParams = {
    company_name: string;
    phone: string | null;
    has_website: boolean;
    website_link: string | null;
    gmb_link: string | null;
    industry: string;
    city: string;
    source: string;
    import_batch_id: string;
    lead_type: string;
    serp_ranked?: boolean | null;
    serp_source?: string | null;
    tags?: string[];
};

export async function uploadLeads(leads: UploadLeadParams[]) {
    const supabase = await createServerClientWithCookies();
    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 1. Fetch existing leads to check for duplicates
    // Note: For very large datasets, this might need batching or a specialized RPC function.
    // For standard uploads (e.g. < 1000 rows), fetching names/phones is acceptable.

    // We'll fetch just ID, company_name, and phone for comparison
    const { data: existingLeads, error: fetchError } = await supabase
        .from("leads")
        .select("company_name, phone") as { data: { company_name: string | null, phone: string | null }[] | null, error: any };

    if (fetchError) {
        return { success: false, message: "Failed to check existing leads for duplicates." };
    }

    // Create sets for O(1) lookup
    // Normalize phone numbers: remove all non-digits for comparison
    const normalizePhone = (p: string | null) => p ? p.replace(/\D/g, "") : "";
    const existingNames = new Set(existingLeads?.map(l => l.company_name?.toLowerCase().trim()) || []);
    const existingPhones = new Set(existingLeads?.map(l => normalizePhone(l.phone)) || []);

    const leadsToInsert: UploadLeadParams[] = [];

    for (const lead of leads) {
        // Validation: Business Name is required
        if (!lead.company_name || lead.company_name.trim() === "") {
            continue; // Skip invalid rows
        }

        const normName = lead.company_name.toLowerCase().trim();
        const normPhone = normalizePhone(lead.phone);

        // Duplicate Check
        const nameExists = existingNames.has(normName);
        const phoneExists = normPhone && existingPhones.has(normPhone);

        if (nameExists || (normPhone && phoneExists)) {
            skippedCount++;
        } else {
            leadsToInsert.push(lead);
            // Add to sets to prevent duplicates within the same upload batch
            existingNames.add(normName);
            if (normPhone) existingPhones.add(normPhone);
        }
    }

    if (leadsToInsert.length > 0) {
        // Insert in batches of 50 to avoid request size limits
        const batchSize = 50;
        for (let i = 0; i < leadsToInsert.length; i += batchSize) {
            const batch = leadsToInsert.slice(i, i + batchSize);
            // @ts-ignore
            const { error } = await supabase.from("leads").insert(batch as any);

            if (error) {
                console.error("Batch insert error:", error);
                errors.push(error.message);
            } else {
                addedCount += batch.length;
            }
        }

        // Log Audit
        await logAudit({
            action: 'create',
            resourceType: 'lead',
            resourceLabel: `Batch upload: ${addedCount} leads added, ${skippedCount} skipped`,
            newValue: { addedCount, skippedCount, batch_id: leads[0]?.import_batch_id }
        });
    }

    revalidatePath("/admin/upload");
    revalidatePath("/admin/sales");
    revalidatePath("/sales");

    if (errors.length > 0) {
        return {
            success: false,
            message: `Uploaded ${addedCount} leads. Skipped ${skippedCount} duplicates. Errors occurred during insert.`
        };
    }

    return {
        success: true,
        addedCount,
        skippedCount,
        message: `Successfully uploaded ${addedCount} leads. Skipped ${skippedCount} duplicates.`
    };
}
