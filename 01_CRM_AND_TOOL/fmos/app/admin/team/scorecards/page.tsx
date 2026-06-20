import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import RoleScorecard from "@/components/team/role-scorecard";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Team"
          title="Weekly Scorecards"
          subtitle="Performance tracking grouped by organizational roles."
          actions={
            <div className="flex items-center rounded-lg border border-line bg-surface p-1">
              <Link
                href={`/admin/team/scorecards?week=${prevWeek.toISOString()}`}
                className="rounded-md p-2.5 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 text-slate-400" />
              </Link>
              <div className="px-5 py-1 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Week of</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {endOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <Link
                href={`/admin/team/scorecards?week=${nextWeek.toISOString()}`}
                className="rounded-md p-2.5 transition-colors hover:bg-slate-50"
              >
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          }
        />

        {/* Role Groups */}
        <div className="space-y-12">
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
