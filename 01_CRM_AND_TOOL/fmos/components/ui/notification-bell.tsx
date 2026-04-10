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

const COLORS: Record<string, string> = {
    task_assigned: "text-blue-500 bg-blue-50",
    follow_up_due: "text-amber-500 bg-amber-50",
    follow_up_overdue: "text-rose-500 bg-rose-50",
    lead_status_changed: "text-indigo-500 bg-indigo-50",
    deliverable_approval_requested: "text-purple-500 bg-purple-50",
    deliverable_approved: "text-emerald-500 bg-emerald-50",
    deliverable_revision: "text-orange-500 bg-orange-50",
    deal_closed: "text-yellow-500 bg-yellow-50",
    report_published: "text-cyan-500 bg-cyan-50",
    ai_insight: "text-fuchsia-500 bg-fuchsia-50",
    system: "text-slate-500 bg-slate-50"
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setupSubscription();
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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const setupSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications' as any,
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);
                    // Play a subtle sound or show a toast?
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("notifications" as any)
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

        const { error } = await supabase.from("notifications" as any)
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

        const { error } = await supabase.from("notifications" as any)
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
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
            >
                <Bell className={clsx("h-5 w-5", unreadCount > 0 && "animate-swing origin-top")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[400px] bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden ring-1 ring-slate-900/5 transition-all animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inbox</h3>
                            <p className="text-[10px] font-bold text-slate-400">{unreadCount} unread alerts</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] font-black uppercase tracking-tighter text-[#42CA80] hover:text-emerald-600 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Bell className="h-6 w-6 text-slate-200" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map(n => {
                                    const Icon = ICONS[n.type] || Info;
                                    const colorClass = COLORS[n.type] || "text-slate-500 bg-slate-50";
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markRead(n.id);
                                                if (n.link) setIsOpen(false);
                                            }}
                                            className={clsx(
                                                "p-5 hover:bg-slate-50/80 transition-all relative group cursor-pointer",
                                                !n.is_read ? "bg-[#42CA80]/5" : ""
                                            )}
                                        >
                                            <div className="flex gap-4">
                                                <div className={clsx("h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center", colorClass)}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={clsx(
                                                            "text-sm font-bold truncate pr-4",
                                                            !n.is_read ? "text-slate-900" : "text-slate-600"
                                                        )}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{n.body}</p>

                                                    {n.link && (
                                                        <Link
                                                            href={n.link}
                                                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#42CA80] hover:underline"
                                                        >
                                                            View Details
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {!n.is_read && (
                                                <div className="absolute top-5 right-5 h-2 w-2 bg-[#42CA80] rounded-full group-hover:hidden" />
                                            )}

                                            <button
                                                onClick={(e) => markRead(n.id, e)}
                                                className="absolute top-4 right-4 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#42CA80] opacity-0 group-hover:opacity-100 transition-all shadow-sm"
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

                    <Link
                        href="/notifications"
                        className="block py-4 bg-slate-50 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border-t border-slate-100"
                    >
                        View all activity
                    </Link>
                </div>
            )}

            {isOpen && <div className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]" onClick={() => setIsOpen(false)}></div>}

            <style jsx global>{`
                @keyframes swing {
                    0% { transform: rotate(0deg); }
                    20% { transform: rotate(15deg); }
                    40% { transform: rotate(-10deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-5deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-swing {
                    animation: swing 2s ease infinite;
                }
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
