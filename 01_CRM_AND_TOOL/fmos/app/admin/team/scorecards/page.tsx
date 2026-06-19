import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Trophy, Calendar, ArrowLeft, ArrowRight, User, TrendingUp, BarChart } from "lucide-react";
import Link from "next/link";
import RoleScorecard from "@/components/team/role-scorecard";

export default async function ScorecardsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createServerClientWithCookies();
  
  // Calculate week range
  const resolvedParams = await searchParams;
  const currentWeek = resolvedParams.week ? new Date(resolvedParams.week) : new Date();
  const startOfWeek = new Date(currentWeek);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startStr = startOfWeek.toISOString();
  const endStr = endOfWeek.toISOString();

  // Navigation weeks
  const prevWeek = new Date(startOfWeek);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(startOfWeek);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // 1. Fetch Profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "client")
    .order("role");

  // 2. Fetch Data according to roles (Simplified aggregation)
  // In a high-traffic app, we'd use a single RPC call or pre-aggregated stats table.
  
  // Telecaller Data (Calls from outreach_logs)
  const { data: calls } = await supabase
    .from("outreach_logs")
    // outreach_logs has `outcome`, not `outcome_id`.
    .select("actor_id, created_at, outcome, lead_id")
    .eq("touch_type", "call")
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  // Staff/Dev Data (Tasks) — tasks due this week OR completed this week.
  // tasks has no updated_at — completion timestamp is completion_date.
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .or(`due_date.gte.${startStr.split('T')[0]},and(status.eq.completed,completion_date.gte.${startStr})`);

  // PM Data (Projects/Milestones)
  const { data: projects } = await supabase
    .from("projects")
    .select("*");

  // Strategist Data (Proposals sent/confirmed this week)
  const { data: deals } = await supabase
    .from("proposals")
    .select("id, lead_id, status, created_by, created_at, total_monthly, total_setup")
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              <Trophy className="h-10 w-10 text-amber-500" />
              Weekly Scorecards
            </h1>
            <p className="text-slate-500 font-medium">Performance tracking grouped by organizational roles.</p>
          </div>
          
          <div className="flex items-center bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <Link 
              href={`/admin/team/scorecards?week=${prevWeek.toISOString()}`}
              className="p-3 hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </Link>
            <div className="px-6 py-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Week of</p>
              <p className="text-sm font-black text-slate-900">{startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {endOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <Link 
              href={`/admin/team/scorecards?week=${nextWeek.toISOString()}`}
              className="p-3 hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Role Groups */}
        <div className="space-y-16">
          {/* Telecallers */}
          <RoleScorecard 
            role="telecaller" 
            title="Telecalling Team"
            profiles={profiles?.filter((p: any) => p.role === 'telecaller') || []}
            data={{ calls }}
          />

          {/* Developers / Staff */}
          <RoleScorecard 
            role="staff" 
            title="Design & Development"
            profiles={profiles?.filter((p: any) => p.role === 'staff' || p.role === 'sales') || []}
            data={{ tasks }}
          />

          {/* Project Managers */}
          <RoleScorecard 
            role="pm" 
            title="Project Management"
            profiles={profiles?.filter((p: any) => p.role === 'pm' || p.role === 'manager') || []}
            data={{ projects, tasks }}
          />

          {/* Strategists */}
          <RoleScorecard 
            role="strategist" 
            title="Strategy & Closing"
            profiles={profiles?.filter((p: any) => p.role === 'strategist') || []}
            data={{ deals }}
          />
        </div>
      </div>
    </div>
  );
}
