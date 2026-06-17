// LP data layer (Stage 2.1 + 2.2).
//
// Merges the curated niche registry with the LIVE market_insights row (the
// same record that powers the report PDFs) and computes the labelled,
// illustrative "Projected for you" figures. Server-only.

import { createAdminClient } from "@/lib/supabase-admin";
import type { NicheConfig } from "@/lib/lp/niches";

// Default CTR-benchmark traffic split across the 4 SERP buckets when a niche
// has not been SERP-scanned yet (decided default: 35/30/20/15).
const DEFAULT_SPLIT = { gmb: 35, directories: 30, realSites: 20, socialOther: 15 };

// Conservative projection assumptions (clearly labelled illustrative).
// Tunable in one place. We deliberately under-promise.
const PROJECTION = {
  captureShare: 0.15, // realistic reachable share of monthly searches with GMB + ads + SEO
  clickThrough: 0.45, // of reached searchers who click through to the business
  conversion: 0.08, // of clickers who become an enquiry/booking
};

export interface SerpSplit {
  gmb: number;
  directories: number;
  realSites: number;
  socialOther: number;
}

export interface Projection {
  reachableSearches: number;
  monthlyVisitors: number;
  monthlyEnquiries: number;
}

export interface LpData {
  niche: NicheConfig;
  // live numbers
  monthlySearches: number;
  topKeywords: { keyword: string; volume: number }[];
  split: SerpSplit;
  /** searches/month leaking to directories — the headline FOMO number */
  directoryLeakage: number;
  /** true if this niche×city has a real market_insights row backing it */
  isLive: boolean;
  projection: Projection;
}

function nf(n: number): number {
  return Math.max(0, Math.round(n));
}

export async function getLpData(niche: NicheConfig): Promise<LpData> {
  let monthlySearches = niche.monthlySearches;
  let topKeywords = niche.topKeywords;
  let split: SerpSplit = { ...DEFAULT_SPLIT };
  let isLive = false;

  try {
    const supabase = createAdminClient() as any;
    const { data: mi } = await supabase
      .from("market_insights")
      .select("search_volume, general_insights, competitor_insights")
      .eq("industry", niche.industry)
      .eq("city", niche.city)
      .maybeSingle();

    if (mi) {
      isLive = true;
      const gi = mi.general_insights ?? {};
      const ci = mi.competitor_insights ?? {};

      const giVol = Number(gi?.monthlySearchDemand);
      const rawVol = parseInt(String(mi.search_volume ?? "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(giVol) && giVol > 0) monthlySearches = giVol;
      else if (Number.isFinite(rawVol) && rawVol > 0) monthlySearches = rawVol;

      if (Array.isArray(gi?.topKeywords) && gi.topKeywords.length) {
        topKeywords = gi.topKeywords;
      }

      const b = ci?.buckets;
      if (b && typeof b.directories === "number") {
        split = {
          gmb: b.gmb ?? DEFAULT_SPLIT.gmb,
          directories: b.directories ?? DEFAULT_SPLIT.directories,
          realSites: b.realSites ?? DEFAULT_SPLIT.realSites,
          socialOther: b.socialOther ?? DEFAULT_SPLIT.socialOther,
        };
      }
    }
  } catch {
    // fall back to registry numbers — LP must always render
  }

  const directoryLeakage = nf((monthlySearches * split.directories) / 100);

  const reachableSearches = nf(monthlySearches * PROJECTION.captureShare);
  const monthlyVisitors = nf(reachableSearches * PROJECTION.clickThrough);
  const monthlyEnquiries = nf(monthlyVisitors * PROJECTION.conversion);

  return {
    niche,
    monthlySearches,
    topKeywords,
    split,
    directoryLeakage,
    isLive,
    projection: { reachableSearches, monthlyVisitors, monthlyEnquiries },
  };
}

/** Indian-style grouping (1,23,456) for display. */
export function inFormat(n: number): string {
  return n.toLocaleString("en-IN");
}
