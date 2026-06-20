"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Mail,
  Building2,
  ArrowRight,
  Zap,
  Loader2,
  FileText,
  FileSearch,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Download
} from "lucide-react";
import clsx from "clsx";
import { sendNotification, NotificationType } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { logAudit } from "@/lib/audit";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

interface Milestone {
  id: string;
  project_id: string;
  name: string;
  status: string;
  order_index: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string | null;
  service_type: string | null;
  status: string | null;
  deadline: string | null;
  start_date: string | null;
  assigned_pm: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  business_name: string | null;
  primary_email: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [pmProfile, setPmProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [revisionItem, setRevisionItem] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to view your dashboard.");
          setLoading(false);
          return;
        }
        setUserEmail(user.email || null);

        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("primary_email", user.email || "")
          .limit(1)
          .maybeSingle();

        if (clientError) throw clientError;
        if (!clientData) {
          setError("No client account found for your email.");
          setLoading(false);
          return;
        }
        setClient(clientData);

        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .eq("client_id", clientData.id)
          .in("status", ["not_started", "in_progress"])
          .order("created_at", { ascending: false });

        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
          const primaryProject = projectsData[0];

          // Milestones for primary project
          const { data: msData } = await supabase
            .from("project_milestones")
            .select("*")
            .eq("project_id", primaryProject.id)
            .order("order_index", { ascending: true });
          setMilestones((msData || []) as Milestone[]);

          // PM info
          if (primaryProject.assigned_pm) {
            const { data: pmData } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .eq("id", primaryProject.assigned_pm)
              .single();
            setPmProfile(pmData);
          }

          // Deliverables
          const { data: dlData } = await supabase
            .from("client_deliverables")
            .select("*")
            .eq("project_id", primaryProject.id)
            .order("created_at", { ascending: false });
          setDeliverables(dlData as any[] || []);

          // Reports
          const { data: rptData } = await supabase
            .from("client_reports")
            .select("*")
            .eq("client_id", clientData.id)
            .eq("is_published", true)
            .order("report_month", { ascending: false });
          setReports(rptData as any[] || []);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived: currently active project from the projects array
  const project = projects[activeProjectIndex] ?? null;

