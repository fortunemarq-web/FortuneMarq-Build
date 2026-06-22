import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withHeartbeat } from "@/lib/cron-heartbeat";
import { CRON_JOBS, staleAfterMins } from "@/lib/cron-jobs";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";

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
    // "missing" (never run yet) is shown in the UI but does NOT alert — a just-deployed
    // job legitimately has no heartbeat until its first run. Only stale/error alert.
    if (!hb) { status = "missing"; }
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
        const summary = issues.join(" · ").replace(/\s+/g, " ").slice(0, 480);
        await sb.from("alerts").insert({
          title: `System health: ${issues.length} issue${issues.length > 1 ? "s" : ""}`,
          body: summary,
          severity: "high",
          status: "open",
          entity_type: "system_health",
        });
        // Reuse the existing admin-alert channel: the Meta-approved `admin_alert`
        // template → all ADMIN_WHATSAPP_NUMBERS (owner included). No extra env/template.
        await sendAdminAlert(`${issues.length} automation issue${issues.length > 1 ? "s" : ""}`, summary);
        alerted = true;
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
