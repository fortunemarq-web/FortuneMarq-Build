import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { CheckSquare, Phone, Flag, Activity, ArrowRight, Flame } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

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
        <div className="min-h-full bg-canvas p-6 text-slate-900">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <PageHeader
                    title="Good Morning, Admin"
                    subtitle={`Here is your daily briefing for ${new Date().toLocaleDateString()}.`}
                    actions={
                        <Link href="/admin" className="flex items-center gap-1 text-sm font-semibold text-brand-deep hover:underline">
                            Go to Command Hub <ArrowRight className="h-4 w-4" />
                        </Link>
                    }
                />

                {/* Section 1: Top Fires */}
                {fires && fires.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-danger">
                            <Flame className="h-5 w-5" /> Top Fires (Action Required)
                        </h2>
                        <div className="grid gap-3">
                            {fires.map((alert: any) => (
                                <div key={alert.id} className="flex items-center justify-between rounded-xl border border-danger-line bg-danger-soft p-4">
                                    <div>
                                        <h3 className="font-semibold text-danger">{alert.title}</h3>
                                        <p className="text-sm text-slate-600">{alert.body}</p>
                                    </div>
                                    <Link href="/admin/alerts" className={buttonVariants({ variant: "danger-soft", size: "sm" })}>
                                        Resolve
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 2: Today's Focus Grid */}
                <section>
                    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                        <CheckSquare className="h-5 w-5 text-slate-400" /> Today's Focus
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Sales Focus */}
                        <Card className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                    <Phone className="h-4 w-4 text-slate-400" /> Sales Calls
                                </h3>
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{followups?.length} Due</span>
                            </div>
                            <div className="space-y-3">
                                {followups?.map((lead: any) => (
                                    <div key={lead.id} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0 last:pb-0">
                                        <span className="max-w-[120px] truncate text-slate-600">{lead.contact_person} — {lead.company_name}</span>
                                        <Link href={`/admin/leads/${lead.id}`} className="text-right text-xs font-semibold text-brand-deep hover:underline">View</Link>
                                    </div>
                                ))}
                                {followups?.length === 0 && <p className="text-xs italic text-slate-500">No urgent follow-ups.</p>}
                            </div>
                        </Card>

                        {/* Delivery Focus */}
                        <Card className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                    <CheckSquare className="h-4 w-4 text-slate-400" /> Tasks Due
                                </h3>
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{tasksDue?.length} Due</span>
                            </div>
                            <div className="space-y-3">
                                {tasksDue?.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0 last:pb-0">
                                        <span className="max-w-[150px] truncate text-slate-600">{task.title}</span>
                                        <Link href={`/projects/${task.project_id}`} className="text-xs font-semibold text-brand-deep hover:underline">View</Link>
                                    </div>
                                ))}
                                {tasksDue?.length === 0 && <p className="text-xs italic text-slate-500">No tasks due today.</p>}
                            </div>
                        </Card>

                        {/* Approvals Focus */}
                        <Card className="p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                    <Flag className="h-4 w-4 text-slate-400" /> Approvals
                                </h3>
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{approvals?.length} Pending</span>
                            </div>
                            <div className="space-y-3">
                                {approvals?.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0 last:pb-0">
                                        <span className="text-slate-600">Milestone Decision</span>
                                        <span className="text-xs font-medium text-warn">Pending</span>
                                    </div>
                                ))}
                                {approvals?.length === 0 && <p className="text-xs italic text-slate-500">All caught up.</p>}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Section 4: Live Activity Feed */}
                <section>
                    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                        <Activity className="h-5 w-5 text-slate-400" /> Live Activity
                    </h2>
                    <Card className="overflow-hidden text-sm">
                        {activity?.map((event: any, i: number) => (
                            <div key={event.id} className={clsx("flex items-start gap-3 border-b border-line p-3 last:border-0", i % 2 === 0 ? "bg-surface" : "bg-slate-50")}>
                                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand"></div>
                                <div>
                                    <p className="text-slate-700">
                                        <span className="font-semibold text-slate-800">{event.title}</span>
                                        <span className="text-slate-600"> - {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        User: {event.actor_id ? "System/User" : "System"} • Entity: {event.entity_type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </Card>
                </section>
            </div>
        </div>
    );
}
