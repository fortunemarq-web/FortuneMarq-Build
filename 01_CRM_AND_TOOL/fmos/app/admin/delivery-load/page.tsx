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
function capacitySignal(inProgress: number): { label: string; cls: string } {
  if (inProgress >= 6) return { label: "Overloaded", cls: "bg-red-100 text-red-700" };
  if (inProgress >= 4) return { label: "Near capacity", cls: "bg-amber-100 text-amber-700" };
  return { label: "Healthy", cls: "bg-emerald-100 text-emerald-700" };
}

export default async function DeliveryLoadPage() {
  const supabase = await createServerClientWithCookies();
  const now = Date.now();

  const [{ data: projects }, { data: profiles }, { data: clients }, { data: deliverables }] =
    await Promise.all([
      supabase.from("projects").select("id, name, service_type, status, deadline, assigned_pm, client_id"),
      supabase.from("profiles").select("id, full_name, role"),
      supabase.from("clients").select("id, business_name"),
      supabase.from("client_deliverables" as any).select("project_id, status"),
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
    { label: "Active Projects", value: active.length, icon: Boxes, color: "#3b82f6" },
    { label: "In Progress", value: inProgress.length, icon: Loader2, color: "#42CA80" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: "#ef4444" },
    { label: "Pending Revisions", value: totalRevisions, icon: RefreshCw, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Delivery Load</h1>
              <p className="text-sm text-slate-500 mt-1">
                How much build work is in flight — and whether the team has capacity for more.
              </p>
            </div>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            All Projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" style={{ borderTop: `3px solid ${k.color}` }}>
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">{k.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Load by team member */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Load by Team Member</h3>
            </div>
            <div className="divide-y divide-slate-50">
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
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${sig.cls}`}>{sig.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load by service */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Load by Service</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {serviceRows.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No active projects.</p>
              )}
              {serviceRows.map(([svc, count]) => (
                <div key={svc} className="px-6 py-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{fmtService(svc)}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Needs attention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Needs Attention</h3>
            <span className="text-[11px] text-slate-400">overdue or awaiting revisions</span>
          </div>
          {attention.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">All clear — nothing overdue and no outstanding revisions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Client</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Owner</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Overdue</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Revisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attention.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#42CA80]">
                          {p.name || fmtService(p.service_type)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{clientName.get(p.client_id) || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.assigned_pm ? profileName.get(p.assigned_pm) || "—" : "Unassigned"}</td>
                      <td className="px-6 py-4 text-right">
                        {p.daysOverdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                            <CalendarClock className="h-3 w-3" />{p.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.revisions > 0 ? (
                          <span className="text-xs font-bold text-amber-600">{p.revisions}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
