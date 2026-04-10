"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";

export async function captureInboundLead(formData: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    industry: string;
    city: string;
}) {
    const supabase = await createServerClientWithCookies();

    // 1. Check for duplicates (optional but good practice)
    const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", formData.phone)
        .single();

    if (existing) {
        return { success: false, message: "A lead with this phone number already exists." };
    }

    // 2. Insert as inbound lead
    const { data, error } = await (supabase.from("leads") as any).insert({
        ...formData,
        status: "new",
        lead_type: "inbound",
        source: "landing_page",
        notes: `Organic inbound lead from ${formData.industry} LP in ${formData.city}.`
    }).select().single();

    if (error) {
        console.error("Capture Lead Error:", error);
        return { success: false, error: error.message };
    }

    // Log Audit
    await logAudit({
        action: 'create',
        resourceType: 'lead',
        resourceId: data.id,
        resourceLabel: `Inbound Lead: ${formData.company_name}`,
        newValue: formData
    });

    return { success: true, data };
}
