"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";
import { Clock, Coffee, Play, Square, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { promptModal } from "@/components/ui/prompt-modal";
import { toast } from "@/components/ui/toast";

interface AttendanceBreak {
    break_end_at: string | null;
}

interface AttendanceSession {
    clock_in_at: string;
    attendance_breaks: AttendanceBreak[];
}

interface AttendanceSummaryFlags {
    missed_clockout?: boolean;
}

interface AttendanceSummary {
    gross_minutes: number | null;
    break_minutes: number | null;
    net_minutes: number | null;
    flags?: AttendanceSummaryFlags | null;
}

export default function MyAttendancePage() {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"out" | "in" | "break">("out");
    const [session, setSession] = useState<AttendanceSession | null>(null);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);

    // For timer
    const [now, setNow] = useState(new Date());

    const supabase = createClient();

    const fetchState = useCallback(async () => {
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get Open Session
        const { data: sess } = await supabase
            .from("attendance_sessions")
            .select(`*, attendance_breaks(*)`)
            .eq("user_id", user.id)
            .eq("status", "open")
            .single();

        if (sess) {
            setSession(sess as any as AttendanceSession);
            // Check break
            const activeBreak = (sess as any as AttendanceSession).attendance_breaks.find(
                (b: AttendanceBreak) => !b.break_end_at,
            );
            setStatus(activeBreak ? "break" : "in");
        } else {
            setSession(null);
            setStatus("out");
        }

        // 2. Get Today's Summary
        const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
        });
        const { data: sum } = await supabase
            .from("attendance_daily_summary")
            .select("*")
            .eq("user_id", user.id)
            .eq("day", today)
            .single();

        setSummary(sum as AttendanceSummary | null);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchState();
        return () => clearInterval(interval);
    }, [fetchState]);

    const postAttendance = async (url: string, failTitle: string) => {
        try {
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                toast.error(failTitle, body?.error || `Request failed (${res.status})`);
                return false;
            }
            return true;
        } catch {
            toast.error(failTitle, "Network error — please try again.");
            return false;
        } finally {
            fetchState();
        }
    };

    const handleClockIn = async () => {
        await postAttendance('/api/attendance/clock-in', "Could not clock in");
    };

    const handleClockOut = async () => {
        const ok = await promptModal({ title: "Clock out?", description: "Confirm you're ending your work session.", confirmLabel: "Clock Out", type: "select", options: [{ value: "confirm", label: "Yes, clock out now" }] });
        if (!ok) return;
        await postAttendance('/api/attendance/clock-out', "Could not clock out");
    };

    const handleBreak = async (action: 'start' | 'end') => {
        await postAttendance(`/api/attendance/break?action=${action}`, "Could not update break");
    };

    // Calculate current live duration if clocked in
    const getLiveDuration = () => {
        if (!session) return "00:00:00";
        const start = new Date(session.clock_in_at).getTime();
        const diff = now.getTime() - start;
        // Basic format HH:MM:SS
        return new Date(diff).toISOString().slice(11, 19);
    };

    return (
        <div className="min-h-full bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto max-w-md space-y-8">
                <header className="text-center">
                    <h1 className="text-2xl font-bold">Attendance</h1>
                    <p className="text-slate-500">{format(now, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-4xl font-mono mt-4 font-bold tracking-widest text-[#42CA80]">
                        {format(now, "HH:mm:ss")}
                    </p>
                </header>

                {/* Main Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden">
                    {/* Status Ring */}
                    <div className={clsx("w-40 h-40 rounded-full border-4 flex items-center justify-center relative",
                        status === 'in' ? "border-[#42CA80] text-[#42CA80]" :
                            status === 'break' ? "border-amber-500 text-amber-500" :
                                "border-slate-300 text-slate-600"
                    )}>
                        <div className="text-center">
                            <div className="text-sm uppercase font-bold tracking-wider mb-1">
                                {status === 'in' ? 'Working' : status === 'break' ? 'On Break' : 'Clocked Out'}
                            </div>
                            {status !== 'out' && <div className="text-xl font-mono">{getLiveDuration()}</div>}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {status === 'out' ? (
                            <button onClick={handleClockIn} className="col-span-2 bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-transform active:scale-95">
                                <Play className="fill-current" /> Clock In
                            </button>
                        ) : (
                            <>
                                {status === 'in' ? (
                                    <button onClick={() => handleBreak('start')} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                                        <Coffee /> Break
                                    </button>
                                ) : (
                                    <button onClick={() => handleBreak('end')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                                        <Play /> Resume
                                    </button>
                                )}

                                <button onClick={handleClockOut} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                                    <Square className="fill-current" /> Clock Out
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-600 uppercase mb-1">Gross</div>
                        <div className="text-xl font-bold">{summary?.gross_minutes || 0}<span className="text-xs font-normal text-slate-600">m</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-600 uppercase mb-1">Break</div>
                        <div className="text-xl font-bold text-amber-500">{summary?.break_minutes || 0}<span className="text-xs font-normal text-slate-600">m</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-600 uppercase mb-1">Net</div>
                        <div className="text-xl font-bold text-[#42CA80]">{summary?.net_minutes || 0}<span className="text-xs font-normal text-slate-600">m</span></div>
                    </div>
                </div>

                {summary?.flags?.missed_clockout && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <div className="text-sm text-red-200">
                            <strong>Missed Clock Out Detected</strong><br />
                            Your last session was auto-closed. Please contact admin to adjust hours if needed.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
