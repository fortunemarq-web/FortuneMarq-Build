import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { type NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
    const denied = verifyCronSecret(req);
    if (denied) return denied;

    const supabase = createAdminClient();
    const now = new Date();

    // Define SLA Thresholds
    const INBOUND_SLA_MINUTES = 30;
    const OUTBOUND_SLA_HOURS = 24;

    const inboundThreshold = new Date(now.getTime() - INBOUND_SLA_MINUTES * 60000);
    const outboundThreshold = new Date(now.getTime() - OUTBOUND_SLA_HOURS * 3600000);

    let updatedCount = 0;

    try {
        // 1. Check Inbound Leads (created > 30mins ago, never contacted, not already stale)
        const { data: staleInbound, error: inboundError } = await (supabase.from("leads") as any)
            .select("*")
            .eq("lead_type", "inbound")
            .is("last_contacted_at", null)
            .lt("created_at", inboundThreshold.toISOString())
            .eq("stale_flag", false) // only process if not yet flagged
            .limit(100);

        if (inboundError) throw inboundError;

        if (staleInbound && staleInbound.length > 0) {
            for (const lead of staleInbound) {
                // Update lead
                await (supabase.from("leads") as any).update({
                    stale_flag: true,
                    stale_reason: "SLA Missed: Inbound not contacted within 30 mins"
                }).eq("id", lead.id);

                // Log Event (Activity Only, System Action)
                await logAudit({
                    action: "update",
                    resourceType: "lead",
                    resourceId: lead.id,
                    resourceLabel: lead.company_name,
                    newValue: { stale_flag: true, reason: "SLA Missed (Inbound)" },
                    summary: `SLA missed — inbound lead not contacted within 30 mins`,
                });

                updatedCount++;
            }
        }

        // 2. Check Outbound Leads (created > 24h ago, never contacted, not stale)
        const { data: staleOutbound, error: outboundError } = await (supabase.from("leads") as any)
            .select("*")
            .or("lead_type.eq.outbound,lead_type.is.null")
            .is("last_contacted_at", null)
            .lt("created_at", outboundThreshold.toISOString())
            .eq("stale_flag", false)
            .limit(100);

        if (outboundError) throw outboundError;

        if (staleOutbound && staleOutbound.length > 0) {
            for (const lead of staleOutbound) {
                await (supabase.from("leads") as any).update({
                    stale_flag: true,
                    stale_reason: "SLA Missed: Outbound not contacted within 24 hours"
                }).eq("id", lead.id);

                await logAudit({
                    action: "update",
                    resourceType: "lead",
                    resourceId: lead.id,
                    resourceLabel: lead.company_name,
                    newValue: { stale_flag: true, reason: "SLA Missed (Outbound)" },
                    summary: `SLA missed — outbound lead not contacted within 24h`,
                });

                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, leads_flagged: updatedCount, message: "SLA Check Complete" });
    } catch (err) {
        console.error("SLA Cron Error", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
