import Link from "next/link";
import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { Plus, ArrowRight } from "lucide-react";

export default async function CityOverviewTable() {
  const targets = await fetchAcquisitionTargets();
  
  // Group by city
  const cityGroups = targets.reduce((acc: any, t) => {
    if (!acc[t.city]) {
      acc[t.city] = {
        city: t.city,
        city_slug: t.city_slug,
        active_niches: 0,
        total_leads: 0, // Mocked for now, in real app query leads table
        in_pipeline: 0,
        demos_this_month: 0,
        closed_this_month: 0,
        campaigns_active: 0
      };
    }
    if (t.is_active) acc[t.city].active_niches++;
    
    // Some placeholder aggregated stats
    acc[t.city].total_leads += Math.floor(Math.random() * 50) + 20;
    acc[t.city].in_pipeline += Math.floor(Math.random() * 10) + 2;
    acc[t.city].campaigns_active += Math.floor(Math.random() * 3);
    
    return acc;
  }, {});
  
  const rows = Object.values(cityGroups);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
          City Overview
        </h3>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#42CA80] hover:text-[#42CA80] transition-all min-h-[36px]">
          <Plus className="h-3 w-3" />
          Add City
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">City</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Niches</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Leads</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">In Pipeline</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Demos (MTD)</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Closed (MTD)</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Campaigns</th>
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
                <td className="px-6 py-4 text-sm font-semibold text-blue-600">{r.demos_this_month}</td>
                <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{r.closed_this_month}</td>
                <td className="px-6 py-4 text-sm font-semibold text-purple-600">{r.campaigns_active}</td>
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
