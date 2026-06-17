import Link from "next/link";
import { Calendar, User, FolderKanban, Plus } from "lucide-react";
import PlanDeliverablesModal from "@/components/admin/clients/PlanDeliverablesModal";
import CaseStudyModal from "@/components/admin/clients/CaseStudyModal";
import DeliveryBoard, { type BoardMilestone, type BoardTask } from "@/components/admin/clients/DeliveryBoard";

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

export default function ProjectsTab({
  projects,
  clientId,
  clientName = "Client",
  milestones = [],
  deliveryTasks = [],
}: {
  projects: Project[];
  clientId: string;
  clientName?: string;
  milestones?: BoardMilestone[];
  deliveryTasks?: BoardTask[];
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
          <CaseStudyModal clientId={clientId} clientName={clientName} />
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

      {/* Delivery plan — milestones + nested tasks, Drive links, completion (4.5/4.6) */}
      <DeliveryBoard clientId={clientId} milestones={milestones} tasks={deliveryTasks} />
    </div>
  );
}
