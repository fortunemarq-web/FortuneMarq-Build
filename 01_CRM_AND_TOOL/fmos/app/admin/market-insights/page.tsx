import { createServerClientWithCookies } from "@/lib/supabase-server";
import { BarChart2 } from "lucide-react";
import KeywordIngestClient from "./keyword-ingest-client";

export const metadata = {
  title: "Market Insights | FortuneMarq Admin",
  description: "Keyword Planner CSV ingest — writes market_insights and re-tags leads.",
};

export default async function MarketInsightsPage() {
  const supabase = await createServerClientWithCookies();

  const { data: existing } = await (supabase.from("market_insights") as any)
    .select("industry, city, search_volume, general_insights")
    .order("city")
    .order("industry");

  const rows = (existing || []) as {
    industry: string;
    city: string;
    search_volume: string | null;
    general_insights: { monthlySearchDemand?: number; topKeywords?: unknown[]; updatedAt?: string } | null;
  }[];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">

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

        {/* Existing data table */}
        {rows.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Stored insights ({rows.length} niche × city)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">City</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Industry</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Vol / mo</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Type</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Keywords</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(r => {
                    const vol = r.general_insights?.monthlySearchDemand ?? Number(r.search_volume ?? 0);
                    const kwCount = r.general_insights?.topKeywords?.length ?? 0;
                    const isLow = vol > 0 && vol < 1000;
                    const updatedAt = r.general_insights?.updatedAt;
                    return (
                      <tr key={`${r.city}-${r.industry}`} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-800">{r.city}</td>
                        <td className="px-4 py-2 text-slate-600">{r.industry}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{vol.toLocaleString()}</td>
                        <td className="px-4 py-2 text-center">
                          {isLow
                            ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">D</span>
                            : <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">A/B/C</span>
                          }
                        </td>
                        <td className="px-4 py-2 text-center text-slate-500">{kwCount}</td>
                        <td className="px-4 py-2 text-right text-xs text-slate-400">
                          {updatedAt ? new Date(updatedAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
