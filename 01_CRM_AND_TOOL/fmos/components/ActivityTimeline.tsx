"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";
import {
    Activity,
    MessageSquare,
    Phone,
    Calendar,
    CheckCircle2,
    FileText,
    BadgeCheck,
    User,
    Clock,
    ArrowRight,
    Flame,
    Zap,
} from "lucide-react";
import clsx from "clsx";

interface ActivityEvent {
    id: string;
    event_type: string;
    title: string;
    body: string | null;
    metadata: any;
    created_at: string;
    created_by: string; // uuid
    profiles?: { full_name: string; email: string }; // joined
}

interface ActivityTimelineProps {
    entityType: string;
    entityId: string;
    className?: string;
    limit?: number;
    compact?: boolean;
}

const EVENT_ICONS: Record<string, any> = {
    status_changed: Activity,
    lead_qualified: Flame,
    strategy_booked: Calendar,
    note_added: FileText,
    call_logged: Phone,
    followup_set: Clock,
    deal_won: BadgeCheck,
    deal_lost: Activity,
    task_completed: CheckCircle2,
    milestone_approved: BadgeCheck,
    sla_missed: Zap,
    default: MessageSquare,
};

export default function ActivityTimeline({
    entityType,
    entityId,
    className,
    limit = 10,
    compact = false,
}: ActivityTimelineProps) {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = limit;

    useEffect(() => {
        fetchEvents(0, true);
    }, [entityId, entityType]);

    const fetchEvents = async (pageIdx: number, reset = false) => {
        try {
            const supabase = createClient();

            // Two sources: explicit activity_events, plus the DB-trigger
            // audit trail (audit_logs) which captures every mutation.
            const [activityRes, auditRes] = await Promise.all([
                supabase
                    .from("activity_events")
                    .select(`*, profiles:created_by (full_name, email)`)
                    .eq("entity_type", entityType)
                    .eq("entity_id", entityId)
                    .order("created_at", { ascending: false })
                    .range(pageIdx * pageSize, (pageIdx + 1) * pageSize - 1),
                supabase
                    .from("audit_logs" as any)
                    .select("id, action, summary, old_value, new_value, created_at, user_name")
                    .eq("resource_type", entityType)
                    .eq("resource_id", entityId)
                    .order("created_at", { ascending: false })
                    .range(pageIdx * pageSize, (pageIdx + 1) * pageSize - 1),
            ]);

            if (activityRes.error) throw activityRes.error;
            // audit_logs is admin-readable only — non-admins just get the
            // activity_events half, which is fine.
            const auditRows = auditRes.error ? [] : (auditRes.data || []);

            const auditEvents: ActivityEvent[] = (auditRows as any[]).map((r) => ({
                id: `audit-${r.id}`,
                event_type: r.action === "stage_change" ? "status_changed" : r.action,
                title: r.summary || `${r.action} ${entityType}`,
                body: null,
                metadata:
                    r.old_value?.outreach_stage || r.new_value?.outreach_stage
                        ? { from_status: r.old_value?.outreach_stage, to_status: r.new_value?.outreach_stage }
                        : {},
                created_at: r.created_at,
                created_by: "",
                profiles: r.user_name ? ({ full_name: r.user_name, email: "" } as any) : undefined,
            }));

            const merged = [...((activityRes.data || []) as ActivityEvent[]), ...auditEvents].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            if (reset) {
                setEvents(merged);
            } else {
                setEvents((prev) => [...prev, ...merged]);
            }

            const fullPage =
                (activityRes.data || []).length >= pageSize || auditRows.length >= pageSize;
            setHasMore(fullPage);
        } catch (err) {
            console.error("Error fetching activity:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchEvents(nextPage);
    };

    if (loading && events.length === 0) {
        return <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>;
    }

    if (events.length === 0) {
        return (
            <div className={clsx("flex flex-col items-center justify-center text-slate-500 border rounded-xl border-dashed border-slate-200 bg-slate-200/30", compact ? "py-4" : "py-8")}>
                <Activity className="mb-2 h-6 w-6 opacity-20" />
                <p className="text-sm">No activity yet</p>
            </div>
        );
    }

    return (
        <div className={clsx("space-y-6", className)}>
            <div className={clsx("relative border-l border-slate-200 ml-3", compact ? "space-y-4 pb-2" : "space-y-8 pb-4")}>
                {events.map((event) => {
                    const Icon = EVENT_ICONS[event.event_type] || EVENT_ICONS.default;

                    return (
                        <div key={event.id} className="relative pl-6">
                            {/* Timeline Dot */}
                            <div className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 border border-slate-300 shadow-sm z-10">
                                <Icon className="h-3 w-3 text-slate-600" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-1 -mt-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={clsx("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>
                                        {event.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                                        {format(new Date(event.created_at), compact ? "MMM d" : "MMM d, h:mm a")}
                                    </span>
                                </div>

                                {event.body && (
                                    <p className={clsx("text-slate-600 leading-relaxed", compact ? "text-xs" : "text-sm bg-slate-200/50 p-2.5 rounded-lg border border-slate-200/50")}>
                                        {event.body}
                                    </p>
                                )}

                                {/* Metadata Viewer (Compact) */}
                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                    <div className="mt-0.5">
                                        {/* Simplified metadata view - e.g. status changes */}
                                        {event.metadata.from_status && event.metadata.to_status && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {event.metadata.from_status}
                                                </span>
                                                <ArrowRight className="h-3 w-3" />
                                                <span className="px-1.5 py-0.5 rounded bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 /10 text-[#42CA80]">
                                                    {event.metadata.to_status}
                                                </span>
                                            </div>
                                        )}
                                        {/* SLA Missed metadata */}
                                        {event.event_type === 'sla_missed' && event.metadata.minutes_overdue && (
                                            <div className="text-[10px] text-red-500">
                                                Overdue by {event.metadata.minutes_overdue}m
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                                        {event.profiles?.full_name || "Unknown"} as {event.event_type === 'sla_missed' ? 'System' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasMore && (
                <button
                    onClick={loadMore}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 transition-colors border-t border-slate-200"
                >
                    Load older...
                </button>
            )}
        </div>
    );
}
