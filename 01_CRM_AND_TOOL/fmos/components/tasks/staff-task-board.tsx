"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  AlertOctagon,
  CheckCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface Task {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
  description?: string | null;
  revision_notes?: string | null;
  revision_count?: number;
  client_id?: string | null;
  project_id?: string | null;
  projects?: {
    id: string;
    name: string;
    service_type?: string | null;
    clients?: { business_name: string } | null;
  } | null;
}

interface StaffTaskBoardProps {
  initialTasks: Task[];
  userId: string;
}

type Column = {
  id: string;
  label: string;
  statuses: string[];
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  canDragTo: string[];
};

// Columns are neutral surfaces — status colour lives on the badge tone only.
const COLUMNS: Column[] = [
  {
    id: "todo",
    label: "To Do",
    statuses: ["not_started"],
    icon: Inbox,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-line",
    canDragTo: ["in_progress"],
  },
  {
    id: "in_progress",
    label: "In Progress",
    statuses: ["in_progress"],
    icon: Clock,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-line",
    canDragTo: ["not_started"],
  },
  {
    id: "submitted",
    label: "Submitted",
    statuses: ["in_review", "needs_revision"],
    icon: ChevronRight,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-line",
    canDragTo: [], // No drag — only set by "Submit for Review" button
  },
  {
    id: "done",
    label: "Done",
    statuses: ["completed"],
    icon: CheckCircle,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-line",
    canDragTo: [], // No drag to done — set by Jabeer only
  },
];

