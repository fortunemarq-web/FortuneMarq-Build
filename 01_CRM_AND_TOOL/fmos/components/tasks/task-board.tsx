"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, ListTodo, Plus } from "lucide-react";
import TaskCard from "./task-card";
import CreateTaskModal from "./create-task-modal";
import TaskModalContent from "@/components/projects/task-modal-content";
import { createClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import clsx from "clsx";

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  project_id: string | null;
  section_tag?: string | null;
  projects?: {
    service_type: string;
    clients?: {
      business_name: string;
    } | null;
  } | null;
}

interface TaskBoardProps {
  initialTasks: Task[];
  projects: any[]; // Using any[] for simplicity, or reusing the type from modal
  currentUserId?: string | null;
}

type TabType = "open" | "my_tasks" | "completed";

const tabs: { id: TabType; label: string; icon: typeof ListTodo }[] = [
  { id: "open", label: "All Open Tasks", icon: ListTodo },
  { id: "my_tasks", label: "My Tasks", icon: Circle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const statusOrder = ["pending", "not_started", "in_progress", "in_review"];
const statusLabels: Record<string, string> = {
  pending: "Pending",
  not_started: "Not Started",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
};

// Status dots collapse to the five tones — no per-status rainbow.
const statusColors: Record<string, string> = {
  pending: "bg-warn",
  not_started: "bg-slate-400",
  in_progress: "bg-brand",
  in_review: "bg-info",
  completed: "bg-brand",
};

export default function TaskBoard({ initialTasks, projects, currentUserId }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formAssignee, setFormAssignee] = useState("Unassigned");
  const [formPriority, setFormPriority] = useState("medium");
  const [formSOP, setFormSOP] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask]);
    router.refresh();
  };

  const handleStatusChange = () => {
    router.refresh();
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDueDate(task.due_date?.split("T")[0] || "");
    setFormAssignee(task.assigned_to || "Unassigned");
    // Priority not on Task interface here? We'll check. If not, default medium.
    // Casting task as any to access potential extra fields
    setFormPriority((task as any).priority || "medium");
    setFormSOP((task as any).sop_content || "");
    setShowEditModal(true);
  };

  const handleSaveEditedTask = async () => {
    if (!editingTask || !formTitle.trim()) return;

    setIsSaving(true);
    const supabase = createClient();

    try {
      const updates = {
        title: formTitle.trim(),
        due_date: formDueDate || null,
        assigned_to: formAssignee === "Unassigned" ? null : formAssignee,
        priority: formPriority,
        sop_content: formSOP.trim() || null,
      };

      const { error } = await (supabase.from("tasks") as any)
        .update(updates)
        .eq("id", editingTask.id);

      if (error) throw error;

      // Notify if assigned_to changed
      if (updates.assigned_to && updates.assigned_to !== editingTask.assigned_to) {
        await sendNotification({
          userId: updates.assigned_to,
          type: 'task_assigned',
          title: 'Task Assigned/Updated',
          body: `You have been assigned to: ${updates.title}`,
          link: '/tasks'
        });
      }

      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...updates } : t));
      setShowEditModal(false);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save changes", e?.message ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  // ClickUp-style quick-add: type a title, press Enter, task exists.
  const handleQuickAdd = async () => {
    const title = quickAddTitle.trim();
    if (!title || quickAddSaving) return;
    setQuickAddSaving(true);
    const supabase = createClient();
    const { data, error } = await (supabase.from("tasks") as any)
      .insert({
        title,
        status: "pending",
        assigned_to: currentUserId ?? null,
        created_at: new Date().toISOString(),
      })
      .select("id, title, status, due_date, assigned_to, project_id, section_tag, priority")
      .single();
    setQuickAddSaving(false);
    if (error || !data) {
      toast.error("Could not add task", error?.message ?? "No row returned");
      return;
    }
    setTasks(prev => [data as Task, ...prev]);
    setQuickAddTitle("");
    toast.success("Task added", title);
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "open") {
      return task.status !== "completed";
    } else if (activeTab === "completed") {
      return task.status === "completed";
    } else {
      // "my_tasks" — open tasks assigned to the signed-in user
      return task.status !== "completed" && !!currentUserId && task.assigned_to === currentUserId;
    }
  });

  // Group tasks by status
  const groupedTasks = statusOrder.reduce(
    (acc, status) => {
      acc[status] = filteredTasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // For completed tab, just show all completed tasks
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const totalOpen = tasks.filter((t) => t.status !== "completed").length;
  const totalCompleted = tasks.filter((t) => t.status === "completed").length;

  return (
    <div>
      {/* Stats Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{totalOpen}</span> open tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{totalCompleted}</span> completed
            </span>
          </div>
        </div>

        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>

      {/* Quick-add row */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-3 py-1.5 focus-within:border-brand focus-within:border-solid transition-colors">
        <Plus className="h-4 w-4 text-slate-300 shrink-0" />
        <input
          type="text"
          value={quickAddTitle}
          onChange={(e) => setQuickAddTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); }}
          placeholder="Quick add a task — type and press Enter"
          disabled={quickAddSaving}
          className="flex-1 bg-transparent py-1 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
        />
        {quickAddSaving && <span className="text-[11px] text-slate-500">Saving…</span>}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
          projects={projects}
        />
      )}

      {showEditModal && editingTask && (
        <TaskModalContent
          task={editingTask}
          isNew={false}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEditedTask}
          isSaving={isSaving}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formDueDate={formDueDate}
          setFormDueDate={setFormDueDate}
          formAssignee={formAssignee}
          setFormAssignee={setFormAssignee}
          formPriority={formPriority}
          setFormPriority={setFormPriority}
          formSOP={formSOP}
          setFormSOP={setFormSOP}
          tasks={tasks}
        />
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
        />
      </div>

      {/* Task List */}
      {activeTab === "completed" ? (
        <div className="space-y-2">
          {completedTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed tasks yet"
              description="Tasks you mark complete will collect here."
            />
          ) : (
            completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 opacity-60"
              >
                <CheckCircle2 className="h-5 w-5 text-brand" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm text-slate-500 line-through">
                    {task.title}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {task.projects?.clients?.business_name
                      ? `${task.projects.clients.business_name} · ${task.projects.service_type?.replace(/_/g, " ")}`
                      : (task.section_tag?.replace(/_/g, " ") || "Strategy Task")
                    }
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const statusTasks = groupedTasks[status] || [];
            if (statusTasks.length === 0) return null;

            return (
              <div key={status}>
                {/* Status Header */}
                <div className="mb-3 flex items-center gap-2">
                  <div className={clsx("h-2 w-2 rounded-full", statusColors[status])} />
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    {statusLabels[status]}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-500">
                    {statusTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={openEditModal}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <EmptyState
              icon={ListTodo}
              title="No tasks found"
              description="Nothing matches this view yet. Add a task or switch tabs."
            />
          )}
        </div>
      )}
    </div>
  );
}

