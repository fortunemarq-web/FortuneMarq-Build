"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Book } from "lucide-react";
import { createClient } from "@/lib/supabase";
import TaskChecklist from "@/components/tasks/task-checklist";
import TaskDependencies from "@/components/tasks/task-dependencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Profile {
    id: string;
    full_name: string;
}

const PRIORITIES = [
    { value: "high", label: "High" },
    { value: "medium", label: "Med" },
    { value: "low", label: "Low" },
];

export default function TaskModalContent({
    task,
    isNew,
    onClose,
    onSave,
    isSaving,
    formTitle,
    setFormTitle,
    formDueDate,
    setFormDueDate,
    formAssignee,
    setFormAssignee,
    formPriority,
    setFormPriority,
    formSOP,
    setFormSOP,
    tasks
}: any) {
    const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'dependencies'>('details');
    const [checklistItems, setChecklistItems] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [loadingExtras, setLoadingExtras] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            const supabase = createClient();
            const { data } = await supabase.from("profiles").select("id, full_name");
            if (data) setProfiles(data as Profile[]);
        };
        fetchProfiles();
    }, []);

    // Only fetch extras if existing task
    useEffect(() => {
        if (isNew) return;

        async function fetchExtras() {
            setLoadingExtras(true);
            const supabase = createClient();

            // Fetch checklist
            const { data: cl } = await supabase.from("task_checklist_items").select("*").eq("task_id", task.id);
            if (cl) setChecklistItems(cl as any);

            // Fetch dependencies
            const { data: deps } = await supabase.from("task_dependencies").select(`
                id,
                dependency_type,
                depends_on:depends_on_task_id (id, title, status)
            `).eq("task_id", task.id);
            if (deps) setDependencies(deps as any);

            setLoadingExtras(false);
        }
        fetchExtras();
    }, [task?.id, isNew]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6 sm:py-4 bg-surface z-10">
                    <h2 className="font-display text-base font-semibold text-slate-900 sm:text-lg">
                        {isNew ? "Add New Task" : "Edit Task"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs (only for existing tasks) */}
                {!isNew && (
                    <div className="flex border-b border-line bg-surface">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-deep text-brand-deep' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'checklist' ? 'border-brand-deep text-brand-deep' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                        >
                            Checklist
                        </button>
                        <button
                            onClick={() => setActiveTab('dependencies')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dependencies' ? 'border-brand-deep text-brand-deep' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                        >
                            Dependencies
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface">
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <Label>Task Title *</Label>
                                <Input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Enter task title..."
                                />
                            </div>

                            {/* Due Date & Priority Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={formDueDate}
                                        onChange={(e) => setFormDueDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <Select
                                        value={formPriority}
                                        onChange={(e) => setFormPriority(e.target.value)}
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
                                <Label>Assignee</Label>
                                <Select
                                    value={formAssignee}
                                    onChange={(e) => setFormAssignee(e.target.value)}
                                >
                                    <option value="Unassigned">Unassigned</option>
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
                                    <Book className="h-4 w-4 text-brand-deep" />
                                    SOP / Instructions
                                </Label>
                                <Textarea
                                    value={formSOP}
                                    onChange={(e) => setFormSOP(e.target.value)}
                                    placeholder="Paste task instructions, SOP link, or step-by-step guide..."
                                    className="h-32 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'checklist' && (
                        loadingExtras ? <div className="p-8 text-center text-slate-500">Loading checklist...</div> :
                            <TaskChecklist taskId={task.id} initialItems={checklistItems} />
                    )}

                    {activeTab === 'dependencies' && (
                        loadingExtras ? <div className="p-8 text-center text-slate-500">Loading dependencies...</div> :
                            <TaskDependencies taskId={task.id} projectId={task.project_id} initialDependencies={dependencies} availableTasks={tasks} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-line bg-surface px-4 py-3 sm:px-6 sm:py-4 z-10 mt-auto">
                    <Button onClick={onClose} variant="secondary" className="flex-1">
                        Close
                    </Button>
                    {activeTab === 'details' && (
                        <Button
                            onClick={onSave}
                            variant="primary"
                            disabled={isSaving || !formTitle.trim()}
                            className="flex-1"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
