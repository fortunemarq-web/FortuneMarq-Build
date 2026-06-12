"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Download, Calendar, ArrowRight, User, Clock, Activity, ChevronDown } from "lucide-react";
import clsx from "clsx";

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
        <div className="min-h-full bg-slate-50 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">
                            Work Hours Analytics
                        </h1>
                        <p className="text-slate-500 mt-2">Team time tracking and engagement reports</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex bg-white rounded-xl p-1 border border-slate-300">
                            {['today', 'week', 'month'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={clsx("px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                                        period === p ? "bg-slate-200 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={downloadCsv}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export Raw CSV
                        </button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                            <Clock className="h-4 w-4" /> Total Hours
                        </div>
                        <div className="text-4xl font-mono tabular-nums font-bold text-slate-900">
                            {data?.aggregated?.reduce((sum: number, u: any) => sum + u.total_hours, 0).toFixed(0) || 0}
                            <span className="text-lg text-slate-600 font-normal ml-1">h</span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                            <Activity className="h-4 w-4" /> Avg Daily
                        </div>
                        <div className="text-4xl font-mono tabular-nums font-bold text-emerald-400">
                            {data?.aggregated?.length > 0 ?
                                (data.aggregated.reduce((sum: number, u: any) => sum + u.avg_daily_hours, 0) / data.aggregated.length).toFixed(1)
                                : 0}
                            <span className="text-lg text-emerald-500/50 font-normal ml-1">h/user</span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                            <User className="h-4 w-4" /> Active Users
                        </div>
                        <div className="text-4xl font-mono tabular-nums font-bold text-blue-400">
                            {data?.aggregated?.length || 0}
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-slate-200 bg-white">
                        <h3 className="font-bold text-lg text-slate-900">User Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">User ID / Name</th>
                                    <th className="px-6 py-4 text-right">Total Hours</th>
                                    <th className="px-6 py-4 text-right">Days Active</th>
                                    <th className="px-6 py-4 text-right">Avg Hrs/Day</th>
                                    <th className="px-6 py-4 text-right">Sessions</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-600">Loading analytics...</td></tr>
                                ) : data?.aggregated?.map((u: any) => (
                                    <Fragment key={u.user_id}>
                                    <tr className="hover:bg-slate-100 group transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                                    {(profiles[u.user_id] || u.user_id).slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className={profiles[u.user_id] ? "text-slate-900" : "font-mono text-slate-600"}>
                                                    {profiles[u.user_id] || `${u.user_id.slice(0, 8)}...`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{u.total_hours}h</td>
                                        <td className="px-6 py-4 text-right text-slate-700">{u.days_present}d</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={clsx("px-2 py-1 rounded",
                                                u.avg_daily_hours > 8 ? "bg-amber-500/10 text-amber-500" :
                                                    u.avg_daily_hours > 6 ? "bg-emerald-500/10 text-emerald-400" :
                                                        "text-slate-500"
                                            )}>
                                                {u.avg_daily_hours}h
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">{u.sessions}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)}
                                                className="text-brand-deep hover:text-slate-900 transition-all flex items-center justify-end gap-1 ml-auto text-xs font-semibold"
                                            >
                                                Details <ChevronDown className={clsx("h-3 w-3 transition-transform", expandedUserId === u.user_id && "rotate-180")} />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedUserId === u.user_id && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={6} className="px-6 py-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Daily breakdown</p>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                    {(data?.daily_stats || [])
                                                        .filter((d: any) => d.user_id === u.user_id)
                                                        .map((d: any) => (
                                                            <div key={`${d.user_id}-${d.work_date || d.date}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                                                <span className="font-medium text-slate-900">{d.work_date || d.date}</span>
                                                                <span className="float-right font-mono tabular-nums text-slate-700">{parseFloat(d.total_hours).toFixed(1)}h</span>
                                                                <span className="block text-xs text-slate-400">{d.sessions_count} session{Number(d.sessions_count) === 1 ? "" : "s"}</span>
                                                            </div>
                                                        ))}
                                                    {(data?.daily_stats || []).filter((d: any) => d.user_id === u.user_id).length === 0 && (
                                                        <p className="text-sm text-slate-500">No daily data for this period.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </Fragment>
                                ))}
                                {!loading && (!data?.aggregated || data.aggregated.length === 0) && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-600">No activity found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-[#555]">
                    * Analytics based on active session time. Cap of 16h/session applied to remove outliers.
                    <br />Timezone: Asia/Kolkata.
                </div>
            </div>
        </div>
    );
}
