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
        <div className="min-h-full bg-canvas px-4 py-8 text-slate-900">
            <div className="mx-auto max-w-md space-y-8">
                <header className="text-center">
                    <h1 className="font-display text-2xl font-semibold">Attendance</h1>
                    <p className="text-slate-500">{format(now, "EEEE, MMMM d, yyyy")}</p>
                    <p className="mt-4 text-4xl font-semibold tabular-nums tracking-widest text-brand-deep">
                        {format(now, "HH:mm:ss")}
                    </p>
                </header>

                {/* Main Card */}
                <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-xl border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    {/* Status Ring */}
                    <div className={clsx("relative flex h-40 w-40 items-center justify-center rounded-full border-4",
                        status === 'in' ? "border-brand text-brand-deep" :
                            status === 'break' ? "border-warn text-warn" :
                                "border-slate-300 text-slate-600"
                    )}>
                        <div className="text-center">
                            <div className="mb-1 text-sm font-semibold uppercase tracking-wide">
                                {status === 'in' ? 'Working' : status === 'break' ? 'On Break' : 'Clocked Out'}
                            </div>
                            {status !== 'out' && <div className="text-xl tabular-nums">{getLiveDuration()}</div>}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid w-full grid-cols-2 gap-4">
                        {status === 'out' ? (
                            <button onClick={handleClockIn} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-brand-deep py-4 text-lg font-semibold text-white transition-colors hover:bg-brand-deeper">
                                <Play className="fill-current" /> Clock In
                            </button>
                        ) : (
                            <>
                                {status === 'in' ? (
                                    <button onClick={() => handleBreak('start')} className="flex items-center justify-center gap-2 rounded-lg border border-warn-line bg-warn-soft py-4 font-semibold text-warn transition-colors hover:bg-amber-100">
                                        <Coffee /> Break
                                    </button>
                                ) : (
                                    <button onClick={() => handleBreak('end')} className="flex items-center justify-center gap-2 rounded-lg border border-brand-line bg-brand-soft py-4 font-semibold text-brand-deep transition-colors hover:bg-brand-soft/70">
                                        <Play /> Resume
                                    </button>
                                )}

                                <button onClick={handleClockOut} className="flex items-center justify-center gap-2 rounded-lg border border-danger-line bg-danger-soft py-4 font-semibold text-danger transition-colors hover:bg-red-100">
                                    <Square className="fill-current" /> Clock Out
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-xl border border-line bg-surface p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Gross</div>
                        <div className="text-xl font-semibold tabular-nums text-slate-900">{summary?.gross_minutes || 0}<span className="text-xs font-normal text-slate-500">m</span></div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Break</div>
                        <div className="text-xl font-semibold tabular-nums text-warn">{summary?.break_minutes || 0}<span className="text-xs font-normal text-slate-500">m</span></div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Net</div>
                        <div className="text-xl font-semibold tabular-nums text-brand-deep">{summary?.net_minutes || 0}<span className="text-xs font-normal text-slate-500">m</span></div>
                    </div>
                </div>

                {summary?.flags?.missed_clockout && (
                    <div className="flex items-start gap-3 rounded-xl border border-danger-line bg-danger-soft p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
                        <div className="text-sm text-danger">
                            <strong>Missed Clock Out Detected</strong><br />
                            Your last session was auto-closed. Please contact admin to adjust hours if needed.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
