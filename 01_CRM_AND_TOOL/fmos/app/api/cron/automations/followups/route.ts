import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";

export const POST = withHeartbeat("followups", postHandler);
import { type NextRequest, NextResponse } from "next/server";
import { runTrigger } from "@/lib/automations/engine";

async function postHandler(req: NextRequest) {
    const denied = verifyCronSecret(req);
    if (denied) return denied;

    const supabase = createAdminClient();

    try {
        const now = new Date();
        const { data: leads, error } = await supabase
            .from("leads")
            .select("*")
            .eq("status", "calling") // Target status e.g. active leads
            .lt("next_action_date", now.toISOString())
            .not("next_action_date", "is", null)
            .limit(50); // Batch size

        if (error) throw error;

        let processed = 0;
        for (const lead of (leads || []) as any[]) {
            // Check if already processed recently via engine logs? 
            // The engine handles throttling per rule.
            // We just trigger the event.
            await runTrigger("lead_followup_due", "lead", lead.id);
            processed++;
        }

        return NextResponse.json({ success: true, processed });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// Vercel Cron invokes via GET; same handler, same secret check.
export { POST as GET };
