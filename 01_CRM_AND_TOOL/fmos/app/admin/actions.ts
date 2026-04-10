"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ── Add New Lead ───────────────────────────────────────────────────────────
export async function createLead(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const company_name = (formData.get("company_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const industry = (formData.get("industry") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const lead_type = (formData.get("lead_type") as string) || "outbound";

  if (!company_name) {
    return { success: false, error: "Company name is required." };
  }

  const { error } = await supabase.from("leads").insert({
    company_name,
    phone,
    industry,
    city,
    status: "new",
    source: lead_type === "inbound" ? "inbound" : "outbound",
    assigned_sales_exec: user.id,
  });

  if (error) {
    console.error("createLead error:", error);
    return { success: false, error: "Failed to create lead." };
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return { success: true };
}

// ── Create Task ────────────────────────────────────────────────────────────
export async function createTask(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const due_date = (formData.get("due_date") as string) || null;
  const priority = (formData.get("priority") as string) || "medium";

  if (!title) {
    return { success: false, error: "Task title is required." };
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    due_date: due_date || null,
    priority,
    status: "pending",
    assigned_to: user.id,
  });

  if (error) {
    console.error("createTask error:", error);
    return { success: false, error: "Failed to create task." };
  }

  revalidatePath("/admin");
  revalidatePath("/tasks");
  return { success: true };
}

// ── Update Agency Growth Metrics ───────────────────────────────────────────
export async function updateGrowthMetric(
  metricKey: string,
  currentValue: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Fetch current value as last_month_value before updating
  const { data: existing } = await supabase
    .from("agency_growth_metrics")
    .select("current_value")
    .eq("metric_key", metricKey)
    .single();

  const { error } = await supabase
    .from("agency_growth_metrics")
    .update({
      last_month_value: (existing as any)?.current_value ?? 0,
      current_value: currentValue,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("metric_key", metricKey);

  if (error) {
    console.error("updateGrowthMetric error:", error);
    return { success: false, error: "Failed to update metric." };
  }

  revalidatePath("/admin");
  return { success: true };
}
