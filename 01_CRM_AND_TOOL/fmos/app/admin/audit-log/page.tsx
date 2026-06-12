"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    History,
    Search,
    Filter,
    ArrowLeft,
    Download,
    ChevronLeft,
    ChevronRight,
    User,
    Eye,
    Clock,
    Activity
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Filters
    const [userFilter, setUserFilter] = useState("");
    const [resourceFilter, setResourceFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, [page, resourceFilter, actionFilter]);

    async function fetchLogs() {
        setLoading(true);
        let query = supabase
            .from("audit_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (resourceFilter !== "all") query = query.eq("resource_type", resourceFilter);
        if (actionFilter !== "all") query = query.eq("action", actionFilter);
        if (userFilter) query = query.ilike("user_name", `%${userFilter}%`);

        const { data, count, error } = await query;
        if (error) console.error(error);
        else {
            setLogs(data || []);
            setTotal(count || 0);
        }
        setLoading(false);
    }

    const handleExport = () => {
        const headers = ["Time", "User", "Role", "Action", "Resource Type", "Resource Label", "New Value"];

        const escapeCSV = (val: any) => {
            const str = String(val ?? "");
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = logs.map(l => [
            escapeCSV(l.created_at),
            escapeCSV(l.user_name),
            escapeCSV(l.user_role),
            escapeCSV(l.action),
            escapeCSV(l.resource_type),
            escapeCSV(l.resource_label),
            escapeCSV(JSON.stringify(l.new_value))
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM for Excel UTF-8 support
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_log_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderDiff = (oldVal: any, newVal: any) => {
        if (!oldVal && !newVal) return null;
        return (
            <div className="p-4 space-y-4 max-w-sm">
                {oldVal && (
                    <div>
                        <p className="text-[10px] font-black uppercase text-rose-500 mb-1">Old Value</p>
                        <pre className="text-[10px] bg-rose-50 p-2 rounded-lg overflow-x-auto max-h-40">
                            {JSON.stringify(oldVal, null, 2)}
                        </pre>
                    </div>
                )}
                {newVal && (
                    <div>
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">New Value</p>
                        <pre className="text-[10px] bg-emerald-50 p-2 rounded-lg overflow-x-auto max-h-40">
                            {JSON.stringify(newVal, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-1">
                        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Admin Hub</span>
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                            <History className="h-10 w-10 text-[#42CA80]" />
                            Audit Logs
                        </h1>
                        <p className="text-slate-500 font-medium">Complete trail of system activity and administrative changes.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900/5 transition-all transition-all"
                        />
                    </div>

                    <select
                        value={resourceFilter}
                        onChange={(e) => setResourceFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900/5 transition-all"
                    >
                        <option value="all">All Resources</option>
                        <option value="lead">Leads</option>
                        <option value="proposal">Proposals</option>
                        <option value="agreement">Agreements</option>
                        <option value="client">Clients</option>
                        <option value="invoice">Invoices</option>
                        <option value="meeting">Meetings</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="task">Tasks</option>
                        <option value="report">Reports</option>
                        <option value="profile">Users & Roles</option>
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900/5 transition-all"
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="stage_change">Stage Change</option>
                        <option value="login">Login</option>
                        <option value="export">Export</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Resource</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Summary</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <Activity className="h-8 w-8 text-slate-200 animate-pulse mx-auto mb-2" />
                                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Auditing System...</p>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <History className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No logs found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 tabular-nums">
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-200 flex items-center justify-center text-white text-[10px] font-black">
                                                        {log.user_name?.charAt(0) || <User className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{log.user_name}</p>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {log.user_role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border",
                                                    log.action === 'create' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        log.action === 'delete' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            log.action === 'update' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                log.action === 'stage_change' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                )}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{log.resource_type}</span>
                                                    <span className="text-sm font-bold text-slate-900 line-clamp-1">{log.resource_label || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 line-clamp-1">
                                                    {log.summary
                                                        ? log.summary
                                                        : log.action === 'stage_change' && log.old_value?.stage
                                                            ? `${log.old_value.stage} → ${log.new_value?.stage}`
                                                            : log.action === 'update' ? 'Fields updated'
                                                            : log.action === 'create' ? 'Record created'
                                                            : log.action === 'delete' ? 'Record deleted'
                                                            : log.action.replace(/_/g, ' ')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative group/tooltip inline-block">
                                                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                                        <Eye className="h-4 w-4 text-slate-400" />
                                                    </button>
                                                    <div className="absolute right-0 bottom-full mb-2 invisible group-hover/tooltip:visible z-50">
                                                        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-[300px]">
                                                            {renderDiff(log.old_value, log.new_value)}
                                                            {!log.old_value && !log.new_value && (
                                                                <div className="p-4 text-center">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No JSON data recorded</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span> of <span className="text-slate-900">{total}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 transition-all font-bold text-xs"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * pageSize >= total}
                                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 transition-all font-bold text-xs"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
