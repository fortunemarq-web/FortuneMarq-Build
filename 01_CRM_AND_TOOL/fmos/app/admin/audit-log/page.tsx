"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    History,
    Search,
    ArrowLeft,
    Download,
    ChevronLeft,
    ChevronRight,
    User,
    Eye,
    Activity
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

// Every action maps to one of the five tones — no per-action colour soup.
const ACTION_TONE: Record<string, Tone> = {
    create: "brand",
    delete: "danger",
    update: "info",
    stage_change: "warning",
};

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
            <div className="max-w-sm space-y-4 p-4">
                {oldVal && (
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-danger">Old Value</p>
                        <pre className="max-h-40 overflow-x-auto rounded-lg bg-danger-soft p-2 text-[11px]">
                            {JSON.stringify(oldVal, null, 2)}
                        </pre>
                    </div>
                )}
                {newVal && (
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-brand-deep">New Value</p>
                        <pre className="max-h-40 overflow-x-auto rounded-lg bg-brand-soft p-2 text-[11px]">
                            {JSON.stringify(newVal, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-full bg-canvas p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div className="space-y-1">
                        <Link href="/admin" className="mb-4 flex items-center gap-2 text-slate-400 transition-colors hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide">Admin Hub</span>
                        </Link>
                        <h1 className="flex items-center gap-4 font-display text-2xl font-semibold text-slate-900">
                            <History className="h-8 w-8 text-brand-deep" />
                            Audit Logs
                        </h1>
                        <p className="text-slate-500">Complete trail of system activity and administrative changes.</p>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleExport} variant="secondary">
                            <Download className="h-4 w-4" /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6 flex flex-wrap items-center gap-4 p-4">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            className="h-9 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring"
                        />
                    </div>

                    <Select
                        value={resourceFilter}
                        onChange={(e) => setResourceFilter(e.target.value)}
                        className="w-auto"
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
                    </Select>

                    <Select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="w-auto"
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="stage_change">Stage Change</option>
                        <option value="login">Login</option>
                        <option value="export">Export</option>
                    </Select>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <TR className="hover:bg-transparent">
                                    <TH>Time</TH>
                                    <TH>User</TH>
                                    <TH>Action</TH>
                                    <TH>Resource</TH>
                                    <TH>Summary</TH>
                                    <TH className="text-right">Details</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR className="hover:bg-transparent">
                                        <TD colSpan={6} className="px-6 py-20 text-center">
                                            <Activity className="mx-auto mb-2 h-8 w-8 animate-pulse text-slate-200" />
                                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Auditing System...</p>
                                        </TD>
                                    </TR>
                                ) : logs.length === 0 ? (
                                    <TR className="hover:bg-transparent">
                                        <TD colSpan={6} className="px-6 py-20 text-center">
                                            <History className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">No logs found</p>
                                        </TD>
                                    </TR>
                                ) : (
                                    logs.map((log) => (
                                        <TR key={log.id} className="group">
                                            <TD className="whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-slate-100 text-[11px] font-semibold text-slate-700">
                                                        {log.user_name?.charAt(0) || <User className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="mb-1 text-sm font-semibold leading-none text-slate-900">{log.user_name}</p>
                                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                            {log.user_role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD>
                                                <Badge tone={ACTION_TONE[log.action] || "neutral"} size="sm">
                                                    {log.action.replace('_', ' ')}
                                                </Badge>
                                            </TD>
                                            <TD>
                                                <div className="flex flex-col">
                                                    <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{log.resource_type}</span>
                                                    <span className="line-clamp-1 text-sm font-medium text-slate-900">{log.resource_label || '—'}</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <p className="line-clamp-1 text-sm text-slate-600">
                                                    {log.summary
                                                        ? log.summary
                                                        : log.action === 'stage_change' && log.old_value?.stage
                                                            ? `${log.old_value.stage} → ${log.new_value?.stage}`
                                                            : log.action === 'update' ? 'Fields updated'
                                                            : log.action === 'create' ? 'Record created'
                                                            : log.action === 'delete' ? 'Record deleted'
                                                            : log.action.replace(/_/g, ' ')}
                                                </p>
                                            </TD>
                                            <TD className="text-right">
                                                <div className="group/tooltip relative inline-block">
                                                    <button className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                                                        <Eye className="h-4 w-4 text-slate-400" />
                                                    </button>
                                                    <div className="invisible absolute bottom-full right-0 z-50 mb-2 group-hover/tooltip:visible">
                                                        <div className="min-w-[300px] overflow-hidden rounded-xl border border-line bg-surface shadow-md">
                                                            {renderDiff(log.old_value, log.new_value)}
                                                            {!log.old_value && !log.new_value && (
                                                                <div className="p-4 text-center">
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">No JSON data recorded</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-line bg-slate-50 p-6">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Showing <span className="text-slate-900">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span> of <span className="text-slate-900">{total}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                variant="secondary"
                                size="icon"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * pageSize >= total}
                                variant="secondary"
                                size="icon"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
