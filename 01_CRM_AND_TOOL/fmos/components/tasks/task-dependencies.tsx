"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Link as LinkIcon, AlertCircle, Plus, X } from "lucide-react";
import clsx from "clsx";

interface TaskDependency {
    id: string;
    dependency_type: string;
    depends_on: {
        id: string;
        title: string;
        status: string;
    };
}

interface TaskDependenciesProps {
    taskId: string;
    projectId: string;
    initialDependencies: TaskDependency[];
    availableTasks: any[]; // List of tasks in project to select from
}

export default function TaskDependencies({ taskId, projectId, initialDependencies, availableTasks }: TaskDependenciesProps) {
    const [dependencies, setDependencies] = useState<TaskDependency[]>(initialDependencies);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState("");

    const supabase = createClient();

    const addDependency = async () => {
        if (!selectedTaskId || selectedTaskId === taskId) return;

        try {
            const { data, error } = await supabase.from("task_dependencies" as any).insert({
                task_id: taskId,
                depends_on_task_id: selectedTaskId,
                dependency_type: 'blocks'
            }).select(`
                id,
                dependency_type,
                depends_on:depends_on_task_id (id, title, status)
            `).single(); // need to align select with interface structure, Supabase returns json object structure if mapped correctly or flatter.
            // Actually, Supabase returns: { id, dependency_type, depends_on: { ... } } if query is structured right.

            if (error) throw error;
            if (data) {
                // Ensure shape matches
                setDependencies([...dependencies, data as any]);
            }
            setIsAdding(false);
            setSelectedTaskId("");
        } catch (e) {
            console.error(e);
            alert("Failed to add dependency (detecting cycle?)");
        }
    };

    const removeDependency = async (id: string) => {
        await supabase.from("task_dependencies" as any).delete().eq("id", id);
        setDependencies(prev => prev.filter(d => d.id !== id));
    };

    // Filter available tasks: exclude self and already dependent
    const options = availableTasks.filter(t => t.id !== taskId && !dependencies.some(d => d.depends_on.id === t.id));

    return (
        <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-400" />
                    Dependencies
                </h3>
            </div>

            {dependencies.length > 0 ? (
                <div className="space-y-2 mb-4">
                    {dependencies.map(dep => (
                        <div key={dep.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 group">
                            <div className="flex items-center gap-2">
                                <AlertCircle className={clsx("h-3.5 w-3.5", dep.depends_on.status === 'completed' ? "text-green-500" : "text-amber-500")} />
                                <div className="text-sm">
                                    <span className="text-slate-600 text-xs uppercase mr-2">{dep.dependency_type}</span>
                                    <span className={dep.depends_on.status === 'completed' ? "text-slate-600 line-through" : "text-slate-700"}>
                                        {dep.depends_on.title}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => removeDependency(dep.id)} className="text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-600 mb-4 italic">No dependencies. This task is not blocked.</p>
            )}

            {isAdding ? (
                <div className="flex gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-900 focus:outline-none"
                        value={selectedTaskId}
                        onChange={e => setSelectedTaskId(e.target.value)}
                    >
                        <option value="">Select task...</option>
                        {options.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                    <button onClick={addDependency} disabled={!selectedTaskId} className="bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 text-white px-3 py-1 rounded text-sm font-bold">Add</button>
                    <button onClick={() => setIsAdding(false)} className="bg-white text-slate-900 px-3 py-1 rounded text-sm">Cancel</button>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="text-xs text-[#42CA80] hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Blocking Task
                </button>
            )}
        </div>
    );
}
