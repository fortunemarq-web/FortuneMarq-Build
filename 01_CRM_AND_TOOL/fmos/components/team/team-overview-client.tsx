"use client";

import { useState } from "react";
import { Users, Target, CheckCircle2, ListTodo, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { buttonVariants } from "@/components/ui/button";
import TeamMemberCard from "@/components/team/team-member-card";
import DailyTargetsTable from "@/components/team/daily-targets-table";
import SetTargetsModal from "@/components/team/set-targets-modal";
import AssignTaskModal from "@/components/team/assign-task-modal";
import AddMemberModal from "@/components/team/add-member-modal";

interface TeamOverviewClientProps {
  profiles: any[];
  targets: any[];
  taskStats: Record<string, any>;
  /** Real per-user daily actuals: calls (lead_outcomes today), tasks (completed today) */
  actuals?: Record<string, { calls: number; tasks: number }>;
}

export default function TeamOverviewClient({ profiles, targets, taskStats, actuals }: TeamOverviewClientProps) {
  const [isSetTargetsOpen, setIsSetTargetsOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [assignDefault, setAssignDefault] = useState<string | undefined>(undefined);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <PageHeader
        title="Team Overview"
        subtitle="Manage workloads, targets, and team performance."
        className="mb-10"
        actions={
          <>
            <button
              onClick={() => { setAssignDefault(undefined); setIsAssignTaskOpen(true); }}
              className={buttonVariants({ variant: "secondary" })}
            >
              <Plus className="h-4 w-4" /> Assign Task
            </button>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className={buttonVariants({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" /> Add Member
            </button>
          </>
        }
      />

      {/* Aggregate Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Team" value={profiles.length} icon={Users} />
        <StatCard
          label="Active Tasks"
          value={Object.values(taskStats).reduce((acc, s) => acc + (s.active || 0), 0)}
          icon={ListTodo}
        />
        <StatCard
          label="Done Today"
          value={Object.values(taskStats).reduce((acc, s) => acc + (s.completedToday || 0), 0)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Done This Week"
          value={Object.values(taskStats).reduce((acc, s) => acc + (s.completedThisWeek || 0), 0)}
          icon={Target}
        />
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
                onAssign={() => { setAssignDefault(profile.id); setIsAssignTaskOpen(true); }}
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
          <DailyTargetsTable targets={targets || []} profiles={profiles} actuals={actuals} />
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
          defaultAssignee={assignDefault}
          onClose={() => setIsAssignTaskOpen(false)}
        />
      )}

      {isAddMemberOpen && (
        <AddMemberModal onClose={() => setIsAddMemberOpen(false)} />
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
