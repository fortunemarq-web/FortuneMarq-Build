"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function fetchStrategyTeam() {
  const supabase = await createServerClientWithCookies();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });
    
  return data || [];
}

export async function saveApprovedTasks(
  tasks: any[], 
  strategyTitle: string, 
  destination: string, 
  timeframe: string, 
  strategyText: string,
  client_id?: string,
  strategy_type?: string
) {
  const supabase = await createServerClientWithCookies();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");

  // 1. Create strategy run
  const { data: runData, error: runError } = await supabase
    .from("strategy_runs" as any)
    .insert({
      title: strategyTitle,
      destination,
      timeframe,
      strategy_text: strategyText,
      tasks_generated: tasks.length,
      created_by: userData.user.id,
      ...(client_id ? { client_id } : {}),
      ...(strategy_type ? { strategy_type } : {}),
    })
    .select()
    .single() as any;

  if (runError) {
    console.error("Error creating strategy run:", runError);
    return { success: false, error: runError.message };
  }

  // 2. Insert tasks
  const tasksToInsert = tasks.map((t) => ({
    title: t.title,
    description: t.description,
    due_date: t.due_date,
    priority: t.priority,
    assigned_to: t.assignee, // Map assignee to assigned_to in tasks table
    section_tag: t.section_tag,
    estimated_minutes: t.estimated_minutes,
    strategy_run_id: runData.id,
    status: 'pending' as any,
    type: 'admin', // Default value for task type
    ...(t.client_id ? { client_id: t.client_id } : {}),
  }));

  const { data: insertedTasks, error: tasksError } = await supabase
    .from("tasks")
    .insert(tasksToInsert)
    .select() as any;

  if (tasksError) {
    console.error("Error creating tasks:", tasksError);
    return { success: false, error: tasksError.message };
  }

  // 3. Create linking records
  if (insertedTasks && insertedTasks.length > 0) {
    const linkingRecords = insertedTasks.map((t: any) => ({
      strategy_run_id: runData.id,
      task_id: t.id
    }));
    
    const { error: linkError } = await supabase.from("strategy_run_tasks" as any).insert(linkingRecords);
    if (linkError) console.error("Error creating strategy links:", linkError);
  }

  revalidatePath("/admin/strategy/archive");
  revalidatePath("/tasks");
  return { success: true, count: insertedTasks?.length || 0 };
}

export async function fetchStrategyArchive() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("strategy_runs" as any)
    .select("*, profiles!created_by(full_name)")
    .order("created_at", { ascending: false });
    
  if (error) console.error("Error fetching strategy archive:", error);
  return data || [];
}

export async function fetchStrategyRunCompletion(runId: string) {
  const supabase = await createServerClientWithCookies();
  
  const { data } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("strategy_run_id", runId);
    
  const total = data?.length || 0;
  const completed = (data as any[])?.filter(t => t.status === 'completed' || t.status === 'approved').length || 0;
  
  return {
    total,
    completed,
    remaining: total - completed
  };
}

export async function fetchClientStrategyRuns(clientId: string) {
  const supabase = await createServerClientWithCookies();
  
  const { data: runs, error } = await supabase
    .from("strategy_runs" as any)
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
    
  if (error) console.error("Error fetching client strategy runs:", error);
  if (!runs || runs.length === 0) return [];
  
  // Enrich each run with completion counts
  const enriched = [];
  for (const run of runs) {
    const counts = await fetchStrategyRunCompletion((run as any).id);
    enriched.push({ ...(run as any), counts });
  }
  
  return enriched;
}
