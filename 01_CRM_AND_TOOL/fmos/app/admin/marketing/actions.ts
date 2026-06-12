"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface CampaignInput {
  id?: string;
  campaign_name: string;
  platform: string;
  status?: string;
  objective?: string;
  monthly_budget?: number;
  cpl_target?: number | null;
  external_campaign_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export async function saveCampaign(input: CampaignInput) {
  const supabase = await createServerClientWithCookies();
  const row: any = {
    campaign_name: input.campaign_name.trim(),
    platform: input.platform,
    status: input.status || "active",
    objective: input.objective || "lead_generation",
    monthly_budget: input.monthly_budget ?? 0,
    cpl_target: input.cpl_target ?? null,
    external_campaign_id: input.external_campaign_id?.trim() || null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    notes: input.notes || null,
  };
  if (!row.campaign_name) return { success: false, error: "Campaign name is required" };

  const query = input.id
    ? (supabase.from("ad_campaigns") as any).update(row).eq("id", input.id)
    : (supabase.from("ad_campaigns") as any).insert(row);
  const { error } = await query;
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/marketing");
  return { success: true };
}

export async function setCampaignStatus(id: string, status: string) {
  const supabase = await createServerClientWithCookies();
  const { error } = await (supabase.from("ad_campaigns") as any).update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/marketing");
  return { success: true };
}

export async function deleteCampaign(id: string) {
  const supabase = await createServerClientWithCookies();
  // Insights cascade; attribution rows keep their lead but lose the campaign link
  const { error } = await (supabase.from("ad_campaigns") as any).delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/marketing");
  return { success: true };
}

export interface SpendRow {
  date: string; // YYYY-MM-DD
  campaign_name: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  adset_name?: string | null;
  ad_name?: string | null;
}

/**
 * Upsert daily spend rows. The unique index uses coalesce() expressions, which
 * PostgREST upsert can't target — so we delete-then-insert per (date, campaign,
 * adset, ad) key. Volumes are small (daily CSV exports).
 */
export async function importSpendRows(rows: SpendRow[]) {
  const supabase = await createServerClientWithCookies();
  if (!rows.length) return { success: false, error: "No rows to import" };
  if (rows.length > 2000) return { success: false, error: "Too many rows (max 2000 per import)" };

  // Resolve campaign names → ids (auto-create unknown campaigns)
  const names = [...new Set(rows.map((r) => r.campaign_name.trim()).filter(Boolean))];
  const { data: existing } = await (supabase.from("ad_campaigns") as any)
    .select("id, campaign_name")
    .in("campaign_name", names);
  const idByName: Record<string, string> = {};
  (existing || []).forEach((c: any) => { idByName[c.campaign_name.toLowerCase()] = c.id; });

  for (const name of names) {
    if (idByName[name.toLowerCase()]) continue;
    const platform = rows.find((r) => r.campaign_name.trim() === name)?.platform || "other";
    const { data: created, error } = await (supabase.from("ad_campaigns") as any)
      .insert({ campaign_name: name, platform, status: "active", objective: "lead_generation", notes: "Auto-created from spend import." })
      .select("id")
      .single();
    if (error) return { success: false, error: `Could not create campaign "${name}": ${error.message}` };
    idByName[name.toLowerCase()] = created.id;
  }

  let imported = 0;
  for (const r of rows) {
    const campaign_id = idByName[r.campaign_name.trim().toLowerCase()];
    if (!campaign_id || !r.date) continue;
    const key = {
      date: r.date,
      campaign_id,
      adset_name: r.adset_name ?? null,
      ad_name: r.ad_name ?? null,
    };
    let del = (supabase.from("ad_insights_daily") as any).delete()
      .eq("date", key.date).eq("campaign_id", key.campaign_id);
    del = key.adset_name === null ? del.is("adset_name", null) : del.eq("adset_name", key.adset_name);
    del = key.ad_name === null ? del.is("ad_name", null) : del.eq("ad_name", key.ad_name);
    await del;
    const { error } = await (supabase.from("ad_insights_daily") as any).insert({
      ...key,
      platform: r.platform,
      spend: r.spend || 0,
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      leads: r.leads || 0,
    });
    if (error) return { success: false, error: error.message, imported };
    imported++;
  }

  revalidatePath("/admin/marketing");
  return { success: true, imported, campaignsCreated: names.length - (existing || []).length };
}
