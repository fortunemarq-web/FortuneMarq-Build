"use client";

import { useState, useEffect } from "react";
import {
    Phone,
    Target,
    TrendingUp,
    Flame,
    Calendar,
    Clock,
    CheckCircle2,
    Award,
    History,
    ChevronRight,
    Zap,
    Trophy,
    ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import { motion } from "framer-motion";

interface MyStats {
    callsToday: number;
    interestedToday: number;
    currentStreak: number;
    highestStreak: number;
    totalCalls: number;
    totalInterested: number;
}

interface CallLog {
    id: string;
    lead_name: string;
    outcome: string;
    duration_seconds: number;
    created_at: string;
}

export default function MyStatsPage() {
    const [stats, setStats] = useState<MyStats | null>(null);
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logLimit, setLogLimit] = useState(10);
    const [dailyCallGoal, setDailyCallGoal] = useState(100);
    const supabase = createClient();

    useEffect(() => {
        fetchMyStats();
    }, [logLimit]);

    const fetchMyStats = async () => {
        setIsLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const today = new Date().toISOString().split('T')[0];

            const interestedOutcomes = ["INTERESTED_BOOK", "INTERESTED_FOLLOW_UP", "INTERESTED_SEND_INFO"];

            // Fetch today's calls + all-time logs + last 90 days for streak in one parallel batch
            const [{ data: todayLogs }, { data: allTimeLogs }, { data: recentLogs }, { data: targetRow }] = await Promise.all([
                supabase.from("outreach_logs").select("id, outcome").eq("actor_id", userData.user.id).eq("touch_type", "call").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`),
                supabase.from("outreach_logs").select("id, outcome").eq("actor_id", userData.user.id).eq("touch_type", "call"),
                supabase.from("outreach_logs").select("id, outcome, created_at, touch_type, lead_id, leads(company_name)").eq("actor_id", userData.user.id).order("created_at", { ascending: false }).limit(logLimit),
                supabase.from("team_targets").select("target_value, daily_target").eq("user_id", userData.user.id).eq("metric", "daily_calls").maybeSingle(),
            ]);

            // Streak: fetch last 90 days of call activity
            const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const { data: streakLogs } = await supabase.from("outreach_logs").select("created_at").eq("actor_id", userData.user.id).eq("touch_type", "call").gte("created_at", ninetyDaysAgo.toISOString());
            const activeDays = new Set((streakLogs || []).map((l: any) => l.created_at.slice(0, 10)));
            let currentStreak = 0; let highestStreak = 0; let run = 0;
            for (let i = 0; i < 90; i++) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                if (activeDays.has(key)) { run++; if (i === 0 || currentStreak > 0) currentStreak = run; }
                else { if (i === 0) currentStreak = 0; else if (currentStreak > 0 && run > 0) { highestStreak = Math.max(highestStreak, run); currentStreak = 0; } run = 0; }
                highestStreak = Math.max(highestStreak, run);
            }

            const totalInterested = allTimeLogs?.filter((l) => interestedOutcomes.includes(l.outcome ?? "")).length || 0;
            // FIXME: team_targets has neither daily_target nor target_value columns,
            // so this select errors and the goal always falls back to 100. Verify the
            // intended column/table for the telecaller's daily call goal.
            const dailyGoal = (targetRow as any)?.daily_target ?? (targetRow as any)?.target_value ?? 100;
            setDailyCallGoal(dailyGoal);

            setStats({
                callsToday: todayLogs?.length || 0,
                interestedToday: todayLogs?.filter((l) => interestedOutcomes.includes(l.outcome ?? "")).length || 0,
                currentStreak,
                highestStreak,
                totalCalls: allTimeLogs?.length || 0,
                totalInterested,
            });

            setLogs((recentLogs || []).map((l: any) => ({
                id: l.id,
                lead_name: l.leads?.company_name || l.lead_id?.slice(0, 8) || "Lead",
                outcome: l.outcome || l.touch_type || "call",
                duration_seconds: 0,
                created_at: l.created_at
            })));

        } catch (error) {
            console.error("Error fetching my stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    if (isLoading || !stats) {
        return <div className="p-8">Loading your stats...</div>;
    }

    const progressPercent = Math.min((stats.callsToday / dailyCallGoal) * 100, 100);

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header / Hero */}
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                                <Zap className="h-5 w-5 text-emerald-400" />
                            </div>
                            <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Performance Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your Daily Pace</h1>
                        <p className="text-slate-400 max-w-md font-medium">You're on a <span className="text-orange-400 font-bold">{stats.currentStreak} day streak!</span> Keep the momentum going to hit your weekly targets.</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-4xl md:text-6xl font-black text-white">{stats.callsToday}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Calls Today</p>
                        </div>
                        <div className="h-16 w-px bg-white/10" />
                        <div className="text-center text-emerald-400">
                            <p className="text-4xl md:text-6xl font-black">{stats.interestedToday}</p>
                            <p className="text-xs font-bold text-emerald-500/50 uppercase tracking-widest mt-2">Interested</p>
                        </div>
                    </div>
                </div>

                {/* Goal Progress Bar */}
                <div className="mt-12 space-y-4 relative z-10">
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-400">DAILY PROGRESS</span>
                        <span>{stats.callsToday} / {dailyCallGoal} <span className="text-slate-500 ml-1">({Math.round(progressPercent)}%)</span></span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Current Streak", value: stats.currentStreak, sub: "Consecutive Days", icon: Flame, color: "orange" },
                    { label: "Personal Best", value: stats.highestStreak, sub: "Record Streak", icon: Trophy, color: "amber" },
                    { label: "Total Volume", value: stats.totalCalls, sub: "Lifetime Calls", icon: Phone, color: "blue" },
                    { label: "Lifetime Wins", value: stats.totalInterested, sub: "Highly Qualified", icon: Award, color: "emerald" }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
                            s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    s.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-orange-50 text-orange-600'
                        )}>
                            <s.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">{s.value}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                        <p className="text-xs text-slate-500 mt-2">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Activity & Recognition */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-slate-400" />
                            <h2 className="font-bold text-slate-900">Recent Call Logs</h2>
                        </div>
                        <button
                            onClick={() => setLogLimit(logLimit === 10 ? 100 : 10)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            {logLimit === 10 ? "View All" : "Show Less"}
                        </button>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase",
                                        ['INTERESTED_BOOK', 'INTERESTED_FOLLOW_UP', 'INTERESTED_SEND_INFO'].includes(log.outcome) ? "bg-emerald-100 text-emerald-600" :
                                            ['NO_ANSWER', 'FOLLOW_BACK'].includes(log.outcome) ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-600"
                                    )}>
                                        {log.outcome.slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{log.lead_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                            {log.outcome.replace('_', ' ')} • {formatDuration(log.duration_seconds)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-500">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <ArrowRight className="h-4 w-4 text-slate-300 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Incentives / Next Rank */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Award className="h-6 w-6 text-blue-300" />
                            <h2 className="text-xl font-bold">Next Milestone</h2>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-blue-200">
                                <span>SILVER CALLER</span>
                                <span>75% DONE</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full w-[75%]" />
                            </div>
                        </div>

                        <p className="text-blue-100 text-sm leading-relaxed">
                            Complete <span className="font-bold text-white">58 more interested calls</span> to unlock the "Silver Elite" badge and earn a bonus multiplier.
                        </p>

                        <button className="w-full bg-white text-blue-600 py-3 rounded-2xl font-black text-sm hover:bg-blue-50 transition-colors shadow-lg shadow-black/20">
                            VIEW INCENTIVES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
