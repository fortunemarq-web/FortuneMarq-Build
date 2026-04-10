import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  Settings,
  FolderKanban,
  ListTodo,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Users,
  PauseCircle,
} from "lucide-react";
import Link from "next/link";
import ServiceDistributionChart from "@/components/admin/service-distribution-chart";
import TeamLoadChart from "@/components/admin/team-load-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";

interface Project {
  id: string;
  status: string | null;
  deadline: string | null;
  client_id: string | null;
  service_type: string | null;
}

interface Task {
  id: string;
  title: string | null;
  status: string | null;
  due_date: string | null;
  project_id: string | null;
  assigned_to: string | null;
}

interface Client {
  id: string;
  business_name: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default async function OperationsPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch all data in parallel
  const [projectsResult, tasksResult, clientsResult, profilesResult] = await Promise.all([
    supabase.from("projects").select("id, status, deadline, client_id, service_type"),
    supabase.from("tasks").select("id, title, status, due_date, project_id, assigned_to"),
    supabase.from("clients").select("id, business_name"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const projects: Project[] = projectsResult.data || [];
  const tasks: Task[] = tasksResult.data || [];
  const clients: Client[] = clientsResult.data || [];
  const profiles: Profile[] = profilesResult.data || [];

  // Create lookup maps
  const clientsMap = new Map(clients.map((c) => [c.id, c.business_name || "Unknown"]));
  const profilesMap = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "Unknown"]));

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Calculate metrics
  const activeProjects = projects.filter(
    (p) => p.status === "in_progress" || p.status === "not_started"
  ).length;

