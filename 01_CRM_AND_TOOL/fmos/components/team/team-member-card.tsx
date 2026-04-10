"use client";

import { Mail, Calendar, ListTodo, CheckCircle2, Trophy, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface TeamMemberCardProps {
  profile: any;
  stats: {
    active: number;
    completedToday: number;
    completedThisWeek: number;
  };
}

export default function TeamMemberCard({ profile, stats }: TeamMemberCardProps) {
  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    manager: "bg-indigo-500",
    pm: "bg-purple-500",
    strategist: "bg-blue-500",
    telecaller: "bg-emerald-500",
    staff: "bg-slate-500"
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-black/10 border-2 border-white overflow-hidden">
            {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
                profile.full_name?.charAt(0) || "U"
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">{profile.full_name || 'Anonymous'}</h3>
            <div className="flex items-center gap-1.5 text-slate-400 mt-1">
              <span className={clsx("h-2 w-2 rounded-full", roleColors[profile.role] || "bg-slate-400")} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{profile.role || 'guest'}</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Active</p>
          <div className="text-sm font-black text-slate-900 flex items-center justify-center gap-1">
            <ListTodo className="h-3 w-3 text-amber-500" />
            {stats.active}
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Today</p>
          <div className="text-sm font-black text-slate-900 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {stats.completedToday}
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Week</p>
          <div className="text-sm font-black text-slate-900 flex items-center justify-center gap-1">
            <Trophy className="h-3 w-3 text-indigo-500" />
            {stats.completedThisWeek}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link 
          href={`/tasks?assignee=${profile.id}`}
          className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          View Tasks
        </Link>
        <button className="flex-1 text-center py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
          Assign
        </button>
      </div>
    </div>
  );
}
