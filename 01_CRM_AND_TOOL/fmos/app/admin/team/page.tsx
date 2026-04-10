import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Users, Target, CheckCircle2, ListTodo, MoreVertical, Plus } from "lucide-react";
import Link from "next/link";
import TeamOverviewClient from "@/components/team/team-overview-client";

export default async function TeamOverviewPage() {
  const supabase = await createServerClientWithCookies();

  // 1. Fetch all internal team profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "client")
    .order("full_name");

  if (profilesError) {
    return <div className="p-8 text-red-500">Error loading team: {profilesError.message}</div>;
  }

  // 2. Fetch Tasks stats for each member
  // We'll do this in a single query or per-member? 
  // For better performance, we'll fetch all open tasks and grouped counts
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const { data: allTasks } = await supabase
    .from("tasks")
    .select("status, assigned_to, updated_at")
    .or(`status.neq.completed,updated_at.gte.${startOfWeekStr}`);

  const taskStats: Record<string, any> = {};
  profiles?.forEach((p: any) => {
    taskStats[p.id] = {
      active: 0,
      completedToday: 0,
      completedThisWeek: 0
    };
  });

  allTasks?.forEach((task: any) => {
    if (!task.assigned_to || !taskStats[task.assigned_to]) return;
    
    if (task.status !== 'completed') {
      taskStats[task.assigned_to].active++;
    } else {
      const taskDate = task.updated_at.split('T')[0];
      if (taskDate === today) {
        taskStats[task.assigned_to].completedToday++;
      }
      if (taskDate >= startOfWeekStr) {
        taskStats[task.assigned_to].completedThisWeek++;
      }
    }
  });

  // 3. Fetch Targets
  const { data: targets } = await supabase
    .from("team_targets")
    .select("*");

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
      <TeamOverviewClient 
        profiles={profiles} 
        targets={targets || []} 
        taskStats={taskStats} 
      />
    </div>
  );
}
