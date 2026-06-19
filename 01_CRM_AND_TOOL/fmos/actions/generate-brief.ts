"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { callAnthropic } from "@/lib/anthropic";

export interface GenerateBriefResult {
  ok: boolean;
  error?: string;
}

const iso = (d: Date) => d.toISOString().split("T")[0];
const sum = (rows: any[] | null, k: string) => (rows || []).reduce((s, r) => s + Number(r[k] || 0), 0);

/**
 * Generate an AI marketing weekly brief from real metrics (leads, organic sessions,
 * ad spend — this week vs the prior week) and persist it to marketing_weekly_briefs.
 * The most recent brief is what the Overview tab displays.
 */
export async function generateWeeklyBrief(): Promise<GenerateBriefResult> {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * 86400000);
  const prevStart = new Date(now.getTime() - 13 * 86400000);

  const [{ count: leadsThis }, { count: leadsPrev }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", weekStart.toISOString()),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", prevStart.toISOString()).lt("created_at", weekStart.toISOString()),
  ]);

  const [{ data: orgThis }, { data: orgPrev }] = await Promise.all([
    supabase.from("organic_traffic_snapshots").select("organic_sessions").gte("snapshot_date", iso(weekStart)),
    supabase.from("organic_traffic_snapshots").select("organic_sessions").gte("snapshot_date", iso(prevStart)).lt("snapshot_date", iso(weekStart)),
  ]);
  const orgDelta = sum(orgThis, "organic_sessions") - sum(orgPrev, "organic_sessions");

  const [{ data: adThis }, { data: adPrev }] = await Promise.all([
    supabase.from("ad_insights_daily").select("spend").gte("date", iso(weekStart)),
    supabase.from("ad_insights_daily").select("spend").gte("date", iso(prevStart)).lt("date", iso(weekStart)),
  ]);
  const spendDelta = sum(adThis, "spend") - sum(adPrev, "spend");
  const leadsDelta = (leadsThis || 0) - (leadsPrev || 0);

  const metrics = {
    leadsThisWeek: leadsThis || 0,
    leadsLastWeek: leadsPrev || 0,
    leadsDelta,
    organicSessionsDelta: orgDelta,
    adSpendDelta: spendDelta,
  };

  const system =
    "You are a marketing analyst at FortuneMarq, a digital marketing agency in Hubli, India. " +
    "From the weekly metrics provided, produce a short brief as STRICT JSON with exactly these keys: " +
    '"summary_text" (2-3 sentence string), "key_wins" (array of 1-3 short strings), ' +
    '"key_concerns" (array of 1-3 short strings), "recommended_action" (1-2 sentence string). ' +
    "Base everything on the data given; do not invent numbers. Output ONLY the raw JSON object, no markdown, no commentary.";
  const userPrompt =
    `Weekly marketing metrics for ${iso(weekStart)} to ${iso(now)}:\n${JSON.stringify(metrics, null, 2)}`;

  const raw = await callAnthropic(system, userPrompt, "marketing_weekly_brief", 600);
  if (!raw || raw.startsWith("AI Error")) return { ok: false, error: raw || "AI returned no content" };

  let parsed: any = {};
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { summary_text: raw };
  }

  const asArray = (v: any): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

  const { error } = await supabase.from("marketing_weekly_briefs").insert({
    week_start_date: iso(weekStart),
    week_end_date: iso(now),
    summary_text: typeof parsed.summary_text === "string" ? parsed.summary_text : null,
    key_wins: asArray(parsed.key_wins),
    key_concerns: asArray(parsed.key_concerns),
    recommended_action: typeof parsed.recommended_action === "string" ? parsed.recommended_action : null,
    organic_sessions_delta: orgDelta,
    paid_spend_delta: spendDelta,
    leads_delta: leadsDelta,
    generated_by: user?.id ?? null,
  } as any);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
