"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Book, Calendar, User, Flag, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    const [repeatMonths, setRepeatMonths] = useState(0); // 0 = one-off; N = also create N monthly copies

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

            // Monthly recurrence: create future-dated copies (no schema change
            // needed — they're plain tasks with shifted due dates).
            if (repeatMonths > 0 && dueDate) {
                const copies = Array.from({ length: repeatMonths }, (_, i) => {
                    const d = new Date(dueDate);
                    d.setMonth(d.getMonth() + i + 1);
                    return { ...taskData, due_date: d.toISOString().split("T")[0] };
                });
                const { error: copiesError } = await supabase
                    .from("tasks")
                    .insert(copies as any);
                if (copiesError) console.error("Recurring copies failed:", copiesError.message);
            }

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
            <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl">
                {/* Header */}
                <div className="z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6 sm:py-4">
                    <h2 className="font-display text-base font-semibold text-slate-900 sm:text-lg">
                        Create New Task
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-5 overflow-y-auto bg-surface p-4 sm:p-6">
                    {error && (
                        <div className="rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <Label>Task Title *</Label>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title..."
                            autoFocus
                        />
                    </div>

                    {/* Project Selection */}
                    <div>
                        <Label className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-500" />
                            Project *
                        </Label>
                        <Select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        >
                            <option value="" disabled>Select a project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.clients?.business_name ? `${p.clients.business_name} - ` : ""}{p.name}
                                </option>
                            ))}
                        </Select>
                        {projects.length === 0 && (
                            <p className="mt-1 text-xs text-warn">No active projects found.</p>
                        )}
                    </div>

                    {/* Due Date & Priority Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                Due Date
                            </Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                            {dueDate && (
                                <Select
                                    value={repeatMonths}
                                    onChange={(e) => setRepeatMonths(parseInt(e.target.value))}
                                    title="Also create future monthly copies of this task"
                                    className="mt-2 h-8 text-xs"
                                >
                                    <option value={0}>Does not repeat</option>
                                    <option value={2}>Repeat monthly ×3 (this + 2)</option>
                                    <option value={5}>Repeat monthly ×6 (this + 5)</option>
                                    <option value={11}>Repeat monthly ×12 (this + 11)</option>
                                </Select>
                            )}
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                <Flag className="h-4 w-4 text-slate-500" />
                                Priority
                            </Label>
                            <Select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <Label className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            Assignee
                        </Label>
                        <Select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                        >
                            <option value="unassigned">Unassigned</option>
                            {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* SOP Section */}
                    <div>
                        <Label className="flex items-center gap-2">
                            <Book className="h-4 w-4 text-slate-500" />
                            Description / SOP
                        </Label>
                        <Textarea
                            value={sop}
                            onChange={(e) => setSop(e.target.value)}
                            placeholder="Paste task instructions, SOP link, or step-by-step guide..."
                            className="h-32 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="z-10 mt-auto flex gap-3 border-t border-line bg-surface px-4 py-3 sm:px-6 sm:py-4">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-1"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Task"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
