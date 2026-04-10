"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, ListTodo, Plus } from "lucide-react";
import TaskCard from "./task-card";
import CreateTaskModal from "./create-task-modal";
import TaskModalContent from "@/components/projects/task-modal-content";
import { createClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";
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

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  not_started: "bg-gray-500",
  in_progress: "bg-[#42CA80]",
  in_review: "bg-purple-500",
  completed: "bg-blue-500",
};

export default function TaskBoard({ initialTasks, projects }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    } catch (e) {
      console.error(e);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "open") {
      return task.status !== "completed";
    } else if (activeTab === "completed") {
      return task.status === "completed";
    } else {
      // "my_tasks" - for now show all open tasks (would filter by assigned_to in production)
      return task.status !== "completed";
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 " />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{totalOpen}</span> open tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{totalCompleted}</span> completed
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#42CA80] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#3ab872] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
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
      <div className="mb-6 flex gap-1 rounded-lg bg-white p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      {activeTab === "completed" ? (
        <div className="space-y-2">
          {completedTasks.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-200/50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#3a3a3a]" />
              <p className="mt-2 text-sm text-slate-500">No completed tasks yet</p>
            </div>
          ) : (
            completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-200/30 px-4 py-3 opacity-60"
              >
                <CheckCircle2 className="h-5 w-5 text-[#42CA80]" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm text-slate-500 line-through">
                    {task.title}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-slate-600">
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
                  <h3 className="text-sm font-semibold text-slate-900">
                    {statusLabels[status]}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
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
            <div className="rounded-lg border border-slate-200 bg-slate-200/50 p-8 text-center">
              <ListTodo className="mx-auto h-8 w-8 text-[#3a3a3a]" />
              <p className="mt-2 text-sm text-slate-500">No tasks found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

