"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Clock,
  Flag,
  TrendingUp,
  Calendar,
  Building2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Filter,
} from "lucide-react";
import TaskExecutionModal from "./task-execution-modal";
import clsx from "clsx";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  priority?: string | null;
  sop_content?: string | null;
  submission_notes?: string | null;
  section_tag?: string | null;
  project_id: string | null;
  projects?: {
    service_type: string;
    clients?: {
      business_name: string;
    } | null;
  } | null;
}

interface StaffDashboardProps {
  tasks: Task[];
  staffName: string;
}

const SERVICE_FILTERS = [
  { key: "all", label: "All" },
  { key: "web_design", label: "Web Design" },
  { key: "seo", label: "SEO" },
  { key: "google_ads", label: "Google Ads" },
  { key: "social_media", label: "Social Media" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All Tasks" },
  { value: "not_started", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "needs_attention", label: "Needs Attention" },
];

const STATUS_GROUPS = [
  { key: "not_started", label: "To Do", icon: Circle, color: "text-slate-500" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-info" },
  { key: "in_review", label: "In Review", icon: AlertTriangle, color: "text-info" },
  { key: "needs_attention", label: "Needs Attention", icon: AlertTriangle, color: "text-warn" },
];

const PRIORITY_CONFIG: Record<string, { label: string; tone: Tone }> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Med", tone: "warning" },
  low: { label: "Low", tone: "info" },
};

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr.split("T")[0] === today;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StaffDashboard({ tasks, staffName }: StaffDashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localTasks, setLocalTasks] = useState(tasks);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  // Personal Metrics
  const metrics = useMemo(() => {
    const activeTasks = localTasks.filter((t) => t.status !== "completed");
    const tasksDueToday = localTasks.filter(
      (t) => t.status !== "completed" && isToday(t.due_date)
    );
    const highPriorityTasks = localTasks.filter(
      (t) => t.status !== "completed" && t.priority === "high"
    );
    const completedToday = localTasks.filter(
      (t) => t.status === "completed" && isToday(t.due_date)
    );
    const dueTodayCount = tasksDueToday.length;
    const completionRate = dueTodayCount > 0
      ? Math.round((completedToday.length / dueTodayCount) * 100)
      : 100;

    return {
      activeCount: activeTasks.length,
      dueTodayCount: tasksDueToday.length,
      highPriorityCount: highPriorityTasks.length,
      completionRate,
    };
  }, [localTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      // Exclude completed tasks (unless specifically filtered)
      if (statusFilter === "all" && task.status === "completed") return false;

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // Service filter
      if (serviceFilter !== "all") {
        const serviceType = task.projects?.service_type || "";
        if (!serviceType.includes(serviceFilter.replace("_", ""))) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [localTasks, serviceFilter, priorityFilter, statusFilter]);

  // Sort tasks: overdue → high priority → due today → everything else
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const aOverdue = a.due_date && a.due_date < today && a.status !== "completed";
      const bOverdue = b.due_date && b.due_date < today && b.status !== "completed";
      const aDueToday = a.due_date?.split("T")[0] === today;
      const bDueToday = b.due_date?.split("T")[0] === today;
      const aHigh = a.priority === "high";
      const bHigh = b.priority === "high";

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;
      if (aDueToday && !bDueToday) return -1;
      if (!aDueToday && bDueToday) return 1;
      return 0;
    });
  }, [filteredTasks, today]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    STATUS_GROUPS.forEach((group) => {
      groups[group.key] = sortedTasks.filter((t) => t.status === group.key);
    });
    return groups;
  }, [sortedTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: string, notes?: string) => {
    setLocalTasks(
      localTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, submission_notes: notes || t.submission_notes }
          : t
      )
    );
    router.refresh();
  };

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          Welcome back, {staffName}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Here's your task overview for today
        </p>
      </div>

      {/* Personal Metrics */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
        <StatCard label="My Load" value={metrics.activeCount} icon={ListTodo} hint="Active tasks" />
        <StatCard
          label="Due Today"
          value={metrics.dueTodayCount}
          icon={Clock}
          hint="Need attention"
        />
        <StatCard
          label="High Priority"
          value={metrics.highPriorityCount}
          icon={Flag}
          hint="Urgent tasks"
        />
        <StatCard
          label="Today's Rate"
          value={`${metrics.completionRate}%`}
          icon={TrendingUp}
          hint="Completion"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 sm:gap-2">
        {STATUS_FILTERS.map((filter) => {
          const count = localTasks.filter((t) => 
            filter.value === "all" 
              ? t.status !== "completed" 
              : t.status === filter.value
          ).length;
          
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={clsx(
                "flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                statusFilter === filter.value
                  ? "bg-brand-deep text-white"
                  : "border border-line bg-surface text-slate-600 hover:bg-slate-50"
              )}
            >
              {filter.label}
              {count > 0 && (
                <span className={clsx(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  statusFilter === filter.value
                    ? "bg-white/20 text-inherit"
                    : "bg-slate-200 text-slate-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Row */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Service Filter */}
        <div className="flex flex-wrap gap-2">
          {SERVICE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setServiceFilter(filter.key)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                serviceFilter === filter.key
                  ? "bg-brand-deep text-white"
                  : "border border-line bg-surface text-slate-600 hover:bg-slate-50"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-auto"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Task Groups or Filtered List */}
      <div className="space-y-6">
        {statusFilter === "all" ? (
          // Show grouped tasks when "All Tasks" is selected
          STATUS_GROUPS.map((group) => {
            const groupTasks = groupedTasks[group.key] || [];
            const Icon = group.icon;

            if (groupTasks.length === 0) return null;

            return (
              <div key={group.key}>
                {/* Group Header */}
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={clsx("h-4 w-4", group.color)} />
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    {group.label}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {groupTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupTasks.map((task) => {
                    const priority = PRIORITY_CONFIG[task.priority || "medium"] || PRIORITY_CONFIG.medium;
                    const clientName = task.project_id
                      ? (task.projects?.clients?.business_name ?? task.projects?.service_type ?? "Project")
                      : (task.section_tag ?? "General");
                    const taskOverdue = isOverdue(task.due_date);
                    const taskDueToday = isToday(task.due_date);

                    return (
                      <button
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={clsx(
                          "group flex flex-col rounded-xl border bg-surface p-4 text-left transition-colors active:scale-[0.98]",
                          taskOverdue
                            ? "border-danger-line hover:border-danger"
                            : taskDueToday
                            ? "border-warn-line hover:border-warn"
                            : "border-line hover:border-brand-line"
                        )}
                      >
                        {/* Title */}
                        <h3 className="font-semibold text-slate-900 group-hover:text-brand-deep">
                          {task.title}
                        </h3>

                        {/* Client & Service */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Building2 className="h-3 w-3" />
                            {clientName}
                          </span>
                        </div>

                        {/* Footer: Due Date & Priority */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className={clsx(
                            "flex items-center gap-1 text-xs",
                            taskOverdue ? "text-danger" : taskDueToday ? "text-warn" : "text-slate-500"
                          )}>
                            <Calendar className="h-3 w-3" />
                            {formatDisplayDate(task.due_date)}
                          </span>
                          <Badge tone={priority.tone} size="sm">{priority.label}</Badge>
                        </div>

                        {/* Open Task Hint */}
                        <div className="mt-3 flex items-center justify-end text-xs text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                          <span>Open Task</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Show flat list when specific status is selected
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-slate-900">
                {STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {filteredTasks.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => {
                const priority = PRIORITY_CONFIG[task.priority || "medium"] || PRIORITY_CONFIG.medium;
                const clientName = task.projects?.clients?.business_name || "Unknown Client";
                const taskOverdue = isOverdue(task.due_date);
                const taskDueToday = isToday(task.due_date);

                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={clsx(
                      "group flex flex-col rounded-xl border bg-surface p-4 text-left transition-colors active:scale-[0.98]",
                      taskOverdue
                        ? "border-danger-line hover:border-danger"
                        : taskDueToday
                        ? "border-warn-line hover:border-warn"
                        : "border-line hover:border-brand-line"
                    )}
                  >
                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-deep">
                      {task.title}
                    </h3>

                    {/* Client & Service */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Building2 className="h-3 w-3" />
                        {clientName}
                      </span>
                    </div>

                    {/* Footer: Due Date & Priority */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={clsx(
                        "flex items-center gap-1 text-xs",
                        taskOverdue ? "text-danger" : taskDueToday ? "text-warn" : "text-slate-500"
                      )}>
                        <Calendar className="h-3 w-3" />
                        {formatDisplayDate(task.due_date)}
                      </span>
                      <Badge tone={priority.tone} size="sm">{priority.label}</Badge>
                    </div>

                    {/* Open Task Hint */}
                    <div className="mt-3 flex items-center justify-end text-xs text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                      <span>Open Task</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-deep" />
            <p className="mt-3 text-base font-semibold text-slate-900">All caught up!</p>
            <p className="mt-1 text-sm text-slate-600">
              {serviceFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all"
                ? "No tasks match your filters"
                : "You have no active tasks"}
            </p>
          </div>
        )}
      </div>

      {/* Task Execution Modal */}
      {selectedTask && (
        <TaskExecutionModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}

