"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function analyzeIndustryDistribution() {
    const supabase = await createServerClientWithCookies();

    // Fetch all industries
    const { data, error } = await supabase
        .from("leads")
        .select("industry");

    if (error) {
        console.error("Analysis Error:", error);
        return { error: error.message };
    }

    const distribution: Record<string, number> = {};

    data?.forEach((row: any) => {
        // Convert null/undefined to explicit string for counting
        let key = row.industry;
        if (key === null) key = "NULL";
        if (key === undefined) key = "UNDEFINED";
        if (key === "") key = "EMPTY_STRING";
        if (typeof key === 'string' && key.trim() === "") key = "WHITESPACE_ONLY";

        distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
}
