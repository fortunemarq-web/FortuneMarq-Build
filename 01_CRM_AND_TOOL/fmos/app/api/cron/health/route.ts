import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";
import { CRON_JOBS, staleAfterMins } from "@/lib/cron-jobs";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";

/**
 * 6.8 — Automation health check. Runs in the every-15-min batch. Compares each
 * watched cron's last heartbeat against its expected cadence (stale = stopped),
 * surfaces last-run errors, and counts recent automation_runs failures. Any
 * problem → writes a `system_health` alert and (deduped ~6h) WhatsApps the owner.
 * Fail-soft: returns the full status JSON either way; never throws on alert paths.
 */
async function postHandler(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const sb = createAdminClient() as any;
  const now = Date.now();
  const issues: string[] = [];

  // 1) cron heartbeats — detect stopped or failing jobs
  const { data: hbs } = await sb.from("cron_heartbeats").select("*");
  const hbMap = new Map<string, any>((hbs || []).map((h: any) => [h.job_name, h]));

  const jobs = CRON_JOBS.map((j) => {
    const hb = hbMap.get(j.key);
    const last = hb?.last_run_at ? new Date(hb.last_run_at).getTime() : 0;
    const ageMin = last ? Math.round((now - last) / 60000) : null;
    let status: "ok" | "stale" | "error" | "missing";
    if (!hb) { status = "missing"; issues.push(`${j.key}: never run`); }
    else if (ageMin !== null && ageMin > staleAfterMins(j)) { status = "stale"; issues.push(`${j.key}: stale ${ageMin}m`); }
    else if (hb.last_status === "error") { status = "error"; issues.push(`${j.key}: ${String(hb.last_error || "error").slice(0, 60)}`); }
    else status = "ok";
    return { key: j.key, label: j.label, status, lastRunAt: hb?.last_run_at ?? null, ageMin, lastError: hb?.last_error ?? null, everyMins: j.everyMins };
  });

  // 2) recent automation-rule failures
  const dayAgo = new Date(now - 86400000).toISOString();
  const { count: autoErrors } = await sb
    .from("automation_runs")
    .select("id", { count: "exact", head: true })
    .eq("status", "error")
    .gte("created_at", dayAgo);
  if ((autoErrors || 0) > 0) issues.push(`automations: ${autoErrors} failed/24h`);

  const healthy = issues.length === 0;

  // 3) alert + WhatsApp owner (deduped: skip if a system_health alert fired in last 6h)
  let alerted = false;
  if (!healthy) {
    try {
      const sixAgo = new Date(now - 6 * 3600000).toISOString();
      const { data: recent } = await sb
        .from("alerts")
        .select("id")
        .eq("entity_type", "system_health")
        .gte("created_at", sixAgo)
        .limit(1);

      if (!recent || recent.length === 0) {
        const summary = issues.join(" · ").slice(0, 900);
        await sb.from("alerts").insert({
          title: `System health: ${issues.length} issue${issues.length > 1 ? "s" : ""}`,
          body: summary,
          severity: "high",
          status: "open",
          entity_type: "system_health",
        });

        const owner = process.env.OWNER_WHATSAPP || "";
        if (owner && toWaNumber(owner)) {
          // Gated on the `system_health_alert` utility template being Meta-approved.
          // If it isn't yet, this just fails-soft — the alert still lives in /admin/system-health.
          const r = await sendWhatsAppTemplate(owner, "system_health_alert", {
            language: "en",
            proactive: true,
            bypassOptOut: true,
            bypassThrottle: true,
            components: [{ type: "body", parameters: [{ type: "text", text: summary.slice(0, 500).replace(/\s+/g, " ") }] }],
          }).catch(() => null);
          alerted = !!r?.success;
        }
      }
    } catch {
      /* alerting must never break the health check */
    }
  }

  return NextResponse.json({ ok: true, healthy, issues, jobs, automationErrors24h: autoErrors || 0, alerted });
}

export const POST = withHeartbeat("health", postHandler);
// Vercel Cron invokes via GET; same handler, same secret check.
export { POST as GET };
