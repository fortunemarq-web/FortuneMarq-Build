import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, Target, Plus, MapPin } from "lucide-react";
import NicheAccordion from "@/components/admin/growth/NicheAccordion";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

export const metadata = {
  title: "City Acquisition — FortuneMarq",
};

export default async function CityAcquisitionPage({ params }: { params: Promise<{ city: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.city;

  const targets = await fetchAcquisitionTargets();
  const cityTargets = targets.filter(t => t.city_slug === slug);
  const cityLabel = cityTargets.length > 0 ? cityTargets[0].city : slug;

  const supabase = await createServerClientWithCookies();
  // Fetch active campaigns targeting this city
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("status", "active")
    .ilike("campaign_name", `%${cityLabel}%`); // Very simplified matching for demo

  // Global aggregate stats
  const activeNichesCount = cityTargets.filter(t => t.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <Link href="/admin/growth?tab=acquisition" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900 text-white shadow-sm">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 capitalize">{cityLabel}</h1>
                <p className="text-sm text-slate-500 mt-1">Niche-by-niche acquisition pipeline</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-slate-900 mr-1">{activeNichesCount}</span> Active Niches
              </span>
              <button className="flex items-center gap-1.5 rounded-lg bg-[#42CA80] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#38b571] transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Niche
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Niche Breakdown */}
        <section>
          {cityTargets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <Target className="h-12 w-12 text-slate-200 mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">No Niches Found</h2>
              <p className="text-sm text-slate-500 max-w-sm mb-6">You haven't added any target niches for {cityLabel} yet. Start expanding your reach!</p>
              <button className="flex items-center gap-2 rounded-lg bg-[#42CA80] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#38b571] transition-colors">
                <Plus className="h-4 w-4" /> Add First Niche
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cityTargets.map(target => {
                // Determine which campaigns belong to this niche
                const nicheCampaigns = (campaigns ?? []).filter((c) => 
                  c.campaign_name.toLowerCase().includes(target.niche.toLowerCase().split(' ')[0])
                );
                return <NicheAccordion key={target.id} target={target} campaigns={nicheCampaigns} />;
              })}
            </div>
          )}
        </section>

        {/* Section 2: Strategy Input */}
        <StrategyInputPanel />

      </div>
    </div>
  );
}
