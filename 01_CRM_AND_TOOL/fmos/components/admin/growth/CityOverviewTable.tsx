import Link from "next/link";
import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowRight } from "lucide-react";
import AddCityModal from "@/components/admin/growth/add-city-modal";

const CLOSED_STAGES = ["won", "lost", "dead", "not_interested"];

export default async function CityOverviewTable() {
  const targets = await fetchAcquisitionTargets();

  // Real per-city lead counts (no fabricated numbers)
  const supabase = await createServerClientWithCookies();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: leads } = await supabase
    .from("leads")
    .select("city, outreach_stage, meeting_booked_at, last_activity_at");

  const leadStats: Record<string, { total: number; pipeline: number; meetings_mtd: number; won_mtd: number }> = {};
  (leads || []).forEach((l: any) => {
    const key = (l.city || "").trim().toLowerCase();
    if (!key) return;
    if (!leadStats[key]) leadStats[key] = { total: 0, pipeline: 0, meetings_mtd: 0, won_mtd: 0 };
    leadStats[key].total++;
    if (!CLOSED_STAGES.includes(l.outreach_stage || "")) leadStats[key].pipeline++;
    if (l.meeting_booked_at && l.meeting_booked_at >= monthStart) leadStats[key].meetings_mtd++;
    if (l.outreach_stage === "won" && l.last_activity_at && l.last_activity_at >= monthStart) leadStats[key].won_mtd++;
  });

  // Group acquisition targets by city
  const cityGroups = targets.reduce((acc: any, t) => {
    if (!acc[t.city]) {
      const stats = leadStats[(t.city || "").trim().toLowerCase()] || { total: 0, pipeline: 0, meetings_mtd: 0, won_mtd: 0 };
      acc[t.city] = {
        city: t.city,
        city_slug: t.city_slug,
        active_niches: 0,
        total_leads: stats.total,
        in_pipeline: stats.pipeline,
        meetings_mtd: stats.meetings_mtd,
        won_mtd: stats.won_mtd,
      };
    }
    if (t.is_active) acc[t.city].active_niches++;
    return acc;
  }, {});

  const rows = Object.values(cityGroups);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
          City Overview
        </h3>
        <AddCityModal />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">City</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Niches</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Leads</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">In Pipeline</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Meetings (MTD)</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Won (MTD)</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r: any) => (
              <tr key={r.city} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/admin/growth/acquisition/${r.city_slug}`} className="text-sm font-bold text-slate-900 hover:text-[#42CA80] flex items-center gap-2">
                    {r.city}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {r.active_niches} niches
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{r.total_leads}</td>
                <td className="px-6 py-4 text-sm font-semibold text-amber-600">{r.in_pipeline}</td>
                <td className="px-6 py-4 text-sm font-semibold text-blue-600">{r.meetings_mtd}</td>
                <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{r.won_mtd}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/growth/acquisition/${r.city_slug}`} className="inline-flex items-center text-xs font-bold text-[#42CA80] hover:text-[#38b571]">
                    Manage <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">
                  No cities found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
