"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import SavedViewsBar from "@/components/saved-views/SavedViewsBar";
import BulkActionBar from "@/components/saved-views/BulkActionBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { applyFilters, applySort } from "@/lib/filtering";
import { bulkUpdateEntity } from "@/actions/bulk-actions";
import { SavedView, FilterConfig, SortConfig } from "@/types/view";
import { Loader2, ArrowUpDown, ChevronDown, Check, Users, Search, Inbox } from "lucide-react";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { logAudit } from "@/lib/audit";

export default function LeadsList({ userId }: { userId: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // View State
    const [currentView, setCurrentView] = useState<SavedView | null>(null);
    const [filters, setFilters] = useState<FilterConfig>({});
    const [sort, setSort] = useState<SortConfig>({ field: "created_at", direction: "desc" });

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
        let query = supabase.from("leads").select("*", { count: "exact" });

        query = applyFilters(query, filters);
        query = applySort(query, sort);

        // Limit for now, pagination to be added if needed
        query = query.limit(50);

        const { data: leads, error, count } = await query;
        if (error) {
            console.error(error);
        } else {
            setData(leads || []);
            setTotal(count || 0);
        }
        setLoading(false);
    };

    const handleViewSelect = (view: SavedView) => {
        setCurrentView(view);
        setFilters(view.filters);
        setSort(view.sort);
        clearSelection();
    };

    const handleReset = () => {
        setCurrentView(null);
        setFilters({});
        setSort({ field: "created_at", direction: "desc" });
        clearSelection();
    };

    const handleBulkAction = async (action: string) => {
        const ids = Array.from(selectedIds);
        let updates = {};

        if (action === "change_status") {
            const status = prompt("Enter new status (new, contacting, qualified, closed_lost, etc):");
            if (!status) return;
            updates = { status };
        } else if (action === "assign_sales") {
            const salesId = prompt("Enter Sales Exec UUID:"); // Ideally a picker
            if (!salesId) return;
            updates = { assigned_sales_exec: salesId };
        } else if (action === "export_csv") {
            // Handle export separately
            try {
                const res = await fetch("/api/export", {
                    method: "POST",
                    body: JSON.stringify({ entityType: "lead", filters, sort })
                });
                if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "leads.csv";
                    a.click();

                    // Log Audit
                    await logAudit({
                        action: 'export',
                        resourceType: 'lead',
                        resourceLabel: `CSV Export of leads`,
                        newValue: { filters, sort }
                    });
                } else {
                    alert("Export failed");
                }
            } catch (e) { console.error(e); alert("Export error"); }
            return;
        }

        if (Object.keys(updates).length > 0) {
            const result = await bulkUpdateEntity("lead", ids, updates, action);
            alert(`Updated ${result.successCount} leads.`);

            // Log Audit
            await logAudit({
                action: 'update',
                resourceType: 'lead',
                resourceLabel: `Bulk update: ${action} on ${ids.length} leads`,
                newValue: { updates, count: ids.length, success: result.successCount }
            });
            if (result.failedIds.length > 0) {
                console.warn("Failed IDs:", result.failedIds);
            }
            clearSelection();
            fetchData();
        }
    };

    const toggleSort = (field: string) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc"
        }));
    };

    const handleSelectAllPage = () => {
        if (isAllSelected(data.map(d => d.id))) {
            deselectAll(data.map(d => d.id));
        } else {
            selectAll(data.map(d => d.id));
        }
    };

    const TableSkeleton = () => (
        <>
            {[...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-4">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                </tr>
            ))}
        </>
    );

    return (
        <div className="space-y-4">
            {/* View Bar */}
            <SavedViewsBar
                entityType="lead"
                currentFilters={filters}
                currentSort={sort}
                onViewSelect={handleViewSelect}
                onReset={handleReset}
                userId={userId}
            />

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search company, contact, or type..."
                        className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 transition-shadow shadow-sm"
                        value={filters.search || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <select
                    className="bg-white text-slate-900 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 transition-shadow shadow-sm"
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value ? [e.target.value] : undefined }))}
                    value={filters.status?.[0] || ""}
                >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="closed_won">Closed Won</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 w-[40px]">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-[#42CA80] focus:ring-[#42CA80] focus:ring-offset-0"
                                        checked={data.length > 0 && isAllSelected(data.map(d => d.id))}
                                        onChange={handleSelectAllPage}
                                    />
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('company_name')}>
                                    <div className="flex items-center gap-1">
                                        Company
                                        {sort.field === 'company_name' && <ArrowUpDown className="h-3 w-3 text-[#42CA80]" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('status')}>
                                    <div className="flex items-center gap-1">
                                        Status
                                        {sort.field === 'status' && <ArrowUpDown className="h-3 w-3 text-[#42CA80]" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Lead Type</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center gap-1">
                                        Created
                                        {sort.field === 'created_at' && <ArrowUpDown className="h-3 w-3 text-[#42CA80]" />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <TableSkeleton />
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-0">
                                        <div className="p-8">
                                            <EmptyState
                                                icon={Inbox}
                                                title="No leads found"
                                                description={Object.keys(filters).length > 0
                                                    ? "Try adjusting your search or filters to see more results."
                                                    : "When you add leads, they will appear here in the system."}
                                                action={Object.keys(filters).length > 0 ? {
                                                    label: "Clear all filters",
                                                    onClick: handleReset
                                                } : undefined}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((lead) => (
                                    <tr key={lead.id} className={clsx(
                                        "group transition-colors duration-100 hover:bg-slate-50/70",
                                        isSelected(lead.id) && "bg-slate-50"
                                    )}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-[#42CA80] focus:ring-[#42CA80] focus:ring-offset-0"
                                                checked={isSelected(lead.id)}
                                                onChange={() => toggleSelection(lead.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 leading-none mb-1">
                                                {lead.company_name}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500">{lead.contact_person}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                                                lead.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    lead.status === 'qualified' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        lead.status === 'closed_won' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                            )}>
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {lead.lead_type || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 tabular-nums">
                                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BulkActionBar
                selectedCount={selectedCount}
                entityType="lead"
                onClearSelection={clearSelection}
                onAction={handleBulkAction}
            />
        </div>
    );
}