  const totalTasks = tasks.length;
  const tasksDueToday = tasks.filter((t) => t.due_date === todayStr).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    return t.due_date < todayStr;
  });
  const overdueCount = overdueTasks.length;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  // Service Distribution - Active Projects by service_type
  const serviceTypes: Record<string, { name: string; color: string }> = {
    web_dev: { name: "Web Development", color: "#3B82F6" },
    web_design: { name: "Web Design", color: "#8B5CF6" },
    seo: { name: "SEO", color: "#42CA80" },
    ads: { name: "Paid Ads", color: "#F59E0B" },
    social_media: { name: "Social Media", color: "#EC4899" },
    branding: { name: "Branding", color: "#06B6D4" },
    other: { name: "Other", color: "#6B7280" },
  };

  const activeProjectsList = projects.filter(
    (p) => p.status === "in_progress" || p.status === "not_started"
  );

  const serviceDistribution = activeProjectsList.reduce((acc, p) => {
    const service = p.service_type || "other";
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceDistributionData = Object.entries(serviceDistribution)
    .map(([key, value]) => ({
      name: serviceTypes[key]?.name || key,
      value,
      color: serviceTypes[key]?.color || "#6B7280",
    }))
    .sort((a, b) => b.value - a.value);

  // Team Load - Active tasks per user
  const activeTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  const tasksByUser = activeTasks.reduce((acc, t) => {
    const userId = t.assigned_to || "unassigned";
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const teamLoadData = Object.entries(tasksByUser)
    .map(([userId, tasks]) => ({
      name: userId === "unassigned" ? "Unassigned" : profilesMap.get(userId) || userId.slice(0, 8),
      tasks,
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 8);

  // Stalled Projects: Projects in progress but 0 tasks completed in last 7 days
  const tasksByProject = tasks.reduce((acc, t) => {
    if (!t.project_id) return acc;
    if (!acc[t.project_id]) {
      acc[t.project_id] = { total: 0, completed: 0, recentlyCompleted: 0 };
    }
    acc[t.project_id].total += 1;
    if (t.status === "completed") {
      acc[t.project_id].completed += 1;
      if ((t as any).updated_at) {
        const updatedDate = new Date((t as any).updated_at);
        if (updatedDate >= sevenDaysAgo) {
          acc[t.project_id!].recentlyCompleted += 1;
        }
      }
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; recentlyCompleted: number }>);

  const stalledProjects = projects
    .filter((p) => {
      if (p.status !== "in_progress") return false;
      const projectTasks = tasksByProject[p.id];
      if (!projectTasks || projectTasks.total === 0) return false;
      return projectTasks.recentlyCompleted === 0 && projectTasks.completed < projectTasks.total;
    })
    .map((p) => {
      const clientName = p.client_id ? clientsMap.get(p.client_id) || "Unknown" : "Unknown";
      const projectTaskData = tasksByProject[p.id] || { total: 0, completed: 0 };
      return {
        id: p.id,
        clientName,
        serviceType: formatServiceType(p.service_type || ""),
        deadline: p.deadline,
        tasksTotal: projectTaskData.total,
        tasksCompleted: projectTaskData.completed,
      };
    })
    .slice(0, 5);

  // At-Risk Projects (overdue)
  const overdueTasksByProject = overdueTasks.reduce((acc, t) => {
    if (t.project_id) {
      acc[t.project_id] = (acc[t.project_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const atRiskProjects = projects
    .filter((p) => {
      const deadlineOverdue =
        p.deadline && p.deadline < todayStr && p.status !== "completed" && p.status !== "cancelled";
      const hasOverdueTasks = overdueTasksByProject[p.id] > 0;
      return deadlineOverdue || hasOverdueTasks;
    })
    .map((p) => {
      const clientName = p.client_id ? clientsMap.get(p.client_id) || "Unknown" : "Unknown";
      const overdueTaskCount = overdueTasksByProject[p.id] || 0;
      const deadlineOverdue = p.deadline && p.deadline < todayStr;
      return {
        id: p.id,
        clientName,
        serviceType: formatServiceType(p.service_type || ""),
        deadline: p.deadline,
        overdueTaskCount,
        deadlineOverdue,
      };
    })
    .sort((a, b) => b.overdueTaskCount - a.overdueTaskCount)
    .slice(0, 5);

  function formatServiceType(serviceType: string) {
    return serviceType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Settings className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
                Operations Center
              </h1>
              <p className="text-sm text-slate-500">Project execution & task management</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderKanban}
            category="pipeline"
            subtitle="Currently in progress"
            className="delay-0"
          />
          <KpiCard
            title="Total Tasks"
            value={totalTasks}
            icon={ListTodo}
            category="volume"
            subtitle={`${completedTasks} completed`}
            className="delay-75"
          />
          <KpiCard
            title="Due Today"
            value={tasksDueToday}
            icon={Clock}
            category="volume"
            subtitle="Tasks to complete today"
            className="delay-150"
          />
          <KpiCard
            title="Critical Overdue"
            value={overdueCount}
            icon={overdueCount > 0 ? AlertTriangle : CheckCircle2}
            category={overdueCount > 0 ? "warning" : "revenue"}
            subtitle={overdueCount > 0 ? "Needs immediate attention" : "All systems normal"}
            className="delay-300"
          />
        </div>

        {/* Charts Row */}
        <div className="mb-8 rounded-xl bg-slate-100/60 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Service Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <FolderKanban className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Service Distribution</h2>
                  <p className="text-xs text-slate-600">Active projects by service type</p>
                </div>
              </div>
              <ServiceDistributionChart data={serviceDistributionData} />
            </div>

            {/* Team Load */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Team Load</h2>
                  <p className="text-xs text-slate-600">Active tasks per team member</p>
                </div>
              </div>
              <TeamLoadChart data={teamLoadData} />
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="rounded-xl bg-slate-100/60 p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Stalled Projects */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <PauseCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Stalled Projects</h2>
                  <p className="text-xs text-slate-500">No tasks completed in 7 days</p>
                </div>
              </div>

              {stalledProjects.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                    <p className="mt-2 text-sm font-medium text-emerald-700">All projects moving!</p>
                    <p className="mt-1 text-xs text-slate-500">Great momentum</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {stalledProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition-all hover:border-amber-300"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 group-hover:text-amber-700">
                          {project.clientName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{project.serviceType}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-xs font-mono tabular-nums font-semibold text-amber-600">
                          {project.tasksCompleted}/{project.tasksTotal} tasks
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* At-Risk Projects */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">At-Risk Projects</h2>
                  <p className="text-xs text-slate-500">Projects with overdue items</p>
                </div>
              </div>

              {atRiskProjects.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                    <p className="mt-2 text-sm font-medium text-emerald-700">All projects healthy!</p>
                    <p className="mt-1 text-xs text-slate-500">No at-risk projects</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {atRiskProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 transition-all hover:border-red-300 hover:bg-red-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 group-hover:text-red-700">
                          {project.clientName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{project.serviceType}</span>
                          {project.deadline && (
                            <>
                              <span className="text-red-500">•</span>
                              <span className="flex items-center gap-1 font-mono tabular-nums font-medium">
                                <Calendar className="h-3 w-3" />
                                {formatDate(project.deadline)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1">
                        {project.deadlineOverdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                            Overdue
                          </span>
                        )}
                        {project.overdueTaskCount > 0 && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                            {project.overdueTaskCount} tasks late
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-100 px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all duration-150 hover:bg-orange-200 hover:shadow active:scale-[0.98]"
          >
            <FolderKanban className="h-4 w-4" />
            View All Projects
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-150 hover:bg-blue-200 hover:shadow active:scale-[0.98]"
          >
            <ListTodo className="h-4 w-4" />
            Task Board
          </Link>
        </div>
      </div>
    </div>
  );
}
