"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import { isApprovedWaTemplate } from "@/lib/whatsapp/approved-templates";
import { leadStageUpdate } from "@/lib/pipeline";

// ── Types ───────────────────────────────────────────────────
export interface ClientRecord {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  primary_email: string | null;
  city: string | null;
  niche: string | null;
  services: string[] | null;
  monthly_value: number | null;
  health_score: number | null;
  renewal_date: string | null;
  status: string | null;
  onboarding_completed: boolean | null;
  start_date: string | null;
  notes: string | null;
  last_upsell_attempt: string | null;
  upsell_notes: string | null;
  created_at: string | null;
  package_tier: string | null;
  services_active: string[] | null;
  upsell_eligible: boolean | null;
  active_projects?: number;
}

// ── Fetch all clients ───────────────────────────────────────
export async function fetchClients(): Promise<ClientRecord[]> {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchClients error:", error);
    return [];
  }

  return (data ?? []) as any as ClientRecord[];
}

// ── Check for a matching lead before creating a client from scratch ──
// Ads/inbound contacts should land as a lead first — this catches the case
// where "new client" is actually already sitting in the pipeline somewhere.
export async function checkLeadsByBusinessName(name: string): Promise<
  {
    id: string;
    company_name: string;
    city: string | null;
    phone: string | null;
    outreach_stage: string | null;
    industry: string | null;
    contact_person: string | null;
  }[]
> {
  if (!name || name.trim().length < 3) return [];
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("leads")
    .select("id, company_name, city, phone, outreach_stage, industry, contact_person")
    .ilike("company_name", `%${name.trim()}%`)
    .limit(5);

  if (error) {
    console.error("checkLeadsByBusinessName error:", error);
    return [];
  }

  return (data ?? []) as any;
}

// ── Create a new client ─────────────────────────────────────
export async function createClient(formData: {
  business_name: string;
  owner_name: string;
  phone: string;
  primary_email: string;
  city: string;
  niche: string;
  services: string[];
  monthly_value: number;
  start_date: string;
  renewal_date: string;
  matchedLeadId?: string;
}): Promise<{ success: boolean; error?: string; clientId?: string }> {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      business_name: formData.business_name,
      owner_name: formData.owner_name,
      phone: formData.phone,
      primary_email: formData.primary_email,
      city: formData.city,
      niche: formData.niche,
      services: formData.services,
      monthly_value: formData.monthly_value,
      status: "active",
      health_score: 3,
      start_date: formData.start_date || new Date().toISOString().split("T")[0],
      renewal_date: formData.renewal_date || null,
      onboarding_completed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createClient error:", error);
    return { success: false, error: error.message };
  }

  // Auto-create onboarding checklist
  if (data?.id) {
    await supabase.rpc("create_default_onboarding", {
      p_client_id: data.id,
    });
  }

  // Creating a client from a matched lead means that lead has converted —
  // close it out so it doesn't sit "open" on the Outreach Board forever.
  if (formData.matchedLeadId) {
    await supabase
      .from("leads")
      .update(leadStageUpdate("won"))
      .eq("id", formData.matchedLeadId);
  }

  revalidatePath("/admin/clients");
  return { success: true, clientId: data?.id };
}

