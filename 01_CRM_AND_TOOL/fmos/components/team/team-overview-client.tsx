"use client";

import { useState } from "react";
import { Users, Target, CheckCircle2, ListTodo, Plus } from "lucide-react";
import TeamMemberCard from "@/components/team/team-member-card";
import DailyTargetsTable from "@/components/team/daily-targets-table";
import SetTargetsModal from "@/components/team/set-targets-modal";
import AssignTaskModal from "@/components/team/assign-task-modal";

interface TeamOverviewClientProps {
  profiles: any[];
  targets: any[];
  taskStats: Record<string, any>;
}

export default function TeamOverviewClient({ profiles, targets, taskStats }: TeamOverviewClientProps) {
  const [isSetTargetsOpen, setIsSetTargetsOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <Users className="h-10 w-10 text-amber-500" />
            Team Overview
          </h1>
          <p className="text-slate-500 font-medium">Manage workloads, targets, and team performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAssignTaskOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md active:scale-95">
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm" style={{ borderTop: '4px solid #42CA80' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Team</p>
            <Users className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-3xl font-black text-slate-900">{profiles.length}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">Active Tasks</p>
            <ListTodo className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {Object.values(taskStats).reduce((acc, s) => acc + (s.active || 0), 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">Done Today</p>
            <CheckCircle2 className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {Object.values(taskStats).reduce((acc, s) => acc + (s.completedToday || 0), 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">Done This Week</p>
            <Trophy className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {Object.values(taskStats).reduce((acc, s) => acc + (s.completedThisWeek || 0), 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Team Member Cards */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Internal Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile: any) => (
              <TeamMemberCard 
                key={profile.id} 
                profile={profile} 
                stats={taskStats[profile.id] || { active: 0, completedToday: 0, completedThisWeek: 0 }} 
              />
            ))}
          </div>
        </div>

        {/* Today's Targets */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Today's Targets</h2>
            <button 
              onClick={() => setIsSetTargetsOpen(true)}
              className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100"
            >
              Set Targets
            </button>
          </div>
          <DailyTargetsTable targets={targets || []} profiles={profiles} />
        </div>
      </div>

      {/* Modals */}
      {isSetTargetsOpen && (
        <SetTargetsModal 
          profiles={profiles} 
          existingTargets={targets} 
          onClose={() => setIsSetTargetsOpen(false)} 
        />
      )}
      
      {isAssignTaskOpen && (
        <AssignTaskModal 
          profiles={profiles} 
          onClose={() => setIsAssignTaskOpen(false)} 
        />
      )}
    </div>
  );
}

// Helper icons
function Trophy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  );
}
