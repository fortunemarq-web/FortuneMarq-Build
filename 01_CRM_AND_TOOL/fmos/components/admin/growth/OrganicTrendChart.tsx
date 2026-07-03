import { createServerClientWithCookies } from "@/lib/supabase-server";
import OrganicTrendChartClient from "./OrganicTrendChartClient";
import { TrendingUp } from "lucide-react";

/**
 * Growth trend across organic channels.
 * Pulls real monthly data from gmb_snapshots (manual entry) and
 * organic_traffic_snapshots (GSC/GA — when connected). Shows an honest
 * "not connected" state until there is real data to plot.
 */
export default async function OrganicTrendChart() {
  const supabase = await createServerClientWithCookies();

  const [{ data: gmb }, { data: traffic }] = await Promise.all([
    supabase
      .from("gmb_snapshots")
      .select("snapshot_month, profile_views")
      .order("snapshot_month", { ascending: true })
      .limit(12),
    supabase
      .from("organic_traffic_snapshots")
      .select("snapshot_date, organic_sessions")
      .order("snapshot_date", { ascending: true })
      .limit(180),
  ]);

  // Build a month-keyed series merging the two real sources.
  const byMonth: Record<string, { month: string; gmb: number; website: number }> = {};
  ((gmb as any[]) || []).forEach((g) => {
    const m = (g.snapshot_month || "").slice(0, 7);
    if (!m) return;
    byMonth[m] ??= { month: m, gmb: 0, website: 0 };
    byMonth[m].gmb += Number(g.profile_views || 0);
  });
  ((traffic as any[]) || []).forEach((t) => {
    const m = (t.snapshot_date || "").slice(0, 7);
    if (!m) return;
    byMonth[m] ??= { month: m, gmb: 0, website: 0 };
    byMonth[m].website += Number(t.organic_sessions || 0);
  });

  const series = Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({
      label: new Date(r.month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      gmb: r.gmb,
      website: r.website,
    }));

  if (series.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-6">
          Growth Trend
        </h3>
        <div className="h-[300px] w-full flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 rounded-xl">
          <TrendingUp className="h-8 w-8 text-slate-700" />
          <p className="text-slate-500 text-sm font-semibold">No organic trend data yet</p>
          <p className="text-slate-400 text-xs text-center max-w-xs">
            Enter monthly GMB metrics on the GMB page, or connect Google Search Console,
            to see real organic growth here.
          </p>
        </div>
      </div>
    );
  }

  return <OrganicTrendChartClient series={series} />;
}