// ── Update a single client field ────────────────────────────
export async function updateClientField(
  clientId: string,
  field: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("clients")
    .update({ [field]: value })
    .eq("id", clientId);

  if (error) {
    console.error("updateClientField error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { success: true };
}

// ── Delete a client (admin cleanup for mistakes) ────────────
// Removes known child rows first, then the client. For real
// offboarding prefer setting status to "churned" instead.
export async function deleteClient(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  // Best-effort cleanup of child tables (some may not have rows)
  const childTables = [
    "client_packages",
    "client_assets",
    "client_call_logs",
    "onboarding_checklists",
    "client_onboarding_tasks",
    "client_asset_vault",
    "upsell_attempts",
  ];
  for (const table of childTables) {
    const { error } = await supabase
      // dynamic table name over a fixed allow-list (some may not exist)
      .from(table as any)
      .delete()
      .eq("client_id", clientId);
    if (error && !/does not exist/i.test(error.message)) {
      console.error(`deleteClient cleanup (${table}):`, error.message);
    }
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) {
    console.error("deleteClient error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/clients");
  return { success: true };
}

// ── Fetch single client with related data ───────────────────
export async function fetchClientById(clientId: string) {
  const supabase = await createServerClientWithCookies();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) return null;
  return client as any as ClientRecord;
}

// ── Toggle onboarding checklist item ────────────────────────
export async function toggleOnboardingItem(
  itemId: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const updateData: Record<string, unknown> = {
    is_completed: isCompleted,
  };

  if (isCompleted) {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = user?.id ?? null;
  } else {
    updateData.completed_at = null;
    updateData.completed_by = null;
  }

  const { error } = await supabase
    .from("onboarding_checklists")
    .update(updateData)
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/clients");
  return { success: true };
}

// ── Fetch onboarding checklist for a client ─────────────────
export async function fetchOnboardingItems(clientId: string) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("onboarding_checklists")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchOnboardingItems error:", error);
    return [];
  }

  return data ?? [];
}

// ── Add asset to vault ──────────────────────────────────────
export async function addClientAsset(formData: {
  client_id: string;
  category: "credentials" | "brand_assets" | "links";
  label: string;
  username?: string;
  password_encrypted?: string;
  url?: string;
  file_url?: string;
  file_type?: string;
  link_url?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  // Passwords stored plaintext — admin-only RLS enforced.
  // Upgrade to pgp_sym_encrypt in future security pass.
  const { error } = await supabase
    .from("client_assets")
    .insert(formData);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${formData.client_id}`);
  return { success: true };
}

// ── Delete asset from vault ─────────────────────────────────
export async function deleteClientAsset(
  assetId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("client_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

// ── Fetch assets for a client ───────────────────────────────
export async function fetchClientAssets(clientId: string) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("client_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchClientAssets error:", error);
    return [];
  }

  return data ?? [];
}

// ── Log a client call ───────────────────────────────────────
export async function logClientCall(formData: {
  client_id: string;
  call_date: string;
  duration_minutes: number;
  outcome: string;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("client_call_logs")
    .insert({
      ...formData,
      logged_by: user?.id ?? null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${formData.client_id}`);
  return { success: true };
}

// ── Fetch call logs for a client ────────────────────────────
export async function fetchClientCallLogs(clientId: string) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("client_call_logs")
    .select("*, profiles:logged_by(full_name)")
    .eq("client_id", clientId)
    .order("call_date", { ascending: false });

  if (error) {
    console.error("fetchClientCallLogs error:", error);
    return [];
  }

  return data ?? [];
}

// ── Fetch projects for a client ─────────────────────────────
export async function fetchClientProjects(clientId: string) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await supabase
    .from("projects")
    .select("*, assigned_profile:profiles!projects_assigned_to_fkey(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchClientProjects error:", error);
    return [];
  }

  return data ?? [];
}

// ── Update client notes (Ctrl+S) ────────────────────────────
export async function updateClientNotes(
  clientId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("clients")
    .update({ notes })
    .eq("id", clientId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

// ── Send an approved WhatsApp template to a client on demand ────────
export async function sendClientWhatsAppTemplate(
  clientId: string,
  templateName: string,
  variables: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!isApprovedWaTemplate(templateName)) {
    return { success: false, error: "Not an approved WhatsApp template" };
  }

  const supabase = await createServerClientWithCookies();
  const { data: client } = await supabase
    .from("clients")
    .select("phone")
    .eq("id", clientId)
    .single();

  if (!client?.phone) {
    return { success: false, error: "No phone number on file for this client" };
  }

  const result = await sendWhatsAppTemplate(client.phone, templateName, {
    language: "en",
    components: variables.filter((v) => v.trim()).length > 0
      ? [{ type: "body", parameters: variables.map((v) => ({ type: "text", text: v })) }]
      : undefined,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}
