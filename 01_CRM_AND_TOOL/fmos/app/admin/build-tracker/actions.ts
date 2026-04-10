"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────────────
export type ModuleStatus = "not_started" | "in_progress" | "done" | "blocked";
export type ModulePriority = "high" | "medium" | "low";

export interface BuildTrackerModule {
  id: string;
  system_id: number;
  system_name: string;
  module_name: string;
  status: ModuleStatus;
  priority: ModulePriority;
  notes: string | null;
  sort_order: number;
  last_updated: string;
  created_at: string;
}

// ── Fetch ──────────────────────────────────────────────────────────────────
export async function fetchBuildTrackerModules(): Promise<BuildTrackerModule[]> {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("build_tracker_modules")
    .select("*")
    .order("system_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchBuildTrackerModules error:", error);
    throw new Error("Failed to load build tracker data.");
  }

  return (data ?? []) as BuildTrackerModule[];
}

// ── Update Status ──────────────────────────────────────────────────────────
export async function updateModuleStatus(
  id: string,
  status: ModuleStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("build_tracker_modules")
    .update({
      status,
      last_updated: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("updateModuleStatus error:", error);
    return { success: false, error: "Failed to update status." };
  }

  revalidatePath("/admin/build-tracker");
  revalidatePath("/admin");
  return { success: true };
}

// ── Update Notes ───────────────────────────────────────────────────────────
export async function updateModuleNotes(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("build_tracker_modules")
    .update({
      notes: notes.trim() || null,
      last_updated: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("updateModuleNotes error:", error);
    return { success: false, error: "Failed to save notes." };
  }

  revalidatePath("/admin/build-tracker");
  return { success: true };
}

// ── Add Module ─────────────────────────────────────────────────────────────
export async function addModule(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const system_id = parseInt(formData.get("system_id") as string, 10);
  const system_name = formData.get("system_name") as string;
  const module_name = (formData.get("module_name") as string)?.trim();
  const priority = (formData.get("priority") as ModulePriority) ?? "medium";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!module_name) {
    return { success: false, error: "Module name is required." };
  }

  if (![1, 2, 3].includes(system_id)) {
    return { success: false, error: "Invalid system." };
  }

  // Get max sort_order for this system
  const { data: maxRow } = await supabase
    .from("build_tracker_modules")
    .select("sort_order")
    .eq("system_id", system_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("build_tracker_modules").insert({
    system_id,
    system_name,
    module_name,
    priority,
    notes,
    status: "not_started",
    sort_order: nextOrder,
    updated_by: user.id,
  });

  if (error) {
    console.error("addModule error:", error);
    return { success: false, error: "Failed to add module." };
  }

  revalidatePath("/admin/build-tracker");
  return { success: true };
}
