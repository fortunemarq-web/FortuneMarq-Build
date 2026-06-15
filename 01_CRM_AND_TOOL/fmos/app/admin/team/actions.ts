"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Fix 1: Set Targets
 */
export async function upsertTeamTargets(targets: Array<{
  user_id: string;
  target_type: string;
  daily_target: number;
  weekly_target: number;
}>) {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  // Live team_targets stores ONE target_value per (user_id, target_type) row
  // (UNIQUE(user_id, target_type) — there are no daily_target/weekly_target
  // columns). Encode the period in target_type so daily and weekly each get
  // their own row: daily_<metric> / weekly_<metric>. The UI merges them back.
  const now = new Date().toISOString();
  const data = targets.flatMap(t => [
    { user_id: t.user_id, target_type: `daily_${t.target_type}`,  target_value: t.daily_target ?? 0,  updated_by: user?.id, updated_at: now },
    { user_id: t.user_id, target_type: `weekly_${t.target_type}`, target_value: t.weekly_target ?? 0, updated_by: user?.id, updated_at: now },
  ]);

  const { error } = await supabase
    .from("team_targets")
    .upsert(data, { onConflict: "user_id,target_type" });

  if (error) {
    console.error("Error upserting team targets:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/team");
  return { success: true };
}

/**
 * Fix 2: Assign Task
 */
export async function createAssignedTask(task: {
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  priority: string;
}) {
  const supabase = await createServerClientWithCookies();
  
  const { error } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      priority: task.priority,
      status: "not_started",
      section_tag: "Team",
      type: "admin"
    });

  if (error) {
    console.error("Error creating assigned task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/team");
  revalidatePath("/tasks");
  return { success: true };
}

/**
 * Fix 4: Create SOP
 */
export async function createSopAction(formData: FormData) {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const tools = formData.get("tools") as string;
  const mins = parseInt(formData.get("mins") as string) || 0;
  const stepsStr = formData.get("steps") as string;
  const steps = JSON.parse(stepsStr);

  const { data, error } = await supabase
    .from("sops")
    .insert({
      title,
      category,
      tools_required: tools,
      estimated_minutes: mins,
      steps,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating SOP:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/team/sops");
  redirect("/admin/team/sops");
}

/**
 * Update existing SOP
 */
export async function updateSopAction(id: string, formData: FormData) {
  const supabase = await createServerClientWithCookies();

  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const tools = formData.get("tools") as string;
  const mins = parseInt(formData.get("mins") as string) || 0;
  const stepsStr = formData.get("steps") as string;
  const steps = JSON.parse(stepsStr);

  const { error } = await supabase
    .from("sops")
    .update({
      title,
      category,
      tools_required: tools,
      estimated_minutes: mins,
      steps,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating SOP:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/team/sops");
  revalidatePath(`/admin/team/sops/${id}`);
  redirect("/admin/team/sops");
}

export async function deleteSopAction(id: string) {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("sops")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting SOP:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/team/sops");
  redirect("/admin/team/sops");
}
