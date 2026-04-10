"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import {
    Bell,
    Check,
    Circle,
    Clock,
    ExternalLink,
    ListTodo,
    Target,
    Award,
    AlertCircle,
    Package,
    Settings,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);
                    // Optional: Native notification or toast
                }
            )
            .subscribe();

        // Handle click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    async function fetchNotifications() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from("notifications" as any)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) console.error(error);
        else {
            const typedData = (data as any) as Notification[];
            setNotifications(typedData || []);
            setUnreadCount(typedData?.filter(n => !n.is_read).length || 0);
        }
    }

    async function markAsRead(id: string) {
        const { error } = await supabase.from("notifications" as any)
            .update({ is_read: true })
            .eq("id", id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    }

    async function markAllAsRead() {
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
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'task_assigned': return <ListTodo className="h-4 w-4 text-blue-500" />;
            case 'follow_up_due': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'follow_up_overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'lead_status_changed': return <Target className="h-4 w-4 text-emerald-500" />;
            case 'deal_closed': return <Award className="h-4 w-4 text-yellow-500" />;
            case 'deliverable_approval_requested': return <Package className="h-4 w-4 text-purple-500" />;
            case 'report_published': return <Check className="h-4 w-4 text-emerald-500" />;
            default: return <Bell className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="View notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-black uppercase tracking-widest text-[#42CA80] hover:text-emerald-600 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[70vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={clsx(
                                            "p-4 transition-colors group relative",
                                            !notif.is_read ? "bg-emerald-50/30" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className={clsx(
                                                        "text-sm font-bold text-slate-900 line-clamp-1 truncate",
                                                        !notif.is_read && "pr-4"
                                                    )}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                    {notif.body}
                                                </p>
                                                {notif.link && (
                                                    <Link
                                                        href={notif.link}
                                                        onClick={() => {
                                                            markAsRead(notif.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#42CA80] hover:underline"
                                                    >
                                                        Review <ExternalLink className="h-2.5 w-2.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500"
                                                title="Mark as read"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Link
                            href="/notifications"
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
