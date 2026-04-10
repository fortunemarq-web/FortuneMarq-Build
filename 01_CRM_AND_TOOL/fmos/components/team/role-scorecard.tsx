"use client";

import { User, Phone, ListTodo, Target, FolderKanban, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

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
      <div className="flex items-center gap-3 px-4">
        <div className={clsx(
            "h-8 w-8 rounded-lg flex items-center justify-center text-white",
            role === 'telecaller' ? 'bg-emerald-500' : 
            role === 'staff' ? 'bg-slate-900' : 
            role === 'pm' ? 'bg-purple-500' : 'bg-blue-500'
        )}>
            {role === 'telecaller' ? <Phone className="h-4 w-4" /> : 
             role === 'staff' ? <ListTodo className="h-4 w-4" /> : 
             role === 'pm' ? <FolderKanban className="h-4 w-4" /> : <Target className="h-4 w-4" />}
        </div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <div className="h-px flex-1 bg-slate-200 ml-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => {
          const stats = calculateStats(role, profile.id, data);
          return (
            <div key={profile.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600">
                    {profile.full_name?.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{profile.full_name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{profile.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat: any, idx: number) => (
                    <div key={idx} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <StatIcon type={stat.type} />
                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatIcon({ type }: { type: string }) {
    switch (type) {
        case 'positive': return <TrendingUp className="h-3 w-3 text-emerald-500" />;
        case 'negative': return <AlertCircle className="h-3 w-3 text-red-500" />;
        case 'neutral': return <TrendingUp className="h-3 w-3 text-slate-400" rotate={90} />;
        case 'success': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
        default: return null;
    }
}

function calculateStats(role: string, userId: string, data: any) {
    switch (role) {
        case 'telecaller': {
            const userCalls = data.calls?.filter((c: any) => c.telecaller_id === userId) || [];
            const connected = userCalls.filter((c: any) => c.outcome === 'connected' || c.outcome === 'interested' || c.outcome === 'strategy_booked').length;
            const booked = userCalls.filter((c: any) => c.outcome === 'strategy_booked').length;
            const rate = userCalls.length > 0 ? Math.round((connected / userCalls.length) * 100) : 0;
            
            return [
                { label: 'Calls Made', value: userCalls.length, type: 'neutral' },
                { label: 'Connect Rate', value: `${rate}%`, type: rate > 30 ? 'positive' : 'negative' },
                { label: 'Demos Booked', value: booked, type: 'success' },
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

            return [
                { label: 'Projects', value: userProjects.length, type: 'neutral' },
                { label: 'Health Score', value: '4.2', type: 'positive' }, // Mocking for now
                { label: 'Milestones', value: completedMilestones, type: 'success' },
                { label: 'Efficiency', value: '88%', type: 'positive' }
            ];
        }
        case 'strategist': {
            const userDeals = data.deals?.filter((d: any) => d.created_by === userId) || [];
            const totalValue = userDeals.reduce((acc: number, d: any) => acc + (d.value || 0), 0);
            const closeRate = userDeals.length > 0 ? "24%" : "0%";

            return [
                { label: 'Deals Closed', value: userDeals.length, type: 'success' },
                { label: 'Rev. Moved', value: `₹${totalValue.toLocaleString()}`, type: 'positive' },
                { label: 'Close Rate', value: closeRate, type: 'positive' },
                { label: 'Pipeline Val.', value: '₹12.4L', type: 'neutral' }
            ];
        }
        default: return [];
    }
}
