"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import {
    Bell,
    Check,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ClipboardList,
    UserPlus,
    FileCheck,
    MessageCircle,
    Trophy,
    BarChart,
    Sparkles,
    Info,
    ExternalLink,
    Loader2
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Tone } from "@/components/ui/badge";

const ICONS: Record<string, any> = {
    task_assigned: ClipboardList,
    follow_up_due: Clock,
    follow_up_overdue: AlertTriangle,
    lead_status_changed: UserPlus,
    deliverable_approval_requested: FileCheck,
    deliverable_approved: CheckCircle2,
    deliverable_revision: MessageCircle,
    deal_closed: Trophy,
    report_published: BarChart,
    ai_insight: Sparkles,
    system: Info
};

// Every notification type maps to one of the five tones — no per-type rainbow.
const TONES: Record<string, Tone> = {
    task_assigned: "info",
    follow_up_due: "warning",
    follow_up_overdue: "danger",
    lead_status_changed: "info",
    deliverable_approval_requested: "warning",
    deliverable_approved: "brand",
    deliverable_revision: "warning",
    deal_closed: "brand",
    report_published: "info",
    ai_insight: "info",
    system: "neutral"
};

const TONE_CLASS: Record<Tone, string> = {
    neutral: "text-slate-500 bg-slate-100",
    brand: "text-brand-deep bg-brand-soft",
    info: "text-info bg-info-soft",
    warning: "text-warn bg-warn-soft",
    danger: "text-danger bg-danger-soft"
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const supabase = createClient();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let cancelled = false;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            // Role — the "View all activity" link targets admin-only audit-log.
            const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
            if (!cancelled) setRole((prof as any)?.role ?? null);

            channel = supabase
                .channel(`notifications:${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications' as any, filter: `user_id=eq.${user.id}` },
                    (payload) => {
                        setNotifications(prev => [payload.new, ...prev].slice(0, 20));
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();
        })();

        fetchNotifications();
        // Trigger background verification of follow-ups
        fetch("/api/notifications/verify", { method: "POST" }).catch(console.error);

        // Close on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            cancelled = true;
            document.removeEventListener("mousedown", handleClickOutside);
            if (channel) supabase.removeChannel(channel); // previously leaked — cleanup was discarded
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
        setLoading(false);
    };

    const markRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const { error } = await supabase.from("notifications")
            .update({ is_read: true })
            .eq("id", id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                    <div className="flex items-center justify-between border-b border-line bg-slate-50/60 px-5 py-3.5">
                        <div>
                            <h3 className="font-display text-[15px] font-semibold text-slate-900">Notifications</h3>
                            <p className="text-xs text-slate-500">{unreadCount} unread</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-semibold text-brand-deep transition-colors hover:text-brand-deeper"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="custom-scrollbar max-h-[450px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-slate-50">
                                    <Bell className="h-5 w-5 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">You're all caught up</p>
                                <p className="mt-1 text-xs text-slate-400">New alerts will show up here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(n => {
                                    const Icon = ICONS[n.type] || Info;
                                    const colorClass = TONE_CLASS[TONES[n.type] || "neutral"];
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markRead(n.id);
                                                if (n.link) setIsOpen(false);
                                            }}
                                            className={clsx(
                                                "group relative cursor-pointer p-4 transition-colors hover:bg-slate-50",
                                                !n.is_read ? "bg-brand-soft/40" : ""
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colorClass)}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-0.5 flex items-start justify-between gap-3">
                                                        <h4 className={clsx(
                                                            "truncate pr-2 text-sm font-semibold",
                                                            !n.is_read ? "text-slate-900" : "text-slate-600"
                                                        )}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="whitespace-nowrap text-[11px] text-slate-400">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{n.body}</p>

                                                    {n.link && (
                                                        <Link
                                                            href={n.link}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline"
                                                        >
                                                            View details
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {!n.is_read && (
                                                <div className="absolute right-4 top-5 h-2 w-2 rounded-full bg-brand group-hover:hidden" />
                                            )}

                                            <button
                                                onClick={(e) => markRead(n.id, e)}
                                                className="absolute right-3 top-3 rounded-lg border border-line bg-surface p-1.5 text-slate-400 opacity-0 shadow-sm transition-all hover:text-brand-deep group-hover:opacity-100"
                                                title="Mark read"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {role === "admin" && (
                        <Link
                            href="/admin/audit-log"
                            className="block border-t border-line bg-slate-50/60 py-3 text-center text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            View all activity
                        </Link>
                    )}
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