  const handleDeliverableAction = async (id: string, action: "approved" | "revision_requested", feedback?: string) => {
    setProcessingId(id);
    try {
      const { error: updateError } = await supabase
        .from("client_deliverables")
        .update({
          status: action,
          client_feedback: feedback || null,
          reviewed_at: new Date().toISOString()
        } as any)
        .eq("id", id);

      if (updateError) throw updateError;

      // Notify PM
      if (pmProfile?.id) {
        await sendNotification({
          userId: pmProfile.id,
          type: (action === 'approved' ? 'deliverable_approved' : 'deliverable_revision') as NotificationType,
          title: action === 'approved' ? 'Artifact Approved' : 'Revision Requested',
          body: `${client?.business_name} has ${action.replace('_', ' ')}: ${deliverables.find(d => d.id === id)?.title}`,
          link: `/projects/${project?.id}`
        });
      }

      setDeliverables((prev: any[]) => prev.map(d => d.id === id ? { ...d, status: action, client_feedback: feedback } : d));

      // Log Audit
      const deliv = deliverables.find(d => d.id === id);
      await logAudit({
        action: 'update',
        resourceType: 'deliverable',
        resourceId: id,
        resourceLabel: `${action === 'approved' ? 'Approved' : 'Revision Requested'} for ${deliv?.title}`,
        newValue: { status: action, feedback }
      });
    } catch (err) {
      console.error("Error updating deliverable:", err);
      setError("Failed to update. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatServiceType = (st: string | null) => {
    if (!st) return "Project";
    return st.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-canvas">
        <Zap className="mb-4 h-10 w-10 animate-pulse text-brand" />
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas p-4 text-center">
        <div className="max-w-md">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="mb-2 font-display text-xl font-semibold text-slate-900">Portal Access</h1>
          <p className="mb-6 text-sm text-slate-500">{error}</p>
          <Link href="/login" className={buttonVariants({ variant: "primary" })}>Back to login</Link>
        </div>
      </div>
    );
  }

  if (client && projects.length === 0) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas p-4 text-center">
        <div className="max-w-md">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-brand" />
          <h1 className="mb-2 font-display text-xl font-semibold text-slate-900">Welcome, {client.business_name}</h1>
          <p className="text-sm text-slate-500">Your project is currently being initialized. Please check back soon.</p>
        </div>
      </div>
    );
  }

  if (!client || !project) return null;

  const completedMilestones = milestones.filter(m => m.status === "completed" || m.status === "approved").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const currentMilestoneIndex = milestones.findIndex(m => m.status !== "completed" && m.status !== "approved");

  return (
    <div className="min-h-full bg-canvas px-4 py-8 md:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-deep text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep">Client Portal</p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 md:text-3xl">{client.business_name}</h1>
          </div>
        </div>

        {projects.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveProjectIndex(i)}
                className={clsx(
                  "rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors",
                  activeProjectIndex === i
                    ? "bg-brand-deep text-white"
                    : "border border-line bg-surface text-slate-600 hover:bg-slate-50"
                )}
              >
                {p.service_type?.replace("_", " ") ?? `Project ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">

            {/* Project Overview */}
            <Card className="relative overflow-hidden p-6">
              <div className="absolute right-0 top-0 p-4">
                <Badge tone="neutral" variant="soft" size="sm" className="uppercase tracking-wide">
                  {formatServiceType(project.service_type)}
                </Badge>
              </div>

              <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-500">Live Progress</h2>

              <div className="mb-2 flex items-end justify-between">
                <span className="font-display text-4xl font-semibold tabular-nums text-slate-900">{progressPercent}<span className="text-lg text-slate-400">%</span></span>
                <span className="text-xs font-medium text-slate-500">{completedMilestones} / {milestones.length} Milestones</span>
              </div>

              <div className="mb-8 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-line bg-slate-50 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Start Date</p>
                  <p className="font-semibold text-slate-900">{formatDate(project.start_date)}</p>
                </div>
                <div className="rounded-lg border border-line bg-slate-50 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Est. Completion</p>
                  <p className="font-semibold text-slate-900">{formatDate(project.deadline)}</p>
                </div>
              </div>
            </Card>

            {/* Deliverables Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-slate-900">Artifacts &amp; Deliverables</h2>
                <Badge tone="neutral" size="sm" className="tabular-nums">{deliverables.length}</Badge>
              </div>

              {deliverables.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-line rounded-xl">
                  <FileSearch className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Awaiting Artifacts</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {deliverables.map(item => {
                    const statusTone: Tone =
                      item.status === 'approved' ? 'brand' :
                        item.status === 'revision_requested' ? 'danger' : 'info';
                    return (
                    <div key={item.id} className="p-4 rounded-xl border border-line bg-slate-50 hover:bg-surface transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div className={clsx(
                          "p-2 rounded-lg",
                          item.status === 'approved' ? 'bg-brand-soft text-brand-deep' :
                            item.status === 'revision_requested' ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'
                        )}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <Badge tone={statusTone} size="sm" className="capitalize">
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 leading-tight mb-2">{item.title}</h3>

                      <div className="flex gap-2">
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" className={clsx(buttonVariants({ variant: "primary", size: "sm" }), "flex-1")}>
                            View
                          </a>
                        )}
                        {item.status === 'pending_review' && (
                          <div>
                            {revisionItem === item.id ? (
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  value={revisionFeedback}
                                  onChange={e => setRevisionFeedback(e.target.value)}
                                  placeholder="Describe the revision needed..."
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      if (revisionFeedback.trim()) {
                                        handleDeliverableAction(item.id, 'revision_requested', revisionFeedback);
                                        setRevisionItem(null);
                                        setRevisionFeedback("");
                                      }
                                    }}
                                    variant="danger"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Submit Revision
                                  </Button>
                                  <Button
                                    onClick={() => { setRevisionItem(null); setRevisionFeedback(""); }}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleDeliverableAction(item.id, 'approved')}
                                  disabled={processingId === item.id}
                                  variant="primary"
                                  size="icon"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => setRevisionItem(item.id)}
                                  variant="danger-soft"
                                  size="icon"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Roadmap */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900 mb-6">Project Roadmap</h2>
              <div className="space-y-4">
                {milestones.map((m, i) => {
                  const isDone = m.status === 'completed' || m.status === 'approved';
                  const isCurrent = i === currentMilestoneIndex;
                  return (
                    <div key={m.id} className={clsx(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      isCurrent ? "border-line-strong bg-slate-50" : "border-line opacity-60"
                    )}>
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs tabular-nums",
                        isDone ? "bg-brand text-white" : isCurrent ? "bg-brand-deep text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={clsx("font-semibold", isDone && "line-through text-slate-400")}>{m.name}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phase {i + 1}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Reports Sidebar */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-6">Performance Reports</h2>
              {reports.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No reports available</p>
              ) : (
                <div className="space-y-3">
                  {reports.map(report => (
                    <Link
                      key={report.id}
                      href={`/client/report/${report.magic_link_token}`}
                      className="block p-3 rounded-xl bg-slate-50 border border-line hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center text-brand-deep">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {new Date(report.report_month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[11px] font-medium text-brand-deep uppercase">{report.report_type}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* PM Card */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-6">Your Manager</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-deep rounded-xl flex items-center justify-center text-xl font-semibold text-white">
                  {pmProfile?.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{pmProfile?.full_name || "Team FortuneMarq"}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-deep">Project Success VP</p>
                </div>
              </div>
              <a href={`mailto:${pmProfile?.email || "projects@fortunemarq.com"}`} className={clsx(buttonVariants({ variant: "secondary" }), "w-full")}>
                Send Message
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
