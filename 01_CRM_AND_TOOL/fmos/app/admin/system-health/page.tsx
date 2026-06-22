import { createServerClientWithCookies } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { CRON_JOBS, staleAfterMins } from "@/lib/cron-jobs";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type JobStatus = "ok" | "stale" | "error" | "missing";
const TONE: Record<JobStatus, Tone> = { ok: "brand", stale: "warning", error: "danger", missing: "neutral" };
const LABEL: Record<JobStatus, string> = { ok: "Healthy", stale: "Stale", error: "Error", missing: "Never run" };

function ago(iso: string | null): string {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function SystemHealthPage() {
  const supabase = (await createServerClientWithCookies()) as any;
  const now = Date.now();
  const dayAgo = new Date(now - 86400000).toISOString();

  const [{ data: hbs }, { count: autoErrors }, { data: alerts }] = await Promise.all([
    supabase.from("cron_heartbeats").select("*"),
    supabase.from("automation_runs").select("id", { count: "exact", head: true }).eq("status", "error").gte("created_at", dayAgo),
    supabase.from("alerts").select("id, title, body, created_at").eq("entity_type", "system_health").order("created_at", { ascending: false }).limit(8),
  ]);

  const hbMap = new Map<string, any>((hbs || []).map((h: any) => [h.job_name, h]));

  const jobs = CRON_JOBS.map((j) => {
    const hb = hbMap.get(j.key);
    const last = hb?.last_run_at ? new Date(hb.last_run_at).getTime() : 0;
    const ageMin = last ? Math.round((now - last) / 60000) : null;
    let status: JobStatus;
    if (!hb) status = "missing";
    else if (ageMin !== null && ageMin > staleAfterMins(j)) status = "stale";
    else if (hb.last_status === "error") status = "error";
    else status = "ok";
    return { ...j, status, hb, lastRunAt: hb?.last_run_at ?? null, lastError: hb?.last_error ?? null };
  });

  const healthHb = hbMap.get("health");
  const problems = jobs.filter((j) => j.status !== "ok").length + (autoErrors ? 1 : 0);
  const allOk = problems === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Automation heartbeats, failures, and alerts — so nothing breaks silently."
      />

      {/* summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          {allOk ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <AlertTriangle className="h-8 w-8 text-amber-500" />}
          <div>
            <div className="text-sm text-muted-foreground">Overall</div>
            <div className="text-lg font-semibold">{allOk ? "All systems healthy" : `${problems} issue${problems > 1 ? "s" : ""}`}</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Automation failures (24h)</div>
            <div className="text-lg font-semibold">{autoErrors || 0}</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Health check last ran</div>
            <div className="text-lg font-semibold">{ago(healthHb?.last_run_at ?? null)}</div>
          </div>
        </Card>
      </div>

      {/* cron grid */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">Scheduled jobs ({CRON_JOBS.length})</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.map((j) => (
            <div key={j.key} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-4">
              <div className="min-w-0">
                <div className="font-medium">{j.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  every {j.everyMins >= 1440 ? "day" : `${j.everyMins}m`} · last run {ago(j.lastRunAt)}
                </div>
                {j.status === "error" && j.lastError && (
                  <div className="text-xs text-red-500 mt-1 truncate" title={j.lastError}>{j.lastError}</div>
                )}
              </div>
              <Badge tone={TONE[j.status]}>{LABEL[j.status]}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          A job goes <b>Stale</b> if it hasn&apos;t checked in within ~2.5× its cadence — usually the GitHub Actions cron (or its <code>FMOS_BASE_URL</code>/<code>CRON_SECRET</code> secrets) stopped. <b>Never run</b> means no heartbeat yet (deploy + first run pending, or the <code>cron_heartbeats</code> migration hasn&apos;t been applied).
        </p>
      </Card>

      {/* recent health alerts */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">Recent health alerts</div>
        {(!alerts || alerts.length === 0) ? (
          <div className="text-sm text-muted-foreground">No health alerts — clean run history.</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a: any) => (
              <div key={a.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{ago(a.created_at)}</div>
                </div>
                {a.body && <div className="text-xs text-muted-foreground mt-1">{a.body}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
