"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    Target,
    Award,
    Flame,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Building2,
    Calendar,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string;
    total_calls: number;
    interested_count: number;
    conversion_rate: number;
    streak: number;
}

interface PerformanceMetric {
    label: string;
    value: string | number;
    subtext: string;
    trend?: "up" | "down";
    trendValue?: string;
    icon: any;
    color: string;
}

export default function ManagerPerformance() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("week");
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchPerformanceData();
    }, [timeframe]);

    const fetchPerformanceData = async () => {
        setIsLoading(true);
        try {
            // In a real app, we'd filter by timeframe in the query
            const { data, error } = await supabase
                .from("telecaller_leaderboard" as any)
                .select("*")
                .order("interested_count", { ascending: false });

            if (error) throw error;
            setLeaderboard((data as unknown) as LeaderboardEntry[]);
        } catch (error) {
            console.error("Error fetching performance data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const metrics: PerformanceMetric[] = [
        {
            label: "Total Agency Calls",
            value: leaderboard.reduce((acc, curr) => acc + curr.total_calls, 0),
            subtext: "Across all telecallers",
            trend: "up",
            trendValue: "+12.5%",
            icon: BarChart3,
            color: "blue"
        },
        {
            label: "Total Interested",
            value: leaderboard.reduce((acc, curr) => acc + curr.interested_count, 0),
            subtext: "Qualified Leads",
            trend: "up",
            trendValue: "+8.2%",
            icon: Target,
            color: "emerald"
        },
        {
            label: "Avg. Conversion",
            value: (leaderboard.reduce((acc, curr) => acc + curr.conversion_rate, 0) / (leaderboard.length || 1)).toFixed(1) + "%",
            subtext: "Call-to-Interested",
            trend: "down",
            trendValue: "-1.4%",
            icon: TrendingUp,
            color: "amber"
        }
    ];

    const filteredLeaderboard = leaderboard.filter(entry =>
        entry.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Performance</h1>
                    <p className="text-slate-500 font-medium">Real-time leaderboard and agency metrics</p>
                </div>

                <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
                    {(["today", "week", "month"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                                timeframe === t ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                    >
                        <div className={clsx(
                            "absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full -mr-16 -mt-16 opacity-20",
                            metric.color === 'emerald' ? 'bg-emerald-500' : metric.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
                        )} />

                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx(
                                "p-3 rounded-2xl",
                                metric.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : metric.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            )}>
                                <metric.icon className="h-6 w-6" />
                            </div>
                            {metric.trend && (
                                <div className={clsx(
                                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                                    metric.trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {metric.trendValue}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-slate-900">{metric.value}</h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                            <p className="text-xs text-slate-500 mt-2">{metric.subtext}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-amber-500" />
                        <h2 className="text-xl font-bold text-slate-900">Telecaller Leaderboard</h2>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find telecaller..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Telecaller</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Calls</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Interested</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Conv. Rate</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Streak</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {filteredLeaderboard.map((entry, idx) => (
                                    <motion.tr
                                        key={entry.user_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                idx === 0 ? "bg-amber-100 text-amber-600 shadow-sm" :
                                                    idx === 1 ? "bg-slate-100 text-slate-600" :
                                                        idx === 2 ? "bg-orange-50 text-orange-600" : "text-slate-400"
                                            )}>
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                                    {entry.avatar_url ? (
                                                        <img src={entry.avatar_url} alt={entry.full_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-500">
                                                            {entry.full_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-900 truncate max-w-[150px]">{entry.full_name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{entry.total_calls}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{entry.interested_count}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${entry.conversion_rate}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-900">{entry.conversion_rate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                                                <Flame className={clsx("h-4 w-4", entry.streak > 0 && "fill-current")} />
                                                <span className="text-sm">{entry.streak}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900">
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Grid: Insights & Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Niche Breakdown */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <Building2 className="h-6 w-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-900">Niche Performance</h2>
                    </div>

                    <div className="space-y-6">
                        {[
                            { name: "Dental Clinics", calls: 450, conv: "14.2%", color: "emerald" },
                            { name: "Real Estate", calls: 320, conv: "8.5%", color: "blue" },
                            { name: "Personal Training", calls: 280, conv: "11.1%", color: "amber" },
                            { name: "Law Firms", calls: 150, conv: "5.2%", color: "slate" }
                        ].map((niche) => (
                            <div key={niche.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-700">{niche.name}</span>
                                    <span className="text-slate-500 font-medium">{niche.calls} calls • <span className="text-slate-900 font-bold">{niche.conv} CR</span></span>
                                </div>
                                <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div className={clsx(
                                        "h-full rounded-full transition-all duration-1000",
                                        niche.color === 'emerald' ? 'bg-emerald-500' :
                                            niche.color === 'blue' ? 'bg-blue-500' :
                                                niche.color === 'amber' ? 'bg-amber-500' : 'bg-slate-400'
                                    )} style={{ width: niche.conv }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Productivity */}
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />

                    <div className="flex items-center gap-3 mb-8">
                        <Calendar className="h-6 w-6 text-blue-400" />
                        <h2 className="text-xl font-bold">Team Pace</h2>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-bold">842</span>
                            <span className="text-blue-400 font-bold mb-1">/ 1,000</span>
                        </div>
                        <p className="text-slate-400 font-medium">Monthly "Interested" Goal Progress</p>

                        <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "84.2%" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Peak Time</p>
                                <p className="text-lg font-bold">11:00 AM - 1:00 PM</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Top Region</p>
                                <p className="text-lg font-bold">Hubli-Dharwad</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
