"use client";

import { Phone, ListTodo, Target, FolderKanban, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface RoleScorecardProps {
  role: string;
  title: string;
  profiles: any[];
  data: any;
}

export default function RoleScorecard({ role, title, profiles, data }: RoleScorecardProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-slate-100 text-slate-500">
            {role === 'telecaller' ? <Phone className="h-4 w-4" /> :
             role === 'staff' ? <ListTodo className="h-4 w-4" /> :
             role === 'pm' ? <FolderKanban className="h-4 w-4" /> : <Target className="h-4 w-4" />}
        </div>
        <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
        <div className="ml-4 h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map(profile => {
          const stats = calculateStats(role, profile.id, data);
          return (
            <Card key={profile.id} className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <Avatar name={profile.full_name} src={profile.avatar_url} size="md" />
                <div>
                    <h3 className="font-display font-semibold text-slate-900">{profile.full_name}</h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{profile.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-line bg-slate-50 p-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <StatIcon type={stat.type} />
                            <p className="font-display text-xl font-semibold tabular-nums text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatIcon({ type }: { type: string }) {
    switch (type) {
        case 'positive': return <TrendingUp className="h-3.5 w-3.5 text-brand-deep" />;
        case 'negative': return <AlertCircle className="h-3.5 w-3.5 text-danger" />;
        case 'neutral': return <TrendingUp className="h-3.5 w-3.5 text-slate-400" />;
        case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-brand-deep" />;
        default: return null;
    }
}

function calculateStats(role: string, userId: string, data: any) {
    switch (role) {
        case 'telecaller': {
            const userCalls = data.calls?.filter((c: any) => c.actor_id === userId) || [];
            const interested = userCalls.filter((c: any) =>
              c.outcome === 'INTERESTED_BOOK' || c.outcome === 'INTERESTED_FOLLOW_UP' || c.outcome === 'INTERESTED_SEND_INFO'
            ).length;
            const booked = userCalls.filter((c: any) => c.outcome === 'INTERESTED_BOOK').length;
            const rate = userCalls.length > 0 ? Math.round((interested / userCalls.length) * 100) : 0;

            return [
                { label: 'Calls Made', value: userCalls.length, type: 'neutral' },
                { label: 'Interest Rate', value: `${rate}%`, type: rate > 30 ? 'positive' : 'negative' },
                { label: 'Meetings Booked', value: booked, type: 'success' },
                { label: 'Conversion', value: userCalls.length > 0 ? `${Math.round((booked / userCalls.length) * 100)}%` : '0%', type: 'positive' }
            ];
        }
        case 'staff': {
            const userTasks = data.tasks?.filter((t: any) => t.assigned_to === userId) || [];
            const done = userTasks.filter((t: any) => t.status === 'completed').length;
            const overdue = userTasks.filter((t: any) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length;
            const rate = userTasks.length > 0 ? Math.round((done / userTasks.length) * 100) : 0;

            return [
                { label: 'Completion', value: `${rate}%`, type: rate > 70 ? 'success' : 'neutral' },
                { label: 'Tasks Done', value: done, type: 'neutral' },
                { label: 'Overdue', value: overdue, type: overdue > 0 ? 'negative' : 'success' },
                { label: 'Assigned', value: userTasks.length, type: 'neutral' }
            ];
        }
        case 'pm': {
            const userProjects = data.projects?.filter((p: any) => p.assigned_to === userId) || [];
            const userTasks = data.tasks?.filter((t: any) => t.assigned_to === userId) || [];
            const completedMilestones = userTasks.filter((t: any) => t.status === 'completed' && t.priority === 'high').length;
            const doneTasks = userTasks.filter((t: any) => t.status === 'completed').length;
            const openTasks = userTasks.length - doneTasks;
            const efficiency = userTasks.length > 0 ? Math.round((doneTasks / userTasks.length) * 100) : 0;

            return [
                { label: 'Projects', value: userProjects.length, type: 'neutral' },
                { label: 'Open Tasks', value: openTasks, type: 'neutral' },
                { label: 'Milestones', value: completedMilestones, type: 'success' },
                { label: 'Task Completion', value: `${efficiency}%`, type: 'positive' }
            ];
        }
        case 'strategist': {
            const userProposals = data.deals?.filter((d: any) => d.created_by === userId) || [];
            const confirmed = userProposals.filter((d: any) => d.status === 'confirmed');
            const totalValue = confirmed.reduce((acc: number, d: any) => acc + (Number(d.total_monthly) || 0) + (Number(d.total_setup) || 0), 0);
            const closeRate = userProposals.length > 0 ? Math.round((confirmed.length / userProposals.length) * 100) : 0;

            return [
                { label: 'Proposals Sent', value: userProposals.length, type: 'neutral' },
                { label: 'Deals Closed', value: confirmed.length, type: 'success' },
                { label: 'Close Rate', value: `${closeRate}%`, type: closeRate > 30 ? 'positive' : 'neutral' },
                { label: 'Rev. Closed', value: totalValue > 0 ? `₹${(totalValue / 1000).toFixed(0)}k` : '₹0', type: 'positive' }
            ];
        }
        default: return [];
    }
}
