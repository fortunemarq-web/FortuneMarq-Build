import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";

export const POST = withHeartbeat("reactivation", postHandler);

import { type NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import { buildComponents } from "@/lib/whatsapp/params";
import { leadStageUpdate } from "@/lib/pipeline";

/**
 * 6.6 — Long-term nurture / reactivation drip.
 *
 * Sends ONE approved re-engagement template (`revival_nudge`) to leads that went
 * cold weeks/months ago (closed not-interested/lost, or parked unreachable/
 * gatekeeper-walled, with no pipeline activity for N days), then moves them to the
 * `revival` stage so they are never nudged twice.
 *
 * SAFETY: every send goes through sendWhatsAppTemplate(proactive:true), so the
 * one choke point enforces opt-out (STOP / do-not-contact), the 24h active-thread
 * window, the daily cap and the rate limit — and, pre-go-live, the allowlist. We
 * do NOT re-implement any of that here.
 *
 * OFF BY DEFAULT: set REACTIVATION_ENABLED=1 to switch it on. This keeps go-live
 * (WHATSAPP_LAUNCH=1) from triggering a mass cold blast that could hurt the
 * WhatsApp quality rating. `?dry=1` previews the candidates without sending.
 */

// Closed-but-real + parked stages worth re-engaging. Deliberately EXCLUDES `dead`
// (wrong number) and `language_barrier` (a nudge won't bridge it).
const COLD_STAGES = ["not_interested", "lost", "unreachable", "gatekeeper_flagged"];

async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const supabase = createAdminClient();
  const afterDays = Number(process.env.REACTIVATION_AFTER_DAYS) || 60;
  const batch = Number(process.env.REACTIVATION_BATCH) || 25;
  const template = process.env.REACTIVATION_TEMPLATE || "revival_nudge";
  const coldBefore = new Date(Date.now() - afterDays * 86400000).toISOString();

  try {
    // Oldest-dormant first. `IS NOT TRUE` keeps both false AND null (= not opted out).
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, company_name, contact_person, city, phone, outreach_stage, last_activity_at")
      .in("outreach_stage", COLD_STAGES)
      .lt("last_activity_at", coldBefore)
      .not("phone", "is", null)
      .not("wa_opt_out", "is", true)
      .not("do_not_contact", "is", true)
      .order("last_activity_at", { ascending: true })
      .limit(batch);
    if (error) throw error;

    const candidates = (leads || []) as any[];

    if (dry) {
      return NextResponse.json({
        success: true,
        mode: "dry-run",
        after_days: afterDays,
        batch,
        candidates: candidates.length,
        sample: candidates.slice(0, 5).map((l) => ({ company: l.company_name, stage: l.outreach_stage, cold_since: l.last_activity_at })),
      });
    }

    if (process.env.REACTIVATION_ENABLED !== "1") {
      return NextResponse.json({ success: true, skipped: "disabled", note: "set REACTIVATION_ENABLED=1 to enable; candidates waiting: " + candidates.length });
    }

    let sent = 0;
    let skipped = 0;
    let capped = false;
    for (const lead of candidates) {
      const snap = {
        name: lead.contact_person || lead.company_name || "there",
        city: lead.city || "your area",
        company_name: lead.company_name || "your business",
      };
      const components = buildComponents({ audience: "lead", template, params: ["{name}", "{city}", "{company_name}"] }, snap);
      const r = await sendWhatsAppTemplate(lead.phone, template, { language: "en", components, leadId: lead.id, proactive: true });
      if (r.success) {
        // Move out of the cold pool → revival, so the lead is never nudged twice.
        await supabase.from("leads").update(leadStageUpdate("revival", { last_outcome: "REACTIVATION_SENT" })).eq("id", lead.id);
        sent++;
      } else {
        skipped++;
        if (r.suppressed === "daily_cap") { capped = true; break; } // stop for today; resume tomorrow
      }
    }

    return NextResponse.json({ success: true, candidates: candidates.length, sent, skipped, capped });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Vercel/GitHub cron invokes via GET; same handler, same secret check.
export { POST as GET };
