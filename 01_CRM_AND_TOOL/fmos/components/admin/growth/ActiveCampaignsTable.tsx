import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { Copy, Plus, Activity, PauseCircle } from "lucide-react";

export default async function ActiveCampaignsTable() {
  const supabase = await createServerClientWithCookies();
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .order("status", { ascending: true }); // Active first if status is 'active'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
          Active Campaigns
        </h3>
        <Link 
          href="/admin/marketing"
          className="text-xs font-semibold text-[#42CA80] hover:text-[#38b571] transition-colors"
        >
          View All in Marketing &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Campaign Name</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Spend (MTD)</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Leads</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">CPL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {!campaigns || campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                  No campaigns active right now.
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">
                      {c.campaign_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                      {c.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        <Activity className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        <PauseCircle className="h-3 w-3" /> Paused
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-semibold text-slate-700">
                      ₹{c.spend_mtd?.toLocaleString("en-IN") || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">
                      {c.leads_generated || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-bold text-[#42CA80]">
                      ₹{c.cpl?.toLocaleString("en-IN") || 0}
                    </span>
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
