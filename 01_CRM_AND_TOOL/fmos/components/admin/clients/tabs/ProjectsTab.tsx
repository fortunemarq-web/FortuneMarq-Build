import Link from "next/link";
import { Calendar, User, FolderKanban, Plus, Flag, CalendarDays, UserRound } from "lucide-react";
import PlanDeliverablesModal from "@/components/admin/clients/PlanDeliverablesModal";

interface Project {
  id: string;
  service_type?: string | null;
  project_type?: string | null;
  status: string | null;
  deadline: string | null;
  completion_percentage?: number | null;
  delivery_stage?: string | null;
  assigned_profile?: { full_name: string | null } | null;
}

interface Milestone {
  id: string;
  name: string;
  due_date: string | null;
  status: string | null;
  order_index: number | null;
  project_id: string;
}

interface DeliveryTask {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
  milestone_id: string | null;
  description: string | null;
  assigned_profile?: { full_name: string | null } | null;
}

const MS_STATUS: Record<string, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In progress", cls: "bg-blue-50 text-blue-600" },
  ready_for_approval: { label: "Ready for approval", cls: "bg-amber-50 text-amber-600" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
};

const TASK_DONE = new Set(["completed"]);

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function ProjectsTab({
  projects,
  clientId,
  milestones = [],
  deliveryTasks = [],
}: {
  projects: Project[];
  clientId: string;
  milestones?: Milestone[];
  deliveryTasks?: DeliveryTask[];
}) {
  const stageLabel = (stage: string) => {
    const map: Record<string, string> = {
      brief: "Brief",
      design: "Design",
      development: "Development",
      review: "Review",
      live: "Live",
      handed_over: "Handed Over",
    };
    return map[stage] ?? stage?.replace(/_/g, " ") ?? "—";
  };

  const stageColor = (stage: string) => {
    const map: Record<string, string> = {
      brief: "bg-slate-100 text-slate-600",
      design: "bg-purple-50 text-purple-600",
      development: "bg-blue-50 text-blue-600",
      review: "bg-amber-50 text-amber-600",
      live: "bg-emerald-50 text-emerald-600",
      handed_over: "bg-green-50 text-green-700",
    };
    return map[stage] ?? "bg-slate-50 text-slate-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {projects.length} project{projects.length !== 1 ? "s" : ""} for this
          client
        </p>
        <div className="flex items-center gap-2">
          <PlanDeliverablesModal clientId={clientId} />
          <Link
            href={`/projects?client=${clientId}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 transition-all min-h-[36px]"
          >
            <Plus className="h-3 w-3" />
            Create Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <FolderKanban className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No projects yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Projects will appear here when created through the Close Deal
            workflow
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Deadline
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-[#42CA80] transition-colors capitalize"
                    >
                      {(p.service_type ?? p.project_type ?? "Project").replace(/_/g, " ")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${stageColor(
                        p.delivery_stage ?? "brief"
                      )}`}
                    >
                      {stageLabel(p.delivery_stage ?? "brief")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-600">
                        {(p.assigned_profile as { full_name: string } | null)?.full_name ?? "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span
                        className={`text-xs ${
                          p.deadline &&
                          new Date(p.deadline) < new Date()
                            ? "text-red-600 font-semibold"
                            : "text-slate-600"
                        }`}
                      >
                        {p.deadline
                          ? new Date(p.deadline).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#42CA80]"
                          style={{
                            width: `${p.completion_percentage ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {p.completion_percentage ?? 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery plan — milestones with nested tasks (4.5) */}
      {milestones.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Delivery Plan
          </p>
          <div className="space-y-3">
            {milestones.map((m) => {
              const tasks = deliveryTasks.filter((t) => t.milestone_id === m.id);
              const done = tasks.filter((t) => t.status && TASK_DONE.has(t.status)).length;
              const st = MS_STATUS[m.status ?? "not_started"] ?? MS_STATUS.not_started;
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Flag className="h-3.5 w-3.5 text-[#1E7A4F] shrink-0" />
                      <span className="text-sm font-bold text-slate-800 truncate">{m.name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-[10px] font-bold text-slate-400">
                        {done}/{tasks.length} done
                      </span>
                      {m.due_date && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(m.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {tasks.length === 0 ? (
                      <p className="px-4 py-2.5 text-xs text-slate-400 italic">No tasks</p>
                    ) : (
                      tasks.map((t) => {
                        const owner = (t.assigned_profile as { full_name: string } | null)?.full_name
                          ?? (t.description?.startsWith("Owner: ") ? t.description.slice(7) : null);
                        const isDone = t.status ? TASK_DONE.has(t.status) : false;
                        return (
                          <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60">
                            <span className={`text-sm ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>
                              {t.title}
                            </span>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              {owner && (
                                <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                                  <UserRound className="h-3 w-3" />{owner}
                                </span>
                              )}
                              {t.due_date && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <CalendarDays className="h-3 w-3" />{fmtDate(t.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
