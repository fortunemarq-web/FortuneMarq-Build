"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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

        const { data, error } = await query;
        if (error) {
            toast.error("Could not load sessions", error.message);
            return;
        }
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
        <div className="min-h-full bg-canvas px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    title="Active Sessions"
                    actions={
                        <>
                            <Button onClick={() => window.open('/api/reports/sessions/export.csv', '_blank')} variant="ghost" size="sm">Export CSV</Button>
                            <div className="flex rounded-lg border border-line bg-surface p-1">
                                <button onClick={() => setFilter('all')} className={`rounded-md px-4 py-1.5 text-sm transition-colors ${filter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>All History</button>
                                <button onClick={() => setFilter('online')} className={`rounded-md px-4 py-1.5 text-sm transition-colors ${filter === 'online' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Online Now</button>
                            </div>
                        </>
                    }
                />

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <TR className="hover:bg-transparent">
                                    <TH>User</TH>
                                    <TH>IP / Device</TH>
                                    <TH>Login Time</TH>
                                    <TH>Last Seen</TH>
                                    <TH>Duration</TH>
                                    <TH>Status</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {sessions.map(s => {
                                    const online = isOnline(s.last_seen_at, s.logout_at);
                                    return (
                                        <TR key={s.id}>
                                            <TD className="tabular-nums text-slate-600">{s.user_id ? `${s.user_id.slice(0, 8)}...` : "—"}</TD>
                                            <TD className="text-xs text-slate-600">
                                                <div className="text-slate-700">{s.ip_address}</div>
                                                <div className="max-w-[200px] truncate">{s.user_agent}</div>
                                            </TD>
                                            <TD>{new Date(s.login_at).toLocaleString()}</TD>
                                            <TD>{formatDistanceToNow(new Date(s.last_seen_at))} ago</TD>
                                            <TD className="tabular-nums">{formatDuration(s.duration_hours_clamped)}</TD>
                                            <TD>
                                                {online ? (
                                                    <Badge tone="brand" size="sm" dot>Online</Badge>
                                                ) : s.logout_at ? (
                                                    <span className="text-xs text-slate-500">Logged Out ({s.ended_reason})</span>
                                                ) : (
                                                    <span className="text-xs text-warn">Inactive</span>
                                                )}
                                            </TD>
                                        </TR>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
