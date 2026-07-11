import Link from "next/link";
import { Calendar, User, FolderKanban, Plus } from "lucide-react";
import PlanDeliverablesModal from "@/components/admin/clients/PlanDeliverablesModal";
import CaseStudyModal from "@/components/admin/clients/CaseStudyModal";
import DeliveryBoard, { type BoardMilestone, type BoardTask } from "@/components/admin/clients/DeliveryBoard";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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

  // Delivery stages collapse to the five tones — done/live = brand, active = info,
  // review = warning, brief = neutral.
  const stageTone = (stage: string): Tone => {
    const map: Record<string, Tone> = {
      brief: "neutral",
      design: "info",
      development: "info",
      review: "warning",
      live: "brand",
      handed_over: "brand",
    };
    return map[stage] ?? "neutral";
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {projects.length} project{projects.length !== 1 ? "s" : ""} for this
          client
        </p>
        <div className="flex items-center gap-2">
          <CaseStudyModal clientId={clientId} clientName={clientName} />
          <PlanDeliverablesModal clientId={clientId} />
          <Link
            href={`/projects?client=${clientId}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Plus className="h-3 w-3" />
            Create Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderKanban className="mx-auto mb-3 h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">No projects yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Projects will appear here when created through the Close Deal
            workflow
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <Table className="min-w-[600px]">
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Type</TH>
                <TH>Stage</TH>
                <TH>Assigned To</TH>
                <TH>Deadline</TH>
                <TH>Progress</TH>
              </TR>
            </THead>
            <TBody>
              {projects.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-sm font-medium capitalize text-slate-800 transition-colors hover:text-brand-deep"
                    >
                      {(p.service_type ?? p.project_type ?? "Project").replace(/_/g, " ")}
                    </Link>
                  </TD>
                  <TD>
                    <Badge tone={stageTone(p.delivery_stage ?? "brief")} size="sm" className="uppercase">
                      {stageLabel(p.delivery_stage ?? "brief")}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-600">
                        {(p.assigned_profile as { full_name: string } | null)?.full_name ?? "Unassigned"}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span
                        className={`text-xs ${
                          p.deadline &&
                          new Date(p.deadline) < new Date()
                            ? "font-semibold text-danger"
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
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{
                            width: `${p.completion_percentage ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                        {p.completion_percentage ?? 0}%
                      </span>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {/* Delivery plan — milestones + nested tasks, Drive links, completion (4.5/4.6) */}
      <DeliveryBoard clientId={clientId} milestones={milestones} tasks={deliveryTasks} />
    </div>
  );
}
