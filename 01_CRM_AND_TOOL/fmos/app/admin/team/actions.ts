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

  // The prompt asks to upsert into team_targets.
  // We'll map the data to the schema described in the prompt.
  // If the columns don't exist yet, we'll assume they are intended to be there.
  const data = targets.map(t => ({
    user_id: t.user_id,
    target_type: t.target_type,
    daily_target: t.daily_target,
    weekly_target: t.weekly_target,
    updated_by: user?.id,
    updated_at: new Date().toISOString()
  }));

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
