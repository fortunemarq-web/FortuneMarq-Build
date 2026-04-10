"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Book, Calendar, User, Flag, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";

interface Profile {
    id: string;
    full_name: string;
}

interface Project {
    id: string;
    name: string;
    clients?: {
        business_name: string;
    } | null;
}

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: (newTask: any) => void;
    projects: Project[];
}

const PRIORITIES = [
    { value: "high", label: "High" },
    { value: "medium", label: "Med" },
    { value: "low", label: "Low" },
];

export default function CreateTaskModal({
    onClose,
    onTaskCreated,
    projects
}: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [projectId, setProjectId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assigneeId, setAssigneeId] = useState<string>("unassigned");
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [priority, setPriority] = useState("medium");
    const [sop, setSop] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data } = await supabase.from("profiles").select("id, full_name");
            if (data) setProfiles(data as Profile[]);
        };
        fetchProfiles();
    }, []);

    // Error handling
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError("Task title is required");
            return;
        }
        if (!projectId) {
            setError("Please select a project");
            return;
        }

        setError(null);
        setIsSaving(true);
        const supabase = createClient();

        try {
            const taskData = {
                title: title.trim(),
                project_id: projectId,
                due_date: dueDate || null,
                assigned_to: assigneeId === "unassigned" ? null : assigneeId,
                priority: priority,
                sop_content: sop.trim() || null,
                status: "not_started"
            };

            const { data, error: insertError } = await supabase
                .from("tasks")
                .insert(taskData as any)
                .select(`
          *,
          projects (
            id,
            name,
            service_type,
            clients (
              business_name
            )
          )
        `)
                .single();

            if (insertError) throw insertError;

            // Trigger Notification
            if (taskData.assigned_to) {
                await sendNotification({
                    userId: taskData.assigned_to,
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    body: `You have been assigned a new task: ${taskData.title}`,
                    link: '/tasks'
                });
            }

            onTaskCreated(data);
            onClose();
        } catch (e: any) {
            console.error("Error creating task:", e);
            setError(e.message || "Failed to create task");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-slate-200 bg-slate-50 shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 z-10">
                    <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                        Create New Task
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title..."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-[#666] focus:border-[#42CA80]/50 focus:outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Project Selection */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Briefcase className="h-4 w-4 text-slate-500" />
                            Project *
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-[#42CA80]/50 focus:outline-none"
                        >
                            <option value="" disabled>Select a project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.clients?.business_name ? `${p.clients.business_name} - ` : ""}{p.name}
                                </option>
                            ))}
                        </select>
                        {projects.length === 0 && (
                            <p className="mt-1 text-xs text-amber-500">No active projects found.</p>
                        )}
                    </div>

                    {/* Due Date & Priority Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-[#42CA80]/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Flag className="h-4 w-4 text-slate-500" />
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-[#42CA80]/50 focus:outline-none"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <User className="h-4 w-4 text-slate-500" />
                            Assignee
                        </label>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-[#42CA80]/50 focus:outline-none"
                        >
                            <option value="unassigned">Unassigned</option>
                            {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SOP Section */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Book className="h-4 w-4 text-indigo-400" />
                            Description / SOP
                        </label>
                        <textarea
                            value={sop}
                            onChange={(e) => setSop(e.target.value)}
                            placeholder="Paste task instructions, SOP link, or step-by-step guide..."
                            className="h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-[#666] focus:border-indigo-500/50 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 z-10 mt-auto">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-900 transition-colors hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Task"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
