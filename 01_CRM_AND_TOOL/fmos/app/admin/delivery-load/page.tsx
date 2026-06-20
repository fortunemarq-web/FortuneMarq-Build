import type { Metadata } from "next";
import Link from "next/link";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  Boxes,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Delivery Load — FortuneMarq",
  description: "Active build load and capacity across the delivery team",
};

const ACTIVE_STATUSES = ["not_started", "in_progress"];

function fmtService(s: string | null) {
  if (!s) return "General";
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Soft capacity heuristic per builder (in-progress projects). Tune later.
function capacitySignal(inProgress: number): { label: string; tone: Tone } {
  if (inProgress >= 6) return { label: "Overloaded", tone: "danger" };
  if (inProgress >= 4) return { label: "Near capacity", tone: "warning" };
  return { label: "Healthy", tone: "brand" };
}

export default async function DeliveryLoadPage() {
  const supabase = await createServerClientWithCookies();
  const now = Date.now();

  const [{ data: projects }, { data: profiles }, { data: clients }, { data: deliverables }] =
    await Promise.all([
      supabase.from("projects").select("id, name, service_type, status, deadline, assigned_pm, client_id"),
      supabase.from("profiles").select("id, full_name, role"),
      supabase.from("clients").select("id, business_name"),
      supabase.from("client_deliverables").select("project_id, status"),
    ]);

  const profileName = new Map<string, string>(
    ((profiles as any[]) || []).map((p) => [p.id, p.full_name || "Unassigned"])
  );
  const clientName = new Map<string, string>(
    ((clients as any[]) || []).map((c) => [c.id, c.business_name || "Client"])
  );

  const allProjects = (projects as any[]) || [];
  const active = allProjects.filter((p) => ACTIVE_STATUSES.includes(p.status || ""));
  const inProgress = active.filter((p) => p.status === "in_progress");
  const overdue = active.filter((p) => p.deadline && new Date(p.deadline).getTime() < now);

  // Revisions outstanding, by project
  const revisionByProject = new Map<string, number>();
  ((deliverables as any[]) || []).forEach((d) => {
    if (d.status === "revision_requested") {
      revisionByProject.set(d.project_id, (revisionByProject.get(d.project_id) || 0) + 1);
    }
  });
  const totalRevisions = Array.from(revisionByProject.values()).reduce((a, b) => a + b, 0);

  // Load per team member (by assigned_pm)
  const byMember: Record<string, { id: string; active: number; inProgress: number; overdue: number }> = {};
  active.forEach((p) => {
    const key = p.assigned_pm || "unassigned";
    byMember[key] ??= { id: key, active: 0, inProgress: 0, overdue: 0 };
    byMember[key].active++;
    if (p.status === "in_progress") byMember[key].inProgress++;
    if (p.deadline && new Date(p.deadline).getTime() < now) byMember[key].overdue++;
  });
  const memberRows = Object.values(byMember).sort((a, b) => b.inProgress - a.inProgress);

  // Load per service type
  const byService: Record<string, number> = {};
  active.forEach((p) => {
    const key = p.service_type || "general";
    byService[key] = (byService[key] || 0) + 1;
  });
  const serviceRows = Object.entries(byService).sort((a, b) => b[1] - a[1]);

  // Needs attention: overdue projects + projects with outstanding revisions
  const attention = active
    .filter((p) => (p.deadline && new Date(p.deadline).getTime() < now) || revisionByProject.has(p.id))
    .map((p) => ({
      ...p,
      daysOverdue: p.deadline ? Math.floor((now - new Date(p.deadline).getTime()) / 86400000) : 0,
      revisions: revisionByProject.get(p.id) || 0,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const kpis = [
    { label: "Active Projects", value: active.length, icon: Boxes },
    { label: "In Progress", value: inProgress.length, icon: Loader2 },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle },
    { label: "Pending Revisions", value: totalRevisions, icon: RefreshCw },
  ];

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <PageHeader
          title="Delivery Load"
          subtitle="How much build work is in flight — and whether the team has capacity for more."
          actions={
            <Link href="/projects" className={buttonVariants({ variant: "secondary" })}>
              All Projects <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Load by team member */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <h3 className="font-display text-sm font-semibold text-slate-900">Load by Team Member</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {memberRows.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No active projects.</p>
              )}
              {memberRows.map((m) => {
                const sig = capacitySignal(m.inProgress);
                const name = m.id === "unassigned" ? "Unassigned" : profileName.get(m.id) || "Unknown";
                return (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-400">
                        {m.inProgress} in progress · {m.active} active{m.overdue > 0 ? ` · ${m.overdue} overdue` : ""}
                      </p>
                    </div>
                    <Badge tone={sig.tone} size="sm" className="shrink-0">{sig.label}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Load by service */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center gap-2">
              <Boxes className="h-4 w-4 text-slate-400" />
              <h3 className="font-display text-sm font-semibold text-slate-900">Load by Service</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {serviceRows.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No active projects.</p>
              )}
              {serviceRows.map(([svc, count]) => (
                <div key={svc} className="px-6 py-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{fmtService(svc)}</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Needs attention */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warn" />
            <h3 className="font-display text-sm font-semibold text-slate-900">Needs Attention</h3>
            <span className="text-[11px] text-slate-400">overdue or awaiting revisions</span>
          </div>
          {attention.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">All clear — nothing overdue and no outstanding revisions.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="px-6">Project</TH>
                    <TH className="px-6">Client</TH>
                    <TH className="px-6">Owner</TH>
                    <TH className="px-6 text-right">Overdue</TH>
                    <TH className="px-6 text-right">Revisions</TH>
                  </TR>
                </THead>
                <TBody>
                  {attention.map((p) => (
                    <TR key={p.id}>
                      <TD className="px-6 py-4">
                        <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-deep">
                          {p.name || fmtService(p.service_type)}
                        </Link>
                      </TD>
                      <TD className="px-6 py-4 text-sm text-slate-600">{clientName.get(p.client_id) || "—"}</TD>
                      <TD className="px-6 py-4 text-sm text-slate-600">{p.assigned_pm ? profileName.get(p.assigned_pm) || "—" : "Unassigned"}</TD>
                      <TD className="px-6 py-4 text-right">
                        {p.daysOverdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-danger">
                            <CalendarClock className="h-3 w-3" />{p.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TD>
                      <TD className="px-6 py-4 text-right">
                        {p.revisions > 0 ? (
                          <span className="text-xs font-bold text-warn">{p.revisions}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
