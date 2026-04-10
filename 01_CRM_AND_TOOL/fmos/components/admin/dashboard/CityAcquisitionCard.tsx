import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { MapPin } from "lucide-react";

async function fetchCityData() {
  const supabase = await createServerClientWithCookies();

  // Get lead counts grouped by city
  const { data: leads } = await supabase
    .from("leads")
    .select("city, status")
    .not("city", "is", null);

  const cityMap: Record<
    string,
    { totalLeads: number; inPipeline: number; closedThisMonth: number }
  > = {};

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  for (const lead of (leads ?? []) as any[]) {
    const city = lead.city ?? "Unknown";
    if (!cityMap[city]) {
      cityMap[city] = { totalLeads: 0, inPipeline: 0, closedThisMonth: 0 };
    }
    cityMap[city].totalLeads++;
    if (
      !["closed_won", "closed_lost", "disqualified"].includes(lead.status)
    ) {
      cityMap[city].inPipeline++;
    }
    if (lead.status === "closed_won") {
      cityMap[city].closedThisMonth++;
    }
  }

  // Get active niches per city (from existing data)
  const { data: nicheData } = await supabase
    .from("leads")
    .select("city, industry")
    .not("city", "is", null)
    .not("industry", "is", null);

  const cityNiches: Record<string, Set<string>> = {};
  for (const row of (nicheData ?? []) as any[]) {
    const city = row.city ?? "Unknown";
    if (!cityNiches[city]) cityNiches[city] = new Set();
    if (row.industry) cityNiches[city].add(row.industry);
  }

  return Object.entries(cityMap)
    .map(([city, data]) => ({
      city,
      activeNiches: cityNiches[city]?.size ?? 0,
      ...data,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .slice(0, 5);
}

export default async function CityAcquisitionCard() {
  const cities = await fetchCityData();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          Client Acquisition — Active Cities
        </h2>
        <button
          disabled
          title="Expansion to new cities coming in Phase 3"
          className="text-xs font-medium text-slate-300 border border-slate-200 rounded-lg px-3 py-1.5 cursor-not-allowed"
        >
          + Add City
          <span className="ml-1.5 text-[9px] bg-slate-100 px-1 rounded">Phase 3</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                City
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Niches
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Total Leads
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                In Pipeline
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Closed (Mo)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  No city data yet — import leads to see data here.
                </td>
              </tr>
            ) : (
              cities.map((row) => (
                <tr
                  key={row.city}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/acquisition/${encodeURIComponent(row.city.toLowerCase())}`}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-[#42CA80] transition-colors min-h-[44px]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                        📍
                      </span>
                      {row.city}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-slate-600">
                    {row.activeNiches}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono tabular-nums font-semibold text-slate-800">
                    {row.totalLeads}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-amber-600">
                    {row.inPipeline}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-[#42CA80] font-semibold">
                    {row.closedThisMonth}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