// Every task status maps to one of the five tones — no per-status rainbow.
const STATUS_TONE: Record<string, Tone> = {
  not_started: "neutral",
  in_progress: "info",
  in_review: "info",
  needs_revision: "warning",
  completed: "brand",
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function serviceLabel(type: string | null | undefined): string {
  const map: Record<string, string> = {
    web_dev: "Website Build",
    local_seo: "Local SEO",
    seo: "SEO",
    performance_marketing: "Ads",
    social_media: "Social Media",
    whatsapp_marketing: "WhatsApp Marketing",
  };
  return type ? (map[type] || type) : "";
}

export default function StaffTaskBoard({ initialTasks, userId }: StaffTaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  function getColumnTasks(col: Column): Task[] {
    if (col.id === "done") {
      // Only show last 7 days of completed tasks
      const sevenAgo = new Date(Date.now() - 7 * 86400000);
      return tasks.filter(
        (t) => col.statuses.includes(t.status || "") && new Date(t.due_date || Date.now()) >= sevenAgo
      );
    }
    return tasks.filter((t) => col.statuses.includes(t.status || ""));
  }

  async function moveTask(taskId: string, newStatus: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await (supabase.from("tasks").update({ status: newStatus } as any).eq("id", taskId) as any);
  }

  async function submitForReview(taskId: string) {
    startTransition(async () => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "in_review" } : t))
      );
      await supabase
        .from("tasks")
        .update({ status: "in_review" })
        .eq("id", taskId);
    });
  }

  function handleDragStart(taskId: string) {
    setDraggedId(taskId);
  }

  function handleDrop(e: React.DragEvent, col: Column) {
    e.preventDefault();
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (!task) return;
    const currentCol = COLUMNS.find((c) => c.statuses.includes(task.status || ""));
    if (!currentCol) return;
    // Only allow drops into columns that the current column permits
    const allowedStatuses = currentCol.canDragTo;
    const targetStatus = col.statuses[0];
    if (allowedStatuses.includes(targetStatus)) {
      moveTask(draggedId, targetStatus);
    }
    setDraggedId(null);
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="min-h-full bg-canvas px-4 py-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} assigned to you
            {completedTasks > 0 && ` · ${completedTasks} completed`}
          </p>
        </div>

        {totalTasks === 0 && (
          <EmptyState
            icon={CheckCircle}
            title="All caught up!"
            description="No tasks assigned to you right now."
          />
        )}

        {/* Kanban Board */}
        {totalTasks > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = getColumnTasks(col);
              const Icon = col.icon;
              const isDraggableTarget = draggedId
                ? (() => {
                    const task = tasks.find((t) => t.id === draggedId);
                    if (!task) return false;
                    const fromCol = COLUMNS.find((c) => c.statuses.includes(task.status || ""));
                    return fromCol?.canDragTo.includes(col.statuses[0]) ?? false;
                  })()
                : false;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => { if (isDraggableTarget) e.preventDefault(); }}
                  onDrop={(e) => handleDrop(e, col)}
                  className={`rounded-xl border min-h-[200px] transition-all ${col.border} ${
                    isDraggableTarget ? "ring-2 ring-brand ring-offset-2 bg-brand-soft/40" : "bg-surface"
                  }`}
                >
                  {/* Column header */}
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl ${col.bg} border-b ${col.border}`}>
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <span className={`font-display text-sm font-semibold ${col.color}`}>{col.label}</span>
                    <span className="ml-auto text-xs font-semibold tabular-nums bg-surface px-1.5 py-0.5 rounded-full text-slate-600">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="p-3 space-y-3">
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-slate-400 font-medium">
                        Empty
                      </div>
                    )}
                    {colTasks.map((task) => {
                      const overdue = isOverdue(task.due_date);
                      const isExpanded = expandedId === task.id;
                      const isDraggable = col.id === "todo" || col.id === "in_progress";

                      return (
                        <div
                          key={task.id}
                          draggable={isDraggable}
                          onDragStart={() => isDraggable && handleDragStart(task.id)}
                          onDragEnd={() => setDraggedId(null)}
                          className={`rounded-xl border border-line bg-surface p-3.5 shadow-sm transition-all ${
                            draggedId === task.id ? "opacity-50 scale-[0.98]" : "hover:shadow-md"
                          } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          {/* Revision notes banner */}
                          {task.status === "in_progress" && task.revision_notes && (
                            <div className="mb-3 rounded-lg bg-warn-soft border border-warn-line px-3 py-2.5">
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-warn uppercase tracking-wider mb-1">
                                <AlertTriangle className="h-3 w-3" /> Revision Needed — Jabeer&apos;s Notes:
                              </p>
                              <p className="text-xs text-warn leading-relaxed">{task.revision_notes}</p>
                            </div>
                          )}

                          {/* Task title */}
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{task.title}</p>

                          {/* Project + Service */}
                          {task.projects && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {(task.projects.clients as any)?.business_name || task.projects.name}
                              {task.projects.service_type && (
                                <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                                  · {serviceLabel(task.projects.service_type)}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Due date */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <Calendar className={`h-3 w-3 ${overdue ? "text-danger" : "text-slate-400"}`} />
                            <span className={`text-xs font-medium ${overdue ? "text-danger font-semibold" : "text-slate-400"}`}>
                              {formatDate(task.due_date)}
                              {overdue && " — OVERDUE"}
                            </span>
                          </div>

                          {/* Status badge */}
                          <div className="mt-2.5">
                            <Badge tone={STATUS_TONE[task.status || ""] || "neutral"} size="sm" className="uppercase tracking-wide">
                              {task.status?.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          {/* Description toggle */}
                          {task.description && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : task.id)}
                              className="mt-2.5 text-xs text-brand-deep hover:underline font-medium flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? "Hide brief" : "View brief"}
                              <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          )}
                          {isExpanded && task.description && (
                            <div className="mt-2 rounded-lg bg-slate-50 border border-line p-3 text-xs text-slate-700 leading-relaxed">
                              {task.description}
                            </div>
                          )}

                          {/* Client brief link */}
                          {task.client_id && (
                            <a
                              href={`/admin/clients/${task.client_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2.5 flex items-center gap-1 text-xs text-brand-deep hover:underline transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" /> View Brief
                            </a>
                          )}

                          {/* Submit for Review button */}
                          {(col.id === "todo" || col.id === "in_progress") && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => submitForReview(task.id)}
                              disabled={isPending}
                              className="mt-3 w-full"
                            >
                              Submit for Review
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
