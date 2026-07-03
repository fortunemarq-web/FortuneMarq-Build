"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { CheckCircle2, AlertTriangle, Eye, XCircle, Search, Filter, Inbox } from "lucide-react";
import clsx from "clsx";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";

interface Alert {
    id: string;
    severity: string;
    title: string;
    body: string | null;
    status: string;
    created_at: string;
    rule_id?: string;
}

export default function AlertsManager({ initialAlerts }: { initialAlerts: Alert[] }) {
    const [alerts, setAlerts] = useState(initialAlerts);
    const [filter, setFilter] = useState('open'); // open | resolved | all
    const supabase = createClient();

    const handleAction = async (id: string, action: 'resolve' | 'acknowledge') => {
        // Optimistic update
        const newStatus = action === 'resolve' ? 'resolved' : 'acknowledged';
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

        try {
            const updates: any = {
                status: newStatus,
                [action === 'resolve' ? 'resolved_at' : 'acknowledged_at']: new Date().toISOString()
            };

            const { error } = await (supabase.from('alerts') as any)
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error(e);
            toast.error("Failed to update alert");
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return a.status === 'resolved';
        return a.status !== 'resolved'; // open or acknowledged
    });

    return (
        <div className="bg-slate-100/60 p-4 border border-slate-200 rounded-xl">
            <div className="bg-surface border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="flex bg-slate-100/50 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setFilter('open')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filter === 'open' ? "bg-white/[0.06] text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900")}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('resolved')}
                            className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filter === 'resolved' ? "bg-white/[0.06] text-slate-900 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900")}
                        >
                            Resolved
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {filteredAlerts.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={Inbox}
                                title="No alerts found"
                                description={filter === 'resolved' ? "No resolved alerts in history." : "All systems normal! No active alerts."}
                            />
                        </div>
                    ) : (
                        filteredAlerts.map(alert => (
                            <div key={alert.id} className={clsx(
                                "group p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors duration-150",
                                alert.status === 'resolved' ? "opacity-60" : ""
                            )}>
                                <div className={clsx("mt-1 p-2 rounded-xl flex-shrink-0 shadow-sm border",
                                    alert.severity === 'high' ? "bg-red-50 text-red-600 border-red-100" :
                                        alert.severity === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                    <AlertTriangle className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-slate-900 font-semibold text-sm">{alert.title}</h3>
                                        <span className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                                            {new Date(alert.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{alert.body}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shadow-sm",
                                            alert.severity === 'high' ? "bg-red-50 text-red-700 border-red-100" :
                                                alert.severity === 'medium' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                    "bg-blue-50 text-blue-700 border-blue-100"
                                        )}>
                                            {alert.severity}
                                        </span>
                                        <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">ID: {alert.id.slice(0, 8)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {alert.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleAction(alert.id, 'resolve')}
                                            className="bg-surface hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                            title="Resolve Alert"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Resolve
                                        </button>
                                    )}
                                    {alert.status === 'open' && (
                                        <button
                                            onClick={() => handleAction(alert.id, 'acknowledge')}
                                            className="text-slate-500 hover:text-slate-700 text-xs font-medium px-2 py-1 transition-colors"
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                        ))}
                </div>
            </div>
        </div>
    );
}
