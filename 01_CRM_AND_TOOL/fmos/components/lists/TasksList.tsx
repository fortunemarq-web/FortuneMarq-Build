"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import BulkActionBar from "@/components/saved-views/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { applyFilters, applySort } from "@/lib/filtering";
import { bulkUpdateEntity } from "@/actions/bulk-actions";
import { FilterConfig, SortConfig } from "@/types/view";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";

export default function TasksList({ userId }: { userId: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // View State
    const [filters, setFilters] = useState<FilterConfig>({});
    const [sort, setSort] = useState<SortConfig>({ field: "due_date", direction: "asc" });

    const {
        selectedIds,
        toggleSelection,
        selectAll,
        deselectAll,
        clearSelection,
        isSelected,
        isAllSelected,
        count: selectedCount,
    } = useBulkSelection<string>();

    useEffect(() => {
        fetchData();
    }, [filters, sort]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        // We explicitly select columns and avoid wildcard joins to prevent auto-expansion into 'users' table
        let query = supabase.from("tasks").select(`
            id,
            title,
            status,
            due_date,
            assigned_to,
            project_id,
            projects (
                service_type,
                clients (
                    business_name
                )
            ),
            assignee:profiles (
                full_name
            )
        `, { count: "exact" });
        query = applyFilters(query, filters);
        query = applySort(query, sort);
        query = query.limit(50);
        const { data: tasks, error } = await query;
        if (!error) setData(tasks || []);
        setLoading(false);
    };

    const handleBulkAction = async (action: string) => {
        const ids = Array.from(selectedIds);
        let updates: any = {};
        if (action === "change_status") {
            const val = await promptModal({
                title: "Change task status",
                description: `Applies to ${ids.length} selected task${ids.length === 1 ? "" : "s"}.`,
                type: "select",
                options: [
                    { value: "pending", label: "Pending" },
                    { value: "not_started", label: "Not Started" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "in_review", label: "In Review" },
                    { value: "completed", label: "Completed" },
                ],
                confirmLabel: "Update",
            });
            if (val) updates.status = val;
        } else if (action === "mark_completed") {
            updates.status = "completed";
        }

        if (Object.keys(updates).length > 0) {
            await bulkUpdateEntity("task", ids, updates, action);
            toast.success("Tasks updated");
            clearSelection();
            fetchData();
        }
    };

    const handleSelectAllPage = () => {
        const ids = data.map(d => d.id);
        isAllSelected(ids) ? deselectAll(ids) : selectAll(ids);
    };

    return (
        <div className="space-y-4">
            <SavedViewsBar
                entityType="task"
                currentFilters={filters}
                currentSort={sort}
                onViewSelect={(v) => { setFilters(v.filters); setSort(v.sort); clearSelection(); }}
                onReset={() => { setFilters({}); setSort({ field: "due_date", direction: "asc" }); clearSelection(); }}
                userId={userId}
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-white text-xs uppercase font-medium text-slate-900">
                            <tr>
                                <th className="px-4 py-3 w-[40px]"><input type="checkbox" checked={data.length > 0 && isAllSelected(data.map(d => d.id))} onChange={handleSelectAllPage} className="rounded border-[#2a2a2a] bg-slate-50" /></th>
                                <th className="px-4 py-3">Task Title</th>
                                <th className="px-4 py-3">Project / Client</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? <tr><td colSpan={5} className="py-8 text-center text-slate-600"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></td></tr> :
                                data.length === 0 ? <tr><td colSpan={5} className="py-8 text-center">No tasks</td></tr> :
                                    data.map(task => (
                                        <tr key={task.id} className={clsx("hover:bg-white", isSelected(task.id) && "bg-white")}>
                                            <td className="px-4 py-3"><input type="checkbox" checked={isSelected(task.id)} onChange={() => toggleSelection(task.id)} className="rounded border-[#2a2a2a] bg-slate-50" /></td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                                            <td className="px-4 py-3">{task.projects?.clients?.business_name || task.projects?.service_type || "-"}</td>
                                            <td className="px-4 py-3">{task.status}</td>
                                            <td className="px-4 py-3">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <BulkActionBar selectedCount={selectedCount} entityType="task" onClearSelection={clearSelection} onAction={handleBulkAction} />
        </div>
    );
}
