import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { AlertTriangle, CheckSquare, Phone, Flag, Activity, ArrowRight, Flame } from "lucide-react";
import clsx from "clsx";

export default async function AdminBriefingPage() {
    const supabase = await createServerClientWithCookies();
    const today = new Date().toISOString().split('T')[0];

    // 1. Top 5 Fires (High Alerts)
    const { data: fires } = await supabase
        .from('alerts')
        .select('*')
        .eq('severity', 'high')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

    // 2. Today's Focus
    // Sales: Followups
    const { data: followups } = await supabase
        .from('leads')
        .select('id, company_name, contact_person, city, industry, phone, outreach_stage, follow_up_date')
        .gte('follow_up_date', today)
        .lt('follow_up_date', new Date(Date.now() + 86400000).toISOString())
        .limit(5);

    // Delivery: Tasks Due
    const { data: tasksDue } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .gte('due_date', today)
        .lt('due_date', new Date(Date.now() + 86400000).toISOString())
        .neq('status', 'completed')
        .limit(5);

    // Strategy: Pending Approvals
    const { data: approvals } = await supabase
        .from('milestone_approvals' as any)
        .select('id, status, milestone_id') // Join milestone title if possible
        .eq('status', 'pending')
        .limit(5);

    // 3. New Activity
    const { data: activity } = await supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    return (
        <div className="min-h-full bg-slate-50 p-6 text-slate-900">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            Good Morning, Admin
                        </h1>
                        <p className="text-slate-600 mt-1">Here is your daily briefing for {new Date().toLocaleDateString()}.</p>
                    </div>
                    <Link href="/admin" className="text-indigo-400 text-sm hover:underline flex items-center gap-1">
                        Go to Command Hub <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Section 1: Top Fires */}
                {fires && fires.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                            <Flame className="h-5 w-5" /> Top Fires (Action Required)
                        </h2>
                        <div className="grid gap-3">
                            {fires.map((alert: any) => (
                                <div key={alert.id} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-red-200">{alert.title}</h3>
                                        <p className="text-sm text-red-300/70">{alert.body}</p>
                                    </div>
                                    <Link href="/admin/alerts" className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg transition-colors">
                                        Resolve
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 2: Today's Focus Grid */}
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-indigo-400" /> Today's Focus
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Sales Focus */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-blue-400" /> Sales Calls
                                </h3>
                                <span className="bg-slate-100 text-xs px-2 py-0.5 rounded text-slate-500">{followups?.length} Due</span>
                            </div>
                            <div className="space-y-3">
                                {followups?.map((lead: any) => (
                                    <div key={lead.id} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                        <span className="truncate max-w-[120px] text-slate-600">{lead.contact_person} — {lead.company_name}</span>
                                        <Link href={`/admin/leads/${lead.id}`} className="text-blue-400 hover:text-blue-300 text-xs text-right">View</Link>
                                    </div>
                                ))}
                                {followups?.length === 0 && <p className="text-xs text-slate-600 italic">No urgent follow-ups.</p>}
                            </div>
                        </div>

                        {/* Delivery Focus */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <CheckSquare className="h-4 w-4 text-green-400" /> Tasks Due
                                </h3>
                                <span className="bg-slate-100 text-xs px-2 py-0.5 rounded text-slate-500">{tasksDue?.length} Due</span>
                            </div>
                            <div className="space-y-3">
                                {tasksDue?.map((task: any) => (
                                    <div key={task.id} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                        <span className="truncate max-w-[150px] text-slate-600">{task.title}</span>
                                        <Link href={`/projects/${task.project_id}`} className="text-green-400 hover:text-green-300 text-xs">View</Link>
                                    </div>
                                ))}
                                {tasksDue?.length === 0 && <p className="text-xs text-slate-600 italic">No tasks due today.</p>}
                            </div>
                        </div>

                        {/* Approvals Focus */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-amber-400" /> Approvals
                                </h3>
                                <span className="bg-slate-100 text-xs px-2 py-0.5 rounded text-slate-500">{approvals?.length} Pending</span>
                            </div>
                            <div className="space-y-3">
                                {approvals?.map((app: any) => (
                                    <div key={app.id} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                        <span className="text-slate-600">Milestone Decision</span>
                                        <span className="text-amber-500 text-xs font-medium">Pending</span>
                                    </div>
                                ))}
                                {approvals?.length === 0 && <p className="text-xs text-slate-600 italic">All caught up.</p>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Live Activity Feed */}
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-400" /> Live Activity
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
                        {activity?.map((event: any, i: number) => (
                            <div key={event.id} className={clsx("p-3 flex gap-3 items-start border-b border-slate-200", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                                <div>
                                    <p className="text-slate-700">
                                        <span className="font-bold text-slate-800">{event.title}</span>
                                        <span className="text-slate-600"> - {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        User: {event.actor_id ? "System/User" : "System"} • Entity: {event.entity_type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
