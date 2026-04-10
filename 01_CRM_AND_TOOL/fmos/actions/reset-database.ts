"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function resetDatabase() {
    const supabase = await createServerClientWithCookies();

    try {
        // We use a filter that matches everything to delete all rows.
        // Assuming 'id' is a primary key and is not null.

        // 1. Delete Lead Outcomes (Child of Leads)
        // Try/Catch for each in case table doesn't exist
        try {
            await supabase.from("lead_outcomes").delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (e) { console.log('lead_outcomes delete failed/skipped', e) }

        // 2. Delete Leads
        const { error: leadsError } = await supabase.from("leads").delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Delete Market Insights
        await supabase.from("market_insights").delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 4. Delete CSV Uploads History
        await supabase.from("csv_uploads").delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 5. Delete Alerts (start fresh)
        try {
            await supabase.from("alerts").delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (e) { }

        if (leadsError) {
            console.error("Reset Error (Leads):", leadsError);
            return { success: false, message: `Failed to reset leads: ${leadsError.message}` };
        }

        revalidatePath("/");
        revalidatePath("/admin/upload/debug");

        return { success: true, message: "All data (leads, history, insights) has been wiped." };
    } catch (error: any) {
        console.error("Critical Reset Error:", error);
        return { success: false, message: error.message };
    }
}
