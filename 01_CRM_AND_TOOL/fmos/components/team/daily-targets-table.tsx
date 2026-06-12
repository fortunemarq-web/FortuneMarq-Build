"use client";

import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import clsx from "clsx";

interface Target {
  user_id: string;
  target_type: string;
  daily_target?: number;
  weekly_target?: number;
  target_value?: number; // fallback
}

interface DailyTargetsTableProps {
  targets: Target[];
  profiles: any[];
  /** Real daily actuals per user (calls = lead_outcomes today, tasks = completed today) */
  actuals?: Record<string, { calls: number; tasks: number }>;
}

export default function DailyTargetsTable({ targets, profiles, actuals }: DailyTargetsTableProps) {
  // Returns null when we can't measure this target type yet (revenue/sites/demos)
  const getActual = (userId: string, targetType: string): number | null => {
    const a = actuals?.[userId];
    if (!a) return null;
    if (targetType === "calls") return a.calls;
    if (targetType === "tasks") return a.tasks;
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Goal</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {profiles.slice(0, 8).map(profile => {
            const userTargets = targets.filter(t => t.user_id === profile.id);
            if (userTargets.length === 0) return null;

            return userTargets.map(target => {
              const targetGoal = target.daily_target || target.target_value || 0;
              const actual = getActual(profile.id, target.target_type);
              const percent = actual === null
                ? null
                : Math.min(Math.round((actual / (targetGoal || 1)) * 100), 100) || 0;

              return (
                <tr key={`${profile.id}-${target.target_type}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                        {profile.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{profile.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium capitalize">{profile.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">
                        {target.daily_target ?? target.target_value} {target.weekly_target ? `/ ${target.weekly_target}w` : ''}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{target.target_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {percent === null ? (
                      <span className="text-[10px] font-bold text-slate-300 uppercase" title="No automatic tracking for this target type yet">
                        Not tracked
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full transition-all duration-500",
                              percent >= 100 ? "bg-emerald-500" : percent > 50 ? "bg-amber-500" : "bg-slate-300"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-900">{actual}/{targetGoal} · {percent}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            });
          })}
          
          {targets.length === 0 && (
            <tr>
               <td colSpan={3} className="px-6 py-12 text-center">
                  <TrendingUp className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-400">No targets set for today</p>
               </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
