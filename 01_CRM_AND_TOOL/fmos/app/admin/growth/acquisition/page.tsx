import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import Link from "next/link";
import { ArrowLeft, Target, Settings, Filter } from "lucide-react";
import CityOverviewTable from "@/components/admin/growth/CityOverviewTable";
import ActiveCampaignsTable from "@/components/admin/growth/ActiveCampaignsTable";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

export const metadata = {
  title: "Client Acquisition — FortuneMarq",
};

export default async function AcquisitionOverviewPage() {
  const targets = await fetchAcquisitionTargets();
  
  // Aggregate stats
  const totalCities = new Set(targets.map(t => t.city)).size;
  const activeNiches = targets.filter(t => t.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <Link href="/admin/growth" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#42CA80] text-white shadow-sm">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Acquisition</h1>
                <p className="text-sm text-slate-500 mt-1">Multi-city, multi-niche expansion tracker.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Markets</span>
                <span className="text-lg font-bold text-slate-900">{totalCities} Cities</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Active Niches</span>
                <span className="text-lg font-bold text-slate-900">{activeNiches} Running</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: City Overview List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Geographic Markets</h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
                <Filter className="h-3.5 w-3.5" /> Filter
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
                <Settings className="h-3.5 w-3.5" /> Table Settings
              </button>
            </div>
          </div>
          <CityOverviewTable />
        </section>

        {/* Section 2: Active Growth Campaigns */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Active Ad Campaigns</h2>
            <p className="text-sm text-slate-500">Cross-niche paid acquisition</p>
          </div>
          <ActiveCampaignsTable />
        </section>

        {/* Section 3: Strategy & AI */}
        <StrategyInputPanel />

      </div>
    </div>
  );
}
