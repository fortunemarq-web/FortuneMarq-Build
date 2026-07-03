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
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { getStage, leadStageUpdate, PIPELINE_STAGES } from "@/lib/pipeline";
import LeadPeekPanel from "@/components/leads/lead-peek-panel";

// Quick filter chips over outreach_stage (the real pipeline position)
const STAGE_CHIPS: Array<{ label: string; stages: string[] | null }> = [
    { label: "All", stages: null },
    { label: "New", stages: ["touch1_pending"] },
    { label: "Follow-up", stages: ["follow_up_due", "no_answer", "follow_back"] },
    { label: "Engaged", stages: ["curiosity_sent", "pdf_sent"] },
    { label: "Meeting", stages: ["meeting_booked"] },
    { label: "Proposal", stages: ["proposal_sent"] },
    { label: "Won", stages: ["won"] },
];

export default function LeadsList({ userId }: { userId: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [peekLead, setPeekLead] = useState<any | null>(null);

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

    const PAGE_SIZE = 50;
    const [page, setPage] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [filters, sort]);

    useEffect(() => {
        fetchData();
    }, [filters, sort, page]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        let query = supabase.from("leads").select("*", { count: "exact" });

        query = applyFilters(query, filters);
        query = applySort(query, sort);

        // DB-level pagination
        query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

        const { data: leads, error, count } = await query;
        if (error) {
            console.error(error);
        } else {
            setData(leads || []);
            setTotal(count || 0);
        }
        setLoading(false);
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
            const stage = await promptModal({
                title: "Move to stage",
                description: `Applies to ${ids.length} selected lead${ids.length === 1 ? "" : "s"}.`,
                type: "select",
                options: PIPELINE_STAGES.map(s => ({ value: s.key, label: s.label })),
                confirmLabel: "Move",
            });
            if (!stage) return;
            // Stage writes only via lib/pipeline.ts — keeps status in lockstep
            updates = leadStageUpdate(stage);
        } else if (action === "assign_sales") {
            const supabase = createClient();
            const { data: execs } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .order("full_name");
            if (!execs || execs.length === 0) {
                toast.error("No team members found");
                return;
            }
            const salesId = await promptModal({
                title: "Assign to sales exec",
                description: `Applies to ${ids.length} selected lead${ids.length === 1 ? "" : "s"}.`,
                type: "select",
                options: execs.map((p: any) => ({ value: p.id, label: `${p.full_name} (${p.role})` })),
                confirmLabel: "Assign",
            });
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
                    toast.error("Export failed");
                }
            } catch (e) { console.error(e); toast.error("Export error"); }
            return;
        }

        if (Object.keys(updates).length > 0) {
            const result = await bulkUpdateEntity("lead", ids, updates, action);
            toast.success(`Updated ${result.successCount} leads`);

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
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
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
                        placeholder="Search company, contact, or phone..."
                        className="w-full bg-surface text-slate-900 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/30 transition-shadow shadow-sm"
                        value={filters.search || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                {/* Stage chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {STAGE_CHIPS.map((chip) => {
                        const isActive = chip.stages === null
                            ? !filters.outreach_stage
                            : JSON.stringify(filters.outreach_stage) === JSON.stringify(chip.stages);
                        return (
                            <button
                                key={chip.label}
                                onClick={() => setFilters(prev => ({ ...prev, outreach_stage: chip.stages ?? undefined }))}
                                className={clsx(
                                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                    isActive
                                        ? "border-slate-900 bg-surface text-white"
                                        : "border-slate-200 bg-surface text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                )}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 w-[40px]">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand focus:ring-offset-0"
                                        checked={data.length > 0 && isAllSelected(data.map(d => d.id))}
                                        onChange={handleSelectAllPage}
                                    />
                                </th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('company_name')}>
                                    <div className="flex items-center gap-1">
                                        Company
                                        {sort.field === 'company_name' && <ArrowUpDown className="h-3 w-3 text-brand-deep" />}
                                    </div>
                                </th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('outreach_stage')}>
                                    <div className="flex items-center gap-1">
                                        Stage
                                        {sort.field === 'outreach_stage' && <ArrowUpDown className="h-3 w-3 text-brand-deep" />}
                                    </div>
                                </th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('city')}>
                                    <div className="flex items-center gap-1">
                                        City
                                        {sort.field === 'city' && <ArrowUpDown className="h-3 w-3 text-brand-deep" />}
                                    </div>
                                </th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center gap-1">
                                        Created
                                        {sort.field === 'created_at' && <ArrowUpDown className="h-3 w-3 text-brand-deep" />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <TableSkeleton />
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-0">
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
                                data.map((lead) => {
                                    const stageDef = getStage(lead.outreach_stage);
                                    return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setPeekLead(lead)}
                                        className={clsx(
                                            "group cursor-pointer transition-colors duration-100 hover:bg-slate-50/70",
                                            isSelected(lead.id) && "bg-slate-50"
                                        )}
                                    >
                                        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand focus:ring-offset-0"
                                                checked={isSelected(lead.id)}
                                                onChange={() => toggleSelection(lead.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="text-[13px] font-semibold text-slate-900 leading-tight">
                                                {lead.company_name}
                                            </div>
                                            {lead.contact_person && (
                                                <div className="text-[11px] font-medium text-slate-400">{lead.contact_person}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide",
                                                stageDef ? stageDef.badge : "bg-slate-100 text-slate-600"
                                            )}>
                                                {stageDef?.label || (lead.outreach_stage || "—").replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-[13px] text-slate-600">
                                            {lead.city || "—"}
                                        </td>
                                        <td className="px-4 py-2 text-[12px] text-slate-500 tabular-nums">
                                            {lead.phone || "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {lead.lead_type || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-500">
                        Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} leads
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-medium text-slate-500 tabular-nums">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <BulkActionBar
                selectedCount={selectedCount}
                entityType="lead"
                onClearSelection={clearSelection}
                onAction={handleBulkAction}
            />

            {/* Slide-over lead preview */}
            {peekLead && (
                <LeadPeekPanel
                    lead={peekLead}
                    onClose={() => setPeekLead(null)}
                    onUpdated={(patch) => {
                        setData(prev => prev.map(l => l.id === patch.id ? { ...l, ...patch } : l));
                        setPeekLead((prev: any) => prev && prev.id === patch.id ? { ...prev, ...patch } : prev);
                    }}
                />
            )}
        </div>
    );
}
