"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  Book,
  Play,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Flag,
  Building2,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

interface TaskExecutionModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string, notes?: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = {
  not_started: { label: "Not Started", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "info" },
  in_review: { label: "In Review", tone: "info" },
  needs_attention: { label: "Needs Attention", tone: "warning" },
  completed: { label: "Completed", tone: "brand" },
};

const PRIORITY_CONFIG: Record<string, { label: string; tone: Tone }> = {
  high: { label: "High Priority", tone: "danger" },
  medium: { label: "Medium Priority", tone: "warning" },
  low: { label: "Low Priority", tone: "info" },
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr.split("T")[0] === today;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TaskExecutionModal({
  task,
  isOpen,
  onClose,
  onStatusChange,
}: TaskExecutionModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState(task.submission_notes || "");
  const [comment, setComment] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const priorityInfo = PRIORITY_CONFIG[task.priority || "medium"] || PRIORITY_CONFIG.medium;
  const clientName = task.projects?.clients?.business_name || "Unknown Client";
  const serviceType = task.projects?.service_type || "Unknown Service";
  const taskOverdue = isOverdue(task.due_date);
  const taskDueToday = isToday(task.due_date);

  const handleStatusUpdate = async (newStatus: string, requiresNotes = false) => {
    if (requiresNotes && !notes.trim()) {
      setShowNotesInput(true);
      return;
    }

    setIsUpdating(true);
    setActiveAction(newStatus);

    try {
      const supabase = createClient();
      const updateData: Record<string, string | null> = { status: newStatus };

      if (notes.trim()) {
        updateData.submission_notes = notes.trim();
      }

      if (newStatus === "completed") {
        // tasks has no completed_at — the completion timestamp column is completion_date.
        updateData.completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.id);

      if (error) {
        console.error("Task update failed:", error.message);
        toast.error("Failed to save", "Please try again.");
        return;
      }

      onStatusChange(task.id, newStatus, notes.trim() || undefined);
      router.refresh();

      if (newStatus === "completed") {
        onClose();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", "Please try again.");
    } finally {
      setIsUpdating(false);
      setActiveAction(null);
    }
  };

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-lg lg:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Context & SOP */}
        <div className="flex flex-1 flex-col border-b border-line lg:border-b-0 lg:border-r">
          {/* Task Header */}
          <div className="border-b border-line p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-slate-500">
                <Building2 className="h-3.5 w-3.5" />
                {clientName}
              </span>
              <Badge tone="neutral" size="sm">{formatServiceType(serviceType)}</Badge>
              <Badge tone={priorityInfo.tone} size="sm">{priorityInfo.label}</Badge>
            </div>

            <h2 className="mt-3 font-display text-xl font-semibold text-slate-900 sm:text-2xl">
              {task.title}
            </h2>

            <div className="mt-3 flex items-center gap-4">
              <div className={clsx(
                "flex items-center gap-1.5 text-sm",
                taskOverdue ? "text-danger" : taskDueToday ? "text-warn" : "text-slate-500"
              )}>
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {taskOverdue ? "Overdue: " : taskDueToday ? "Due Today: " : "Due: "}
                  {formatDate(task.due_date)}
                </span>
              </div>
            </div>
          </div>

          {/* SOP Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Book className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Standard Operating Procedure
              </h3>
            </div>

            {task.sop_content ? (
              <div className="prose prose-sm max-w-none rounded-xl border border-line bg-surface p-4 sm:p-6">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-semibold text-slate-900 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-slate-900 mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium text-slate-900 mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-slate-600 mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-slate-600 space-y-1 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside text-slate-600 space-y-1 mb-3">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-600">{children}</li>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-deep hover:text-brand-deeper underline">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="bg-slate-100 rounded px-1.5 py-0.5 text-sm text-brand-deep">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-slate-100 rounded-lg p-4 overflow-x-auto text-sm">{children}</pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-brand-line pl-4 italic text-slate-600">{children}</blockquote>
                    ),
                  }}
                >
                  {task.sop_content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60 p-8 text-center">
                <Book className="h-12 w-12 text-slate-700" />
                <p className="mt-3 text-sm text-slate-600">No SOP provided for this task</p>
                <p className="mt-1 text-xs text-slate-500">
                  Contact your Project Manager for instructions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex w-full flex-col bg-canvas lg:w-80">
          {/* Current Status */}
          <div className="border-b border-line p-4 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current Status</p>
            <div className="mt-2">
              <Badge tone={statusInfo.tone}>
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : task.status === "needs_attention" ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Actions</p>
            
            <div className="space-y-3">
              {/* Start Work */}
              {(task.status === "not_started" || task.status === "needs_attention") && (
                <Button
                  onClick={() => handleStatusUpdate("in_progress")}
                  disabled={isUpdating}
                  variant="secondary"
                  className="w-full py-3"
                >
                  {activeAction === "in_progress" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start Work
                </Button>
              )}

              {/* Submit for Review */}
              {task.status === "in_progress" && (
                <Button
                  onClick={() => handleStatusUpdate("in_review")}
                  disabled={isUpdating}
                  variant="secondary"
                  className="w-full py-3"
                >
                  {activeAction === "in_review" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit for Review
                </Button>
              )}

              {/* Needs Attention */}
              {task.status !== "completed" && task.status !== "needs_attention" && (
                <>
                  <button
                    onClick={() => {
                      setShowNotesInput(true);
                    }}
                    disabled={isUpdating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-warn-line bg-warn-soft px-4 py-3 font-semibold text-warn transition-colors hover:bg-amber-100 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Needs Attention
                  </button>

                  {showNotesInput && (
                    <div className="rounded-lg border border-warn-line bg-warn-soft p-3">
                      <p className="mb-2 text-xs font-medium text-warn">
                        What's blocking you?
                      </p>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe the issue..."
                        className="h-24 resize-none"
                      />
                      <Button
                        onClick={() => handleStatusUpdate("needs_attention", true)}
                        disabled={isUpdating || !notes.trim()}
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        {activeAction === "needs_attention" ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : (
                          "Submit Issue"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Mark Complete */}
              {(task.status === "in_progress" || task.status === "in_review") && (
                <Button
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={isUpdating}
                  variant="primary"
                  className="w-full py-3"
                >
                  {activeAction === "completed" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark Complete
                </Button>
              )}
            </div>

            {/* Comment Box */}
            <div className="mt-6">
              <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <MessageSquare className="h-3.5 w-3.5" />
                Notes for PM
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any notes or updates..."
                className="h-24 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-line p-4">
            <Button onClick={onClose} variant="secondary" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

