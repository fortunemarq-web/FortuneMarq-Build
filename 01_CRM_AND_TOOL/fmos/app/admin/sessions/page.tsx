"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');
    const supabase = createClient();

    useEffect(() => {
        fetchSessions();
    }, [filter]);

    const fetchSessions = async () => {
        let query = supabase.from('user_sessions_clamped' as any) // use view
            .select('*')
            .order('last_seen_at', { ascending: false })
            .limit(100);

        if (filter === 'online') {
            const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            query = query.is('logout_at', null).gt('last_seen_at', twoMinsAgo);
        }

        const { data } = await query;
        setSessions(data || []);
    };

    const isOnline = (lastSeen: string, logoutAt: string | null) => {
        if (logoutAt) return false;
        const diff = Date.now() - new Date(lastSeen).getTime();
        return diff < 2 * 60 * 1000; // 2 mins
    };

    const formatDuration = (hours: number) => {
        if (!hours) return "-";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="min-h-full bg-slate-50 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Active Sessions</h1>
                    <div className="flex gap-4 items-center">
                        <button onClick={() => window.open('/api/reports/sessions/export.csv', '_blank')} className="text-sm font-medium text-indigo-400 hover:text-slate-900 transition-colors">Export CSV</button>
                        <div className="flex bg-white rounded-lg p-1 border border-slate-300">
                            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-sm ${filter === 'all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}>All History</button>
                            <button onClick={() => setFilter('online')} className={`px-4 py-1.5 rounded-md text-sm ${filter === 'online' ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}>Online Now</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-500 font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">IP / Device</th>
                                <th className="px-6 py-4">Login Time</th>
                                <th className="px-6 py-4">Last Seen</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sessions.map(s => {
                                const online = isOnline(s.last_seen_at, s.logout_at);
                                return (
                                    <tr key={s.id} className="hover:bg-slate-100">
                                        <td className="px-6 py-4 font-mono text-slate-600">{s.user_id.slice(0, 8)}...</td>
                                        <td className="px-6 py-4 text-xs text-slate-600">
                                            <div className="text-slate-700">{s.ip_address}</div>
                                            <div className="truncate max-w-[200px]">{s.user_agent}</div>
                                        </td>
                                        <td className="px-6 py-4">{new Date(s.login_at).toLocaleString()}</td>
                                        <td className="px-6 py-4">{formatDistanceToNow(new Date(s.last_seen_at))} ago</td>
                                        <td className="px-6 py-4">{formatDuration(s.duration_hours_clamped)}</td>
                                        <td className="px-6 py-4">
                                            {online ? (
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                                                </span>
                                            ) : s.logout_at ? (
                                                <span className="text-slate-500 text-xs">Logged Out ({s.ended_reason})</span>
                                            ) : (
                                                <span className="text-amber-500 text-xs">Inactive</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
