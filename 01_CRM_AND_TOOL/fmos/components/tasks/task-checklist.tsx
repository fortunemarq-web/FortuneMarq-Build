"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { CheckSquare, Square, Plus, Trash2, GripVertical } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { promptModal } from "@/components/ui/prompt-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
    id: string;
    title: string;
    is_done: boolean;
    sort_order: number;
}

interface TaskChecklistProps {
    taskId: string;
    initialItems: ChecklistItem[];
}

export default function TaskChecklist({ taskId, initialItems }: TaskChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(initialItems.sort((a, b) => a.sort_order - b.sort_order));
    const [newItemTitle, setNewItemTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const supabase = createClient();

    const addItem = async () => {
        if (!newItemTitle.trim()) return;
        setIsAdding(true);
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;

        try {
            const { data, error } = await supabase.from("task_checklist_items").insert({
                task_id: taskId,
                title: newItemTitle.trim(),
                sort_order: nextOrder
            }).select().single();

            if (error) throw error;
            if (data) setItems([...items, data as any]);
            setNewItemTitle("");

            // Log activity? Prompt says "log activity_event" on completion toggle, maybe add too.
        } catch (e) {
            console.error(e);
        } finally {
            setIsAdding(false);
        }
    };

    const toggleItem = async (item: ChecklistItem) => {
        // Optimistic update
        const newStatus = !item.is_done;
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: newStatus } : i));

        try {
            const updates: any = {
                is_done: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            };
            // completed_by should ideally be set here using session, but RLS/DB trigger or client session fetch needed.
            // Supabase 'auth.uid()' default in RLS is for policies, for insert/update columns we usually pass explicitly if needed OR use database trigger.
            // We'll skip completed_by for brevity or fetch user. 
            const { data: { user } } = await supabase.auth.getUser();
            if (newStatus && user) updates.completed_by = user.id;

            await supabase.from("task_checklist_items").update(updates).eq("id", item.id);

            if (newStatus) {
                await logAudit({
                    action: 'update',
                    resourceType: 'task',
                    resourceId: taskId,
                    resourceLabel: `Checklist Item: ${item.title}`,
                    newValue: { status: 'completed' }
                });
            }

        } catch (e) {
            console.error(e);
            // Revert
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: !newStatus } : i));
        }
    };

    const deleteItem = async (id: string) => {
        const ok = await promptModal({ title: "Delete checklist item?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
        if (!ok) return;
        setItems(prev => prev.filter(i => i.id !== id));
        await supabase.from("task_checklist_items").delete().eq("id", id);
    };

    const progress = items.length > 0 ? Math.round((items.filter(i => i.is_done).length / items.length) * 100) : 0;

    return (
        <div className="mt-6 border-t border-line pt-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-brand-deep" />
                    Checklist
                </h3>
                <span className="text-xs text-slate-600 tabular-nums">{progress}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="space-y-2 mb-4">
                {items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 group hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        <div className="mt-0.5 cursor-move text-slate-400 opacity-0 group-hover:opacity-100">
                            <GripVertical className="h-4 w-4" />
                        </div>
                        <button onClick={() => toggleItem(item)} className="mt-0.5 text-slate-500 hover:text-slate-900 transition-colors">
                            {item.is_done ? <CheckSquare className="h-4 w-4 text-brand-deep" /> : <Square className="h-4 w-4" />}
                        </button>
                        <span className={item.is_done ? "text-slate-500 line-through flex-1 text-sm" : "text-slate-700 flex-1 text-sm"}>
                            {item.title}
                        </span>
                        <button onClick={() => deleteItem(item.id)} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-danger">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    placeholder="Add subtask..."
                    className="flex-1"
                />
                <Button variant="secondary" size="icon" onClick={addItem} disabled={isAdding}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
