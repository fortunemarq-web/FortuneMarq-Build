"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Download, User, Clock, Activity, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default function WorkHoursReportPage() {
    const [period, setPeriod] = useState('week'); // today, week, month
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Record<string, string>>({});
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
    }, [period]);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("profiles")
            .select("id, full_name")
            .then(({ data: rows }) => {
                if (!rows) return;
                const map: Record<string, string> = {};
                rows.forEach((p: any) => { map[p.id] = p.full_name; });
                setProfiles(map);
            });
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        const res = await fetch(`/api/reports/work-hours?period=${period}`);
        const json = await res.json();
        setData(json);
        setLoading(false);
    };

    const downloadCsv = () => {
        window.open('/api/reports/sessions/export.csv', '_blank');
    };

    return (
        <div className="min-h-full bg-canvas px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}
                <PageHeader
                    title="Work Hours Analytics"
                    subtitle="Team time tracking and engagement reports"
                    actions={
                        <>
                            <div className="flex rounded-lg border border-line bg-surface p-1">
                                {['today', 'week', 'month'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={clsx("rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                                            period === p ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <Button onClick={downloadCsv}>
                                <Download className="h-4 w-4" /> Export Raw CSV
                            </Button>
                        </>
                    }
                />

                {/* KPI Strip */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard
                        label="Total Hours"
                        value={`${data?.aggregated?.reduce((sum: number, u: any) => sum + u.total_hours, 0).toFixed(0) || 0}h`}
                        icon={Clock}
                    />
                    <StatCard
                        label="Avg Daily"
                        value={`${data?.aggregated?.length > 0 ?
                            (data.aggregated.reduce((sum: number, u: any) => sum + u.avg_daily_hours, 0) / data.aggregated.length).toFixed(1)
                            : 0}h/user`}
                        icon={Activity}
                    />
                    <StatCard
                        label="Active Users"
                        value={data?.aggregated?.length || 0}
                        icon={User}
                    />
                </div>

                {/* Main Table */}
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>User Performance</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <TR className="hover:bg-transparent">
                                    <TH>User ID / Name</TH>
                                    <TH className="text-right">Total Hours</TH>
                                    <TH className="text-right">Days Active</TH>
                                    <TH className="text-right">Avg Hrs/Day</TH>
                                    <TH className="text-right">Sessions</TH>
                                    <TH></TH>
                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR className="hover:bg-transparent"><TD colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading analytics...</TD></TR>
                                ) : data?.aggregated?.map((u: any) => (
                                    <Fragment key={u.user_id}>
                                    <TR className="group">
                                        <TD className="font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-deep">
                                                    {(profiles[u.user_id] || u.user_id).slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className={profiles[u.user_id] ? "text-slate-900" : "tabular-nums text-slate-600"}>
                                                    {profiles[u.user_id] || `${u.user_id.slice(0, 8)}...`}
                                                </span>
                                            </div>
                                        </TD>
                                        <TD className="text-right font-semibold tabular-nums text-slate-900">{u.total_hours}h</TD>
                                        <TD className="text-right tabular-nums text-slate-700">{u.days_present}d</TD>
                                        <TD className="text-right">
                                            <span className={clsx("rounded px-2 py-1 tabular-nums",
                                                u.avg_daily_hours > 8 ? "bg-warn-soft text-warn" :
                                                    u.avg_daily_hours > 6 ? "bg-brand-soft text-brand-deep" :
                                                        "text-slate-500"
                                            )}>
                                                {u.avg_daily_hours}h
                                            </span>
                                        </TD>
                                        <TD className="text-right tabular-nums text-slate-500">{u.sessions}</TD>
                                        <TD className="text-right">
                                            <button
                                                onClick={() => setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)}
                                                className="ml-auto flex items-center justify-end gap-1 text-xs font-semibold text-brand-deep transition-colors hover:text-brand-deeper"
                                            >
                                                Details <ChevronDown className={clsx("h-3 w-3 transition-transform", expandedUserId === u.user_id && "rotate-180")} />
                                            </button>
                                        </TD>
                                    </TR>
                                    {expandedUserId === u.user_id && (
                                        <TR className="bg-slate-50 hover:bg-slate-50">
                                            <TD colSpan={6} className="px-6 py-4">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Daily breakdown</p>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                    {(data?.daily_stats || [])
                                                        .filter((d: any) => d.user_id === u.user_id)
                                                        .map((d: any) => (
                                                            <div key={`${d.user_id}-${d.work_date || d.date}`} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                                                                <span className="font-medium text-slate-900">{d.work_date || d.date}</span>
                                                                <span className="float-right tabular-nums text-slate-700">{parseFloat(d.total_hours).toFixed(1)}h</span>
                                                                <span className="block text-xs text-slate-400">{d.sessions_count} session{Number(d.sessions_count) === 1 ? "" : "s"}</span>
                                                            </div>
                                                        ))}
                                                    {(data?.daily_stats || []).filter((d: any) => d.user_id === u.user_id).length === 0 && (
                                                        <p className="text-sm text-slate-500">No daily data for this period.</p>
                                                    )}
                                                </div>
                                            </TD>
                                        </TR>
                                    )}
                                    </Fragment>
                                ))}
                                {!loading && (!data?.aggregated || data.aggregated.length === 0) && (
                                    <TR className="hover:bg-transparent"><TD colSpan={6} className="px-6 py-12 text-center text-slate-500">No activity found for this period.</TD></TR>
                                )}
                            </TBody>
                        </Table>
                    </div>
                </Card>

                <div className="text-center text-xs text-slate-500">
                    * Analytics based on active session time. Cap of 16h/session applied to remove outliers.
                    <br />Timezone: Asia/Kolkata.
                </div>
            </div>
        </div>
    );
}
