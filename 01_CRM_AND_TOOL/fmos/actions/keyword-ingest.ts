"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

export interface ParsedNicheData {
  city: string;
  industry: string;       // canonical — matches leads.industry
  monthlySearchDemand: number;
  avgCpcLow: number;
  avgCpcHigh: number;
  topKeywords: { keyword: string; volume: number }[];
  isLowVolume: boolean;   // volume < LOW_VOLUME_THRESHOLD
  filename: string;
}

export interface IngestResult {
  ok: boolean;
  written: number;
  leadsUpdated: number;
  errors: string[];
}

const LOW_VOLUME_THRESHOLD = 1000;

export async function ingestKeywordData(
  rows: ParsedNicheData[]
): Promise<IngestResult> {
  const supabase = await createServerClientWithCookies();
  let written = 0;
  let leadsUpdated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const generalInsights = {
      monthlySearchDemand: row.monthlySearchDemand,
      avgCpcLow: row.avgCpcLow,
      avgCpcHigh: row.avgCpcHigh,
      topKeywords: row.topKeywords,
      isLowVolume: row.isLowVolume,
      updatedAt: new Date().toISOString(),
    };

    // Upsert market_insights row
    const { error: upsertErr } = await (supabase
      .from("market_insights") as any)
      .upsert(
        {
          industry: row.industry,
          city: row.city,
          search_volume: String(row.monthlySearchDemand),
          general_insights: generalInsights,
        },
        { onConflict: "industry,city" }
      );

    if (upsertErr) {
      errors.push(`${row.city}/${row.industry}: ${upsertErr.message}`);
      continue;
    }
    written++;

    // Update leads for this niche×city
    if (row.isLowVolume) {
      // Low-volume: set D (overrides A/B/C)
      const { error: leadsErr, count } = await supabase
        .from("leads")
        .update({ is_low_volume: true, pitch_type: "D" } as any)
        .eq("industry", row.industry)
        .eq("city", row.city);
      if (leadsErr) errors.push(`leads D update ${row.city}/${row.industry}: ${leadsErr.message}`);
      else leadsUpdated += count ?? 0;
    } else {
      // Not low-volume: reset is_low_volume, re-derive A/B/C from presence fields
      // Do it in two passes: clear D flag, then set A/B/C based on serp_ranked/has_website
      const { error: resetErr } = await supabase
        .from("leads")
        .update({ is_low_volume: false } as any)
        .eq("industry", row.industry)
        .eq("city", row.city);
      if (resetErr) {
        errors.push(`leads reset ${row.city}/${row.industry}: ${resetErr.message}`);
        continue;
      }

      // Re-tag A/B/C: fetch leads and update individually (Supabase doesn't support CASE UPDATE)
      const { data: leads, error: fetchErr } = await supabase
        .from("leads")
        .select("id, serp_ranked, has_website")
        .eq("industry", row.industry)
        .eq("city", row.city);

      if (fetchErr) { errors.push(`leads fetch ${row.city}/${row.industry}: ${fetchErr.message}`); continue; }

      // Batch by type to minimize round-trips
      const aIds = (leads || []).filter(l => l.serp_ranked).map(l => l.id);
      const bIds = (leads || []).filter(l => !l.serp_ranked && l.has_website).map(l => l.id);
      const cIds = (leads || []).filter(l => !l.serp_ranked && !l.has_website).map(l => l.id);

      for (const [type, ids] of [["A", aIds], ["B", bIds], ["C", cIds]] as const) {
        if (ids.length === 0) continue;
        const { error: tagErr, count: c } = await supabase
          .from("leads")
          .update({ pitch_type: type } as any)
          .in("id", ids as string[]);
        if (tagErr) errors.push(`leads ${type} tag ${row.city}/${row.industry}: ${tagErr.message}`);
        else leadsUpdated += c ?? 0;
      }
    }
  }

  return { ok: errors.length === 0, written, leadsUpdated, errors };
}
