"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, AlertCircle, ChevronDown, Circle, Loader2, AlertTriangle, CheckCircle2, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import clsx from "clsx";

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  project_id: string | null;
  section_tag?: string | null;
  priority?: string | null;
  assignee?: {
    id?: string;
    full_name: string | null;
  } | null;
  projects?: {
    service_type: string;
    clients?: {
      business_name: string;
    } | null;
  } | null;
}

// ClickUp-style priority flags — collapsed to the five tones
const PRIORITY_FLAGS: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "text-danger" },
  high: { label: "High", cls: "text-warn" },
  medium: { label: "Medium", cls: "text-info" },
  low: { label: "Low", cls: "text-slate-300" },
};

interface TaskCardProps {
  task: Task;
  onStatusChange: () => void;
  onEdit?: (task: Task) => void;
}

// Status options - these should match the database enum/check constraint.
// Status dots collapse to the five tones — no per-status rainbow.
const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-warn", icon: Clock },
  { value: "not_started", label: "Not Started", color: "bg-slate-400", icon: Circle },
  { value: "in_progress", label: "In Progress", color: "bg-brand", icon: Loader2 },
  { value: "in_review", label: "In Review", color: "bg-info", icon: Clock },
  { value: "completed", label: "Completed", color: "bg-brand", icon: CheckCircle2 },
];

export default function TaskCard({ task, onStatusChange, onEdit }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return { label: "No due date", color: "text-slate-500", icon: Clock };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const formatted = due.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (diffDays < 0) {
      return { label: `Overdue: ${formatted}`, color: "text-danger", icon: AlertCircle };
    } else if (diffDays === 0) {
      return { label: "Due Today", color: "text-warn", icon: AlertCircle };
    } else if (diffDays <= 3) {
      return { label: formatted, color: "text-warn", icon: Clock };
    } else {
      return { label: formatted, color: "text-slate-500", icon: Clock };
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    console.log("=== STATUS CHANGE CLICKED ===");
    console.log("Task ID:", task.id);
    console.log("Current status:", task.status);
    console.log("New status:", newStatus);

    if (newStatus === task.status) {
      console.log("Same status, skipping update");
      setIsDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsDropdownOpen(false);

    try {
      console.log("Creating Supabase client...");
      const supabase = createClient();

      console.log("Sending update request...");
      const updateQuery = (supabase.from("tasks") as any)
        .update({ status: newStatus })
        .eq("id", task.id)
        .select("id, status");
      const { data, error } = await updateQuery;

      console.log("Response received:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Could not update task", error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("No data returned - task may not exist or RLS is blocking");
        toast.error("Update returned no data", "The task may not exist or RLS policies are blocking the update.");
        return;
      }

      toast.success("Task updated", `Status → ${newStatus}`);
      onStatusChange();

      // AUDIT: Task Status Change
      await logAudit({
        action: 'update',
        resourceType: 'task',
        resourceId: task.id,
        resourceLabel: task.title,
        oldValue: { status: task.status },
        newValue: { status: newStatus }
      });
    } catch (error: any) {
      console.error("Catch block error:", error);
      toast.error("Unexpected error", error.message || JSON.stringify(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const dueDateInfo = getDueDateInfo(task.due_date);
  const DueDateIcon = dueDateInfo.icon;
  
  // Format secondary label (Project/Client or Strategy Tag)
  let secondaryLabel = "Strategy Task";
  if (task.projects?.clients?.business_name) {
    const clientName = task.projects.clients.business_name;
    const serviceType = task.projects.service_type
      ?.split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "";
    secondaryLabel = `${clientName} · ${serviceType}`;
  } else if (task.section_tag) {
    secondaryLabel = task.section_tag
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const currentStatus = statusOptions.find((s) => s.value === task.status) || statusOptions[0];
  const StatusIcon = currentStatus.icon;

  const priority = PRIORITY_FLAGS[(task.priority || "").toLowerCase()];
  const assigneeName = task.assignee?.full_name || null;

  return (
    <div
      onClick={() => onEdit && onEdit(task)}
      className="group flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-3.5 py-2 transition-all hover:border-line-strong hover:shadow-sm cursor-pointer"
    >
      {/* Left: Status Dropdown + Content */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Status Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            disabled={isUpdating}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all",
              "border border-line bg-surface hover:border-line-strong",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Change task status"
          >
            <div className={clsx("h-2 w-2 rounded-full", currentStatus.color)} />
            <span className="text-slate-500 hidden sm:inline">{currentStatus.label}</span>
            <ChevronDown className={clsx(
              "h-3 w-3 text-slate-400 transition-transform",
              isDropdownOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-line bg-surface py-1 shadow-md">
              {statusOptions.map((option) => {
                const isSelected = option.value === task.status;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={clsx(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-brand-soft text-brand-deep"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className={clsx("h-2 w-2 rounded-full", option.color)} />
                    <span>{option.label}</span>
                    {isSelected && <CheckCircle2 className="ml-auto h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13px] font-medium text-slate-900">{task.title}</h4>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {secondaryLabel}
          </p>
        </div>
      </div>

      {/* Right: priority flag · assignee avatar · due date */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {priority && (
          <span title={`Priority: ${priority.label}`}>
            <Flag className={clsx("h-3.5 w-3.5", priority.cls)} fill="currentColor" />
          </span>
        )}
        {assigneeName && (
          <Avatar name={assigneeName} size="sm" className="h-6 w-6 text-[11px]" />
        )}
        <div className={clsx("flex items-center gap-1.5 text-xs", dueDateInfo.color)}>
          <DueDateIcon className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">{dueDateInfo.label}</span>
        </div>
      </div>
    </div>
  );
}

