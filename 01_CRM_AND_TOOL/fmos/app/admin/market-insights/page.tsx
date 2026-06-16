import { createServerClientWithCookies } from "@/lib/supabase-server";
import { BarChart2 } from "lucide-react";
import KeywordIngestClient from "./keyword-ingest-client";
import SerpScanClient from "./serp-scan-client";
import type { SerpCompetitorInsight } from "@/actions/serp-scan";

export const metadata = {
  title: "Market Insights | FortuneMarq Admin",
  description: "Keyword Planner CSV ingest — writes market_insights and re-tags leads.",
};

export default async function MarketInsightsPage() {
  const supabase = await createServerClientWithCookies();

  const { data: existing } = await (supabase.from("market_insights") as any)
    .select("industry, city, search_volume, general_insights, competitor_insights")
    .order("city")
    .order("industry");

  const rows = (existing || []) as {
    industry: string;
    city: string;
    search_volume: string | null;
    general_insights: { monthlySearchDemand?: number; topKeywords?: unknown[]; updatedAt?: string } | null;
    competitor_insights: SerpCompetitorInsight | null;
  }[];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-brand-deep text-white shadow-sm">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Market Insights</h1>
            <p className="text-slate-500 text-sm">
              Upload Google Keyword Planner CSVs — one per niche × city. Writes{" "}
              <code className="text-xs bg-slate-100 px-1 rounded">market_insights</code> and re-tags{" "}
              <code className="text-xs bg-slate-100 px-1 rounded">leads.pitch_type</code>.
              Run SERP scan per row to classify competitor landscape.
            </p>
          </div>
        </div>

        {/* Ingest widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
            Ingest keyword CSVs
          </h2>
          <KeywordIngestClient />
        </div>

        {/* Stored insights table */}
        {rows.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Stored insights ({rows.length} niche × city)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a row to expand SERP details. "Scan SERP" fetches live Google results and classifies the competitor landscape.
              </p>
            </div>
            <SerpScanClient rows={rows} />
          </div>
        )}

        {rows.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No market insights yet — upload CSVs above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
