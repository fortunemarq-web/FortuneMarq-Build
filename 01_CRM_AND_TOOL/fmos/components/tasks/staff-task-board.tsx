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

const COLUMNS: Column[] = [
  {
    id: "todo",
    label: "To Do",
    statuses: ["not_started"],
    icon: Inbox,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    canDragTo: ["in_progress"],
  },
  {
    id: "in_progress",
    label: "In Progress",
    statuses: ["in_progress"],
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    canDragTo: ["not_started"],
  },
  {
    id: "submitted",
    label: "Submitted",
    statuses: ["in_review", "needs_revision"],
    icon: ChevronRight,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    canDragTo: [], // No drag — only set by "Submit for Review" button
  },
  {
    id: "done",
    label: "Done",
    statuses: ["completed"],
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    canDragTo: [], // No drag to done — set by Jabeer only
  },
];

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
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} assigned to you
            {completedTasks > 0 && ` · ${completedTasks} completed`}
          </p>
        </div>

        {totalTasks === 0 && (
          <div className="flex flex-col items-center justify-center h-72 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50">
            <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-lg font-semibold text-emerald-700">All caught up!</p>
            <p className="text-sm text-emerald-600 mt-1">No tasks assigned to you right now.</p>
          </div>
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
                  className={`rounded-2xl border min-h-[200px] transition-all ${col.border} ${
                    isDraggableTarget ? "ring-2 ring-[#42CA80] ring-offset-2 bg-emerald-50/30" : "bg-white"
                  }`}
                >
                  {/* Column header */}
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl ${col.bg} border-b ${col.border}`}>
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
                    <span className="ml-auto text-xs font-bold bg-white/70 px-1.5 py-0.5 rounded-full text-slate-600">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="p-3 space-y-3">
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-slate-300 font-medium">
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
                          className={`rounded-xl border bg-white p-3.5 shadow-sm transition-all ${
                            draggedId === task.id ? "opacity-50 scale-[0.98]" : "hover:shadow-md"
                          } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          {/* Revision notes banner */}
                          {task.status === "in_progress" && task.revision_notes && (
                            <div className="mb-3 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5">
                              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                                ⚠️ Revision Needed — Jabeer&apos;s Notes:
                              </p>
                              <p className="text-xs text-orange-800 leading-relaxed">{task.revision_notes}</p>
                            </div>
                          )}

                          {/* Task title */}
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{task.title}</p>

                          {/* Project + Service */}
                          {task.projects && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {(task.projects.clients as any)?.business_name || task.projects.name}
                              {task.projects.service_type && (
                                <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                                  · {serviceLabel(task.projects.service_type)}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Due date */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <Calendar className={`h-3 w-3 ${overdue ? "text-red-500" : "text-slate-400"}`} />
                            <span className={`text-xs font-medium ${overdue ? "text-red-500 font-bold" : "text-slate-400"}`}>
                              {formatDate(task.due_date)}
                              {overdue && " — OVERDUE"}
                            </span>
                          </div>

                          {/* Status badge */}
                          <div className="mt-2.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              task.status === "not_started" ? "bg-slate-100 text-slate-500" :
                              task.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                              task.status === "in_review" ? "bg-purple-100 text-purple-600" :
                              task.status === "needs_revision" ? "bg-orange-100 text-orange-600" :
                              "bg-emerald-100 text-emerald-600"
                            }`}>
                              {task.status?.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Description toggle */}
                          {task.description && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : task.id)}
                              className="mt-2.5 text-xs text-[#42CA80] hover:text-[#35A66A] font-medium flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? "Hide brief" : "View brief"}
                              <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          )}
                          {isExpanded && task.description && (
                            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
                              {task.description}
                            </div>
                          )}

                          {/* Client brief link */}
                          {task.client_id && (
                            <a
                              href={`/admin/clients/${task.client_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2.5 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" /> View Brief
                            </a>
                          )}

                          {/* Submit for Review button */}
                          {(col.id === "todo" || col.id === "in_progress") && (
                            <button
                              onClick={() => submitForReview(task.id)}
                              disabled={isPending}
                              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Submit for Review
                            </button>
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
