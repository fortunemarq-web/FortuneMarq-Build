import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, Target, Plus, MapPin } from "lucide-react";
import NicheAccordion from "@/components/admin/growth/NicheAccordion";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";
import AddCityModal from "@/components/admin/growth/add-city-modal";

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

  // Real per-niche pipeline counts from leads (city + industry match)
  const { data: cityLeads } = await supabase
    .from("leads")
    .select("industry, outreach_stage")
    .ilike("city", cityLabel);

  const ENGAGED = ["no_answer", "follow_back", "curiosity_sent", "pdf_sent", "follow_up_due", "gatekeeper"];
  const nichePipelines: Record<string, { new: number; engaged: number; meeting: number; proposal: number; won: number }> = {};
  (cityLeads || []).forEach((l: any) => {
    const niche = (l.industry || "").trim().toLowerCase();
    if (!niche) return;
    if (!nichePipelines[niche]) nichePipelines[niche] = { new: 0, engaged: 0, meeting: 0, proposal: 0, won: 0 };
    const s = l.outreach_stage || "touch1_pending";
    if (s === "touch1_pending") nichePipelines[niche].new++;
    else if (ENGAGED.includes(s)) nichePipelines[niche].engaged++;
    else if (s === "meeting_booked") nichePipelines[niche].meeting++;
    else if (s === "proposal_sent") nichePipelines[niche].proposal++;
    else if (s === "won") nichePipelines[niche].won++;
  });

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
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
              <AddCityModal fixedCity={cityLabel} />
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
              <AddCityModal fixedCity={cityLabel} buttonLabel="Add First Niche" buttonClassName="flex items-center gap-2 rounded-lg bg-brand-deep px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-hover transition-colors" />
            </div>
          ) : (
            <div className="space-y-4">
              {cityTargets.map(target => {
                // Determine which campaigns belong to this niche
                const nicheCampaigns = (campaigns ?? []).filter((c) => 
                  c.campaign_name.toLowerCase().includes(target.niche.toLowerCase().split(' ')[0])
                );
                return (
                  <NicheAccordion
                    key={target.id}
                    target={target}
                    campaigns={nicheCampaigns}
                    pipeline={nichePipelines[(target.niche || "").trim().toLowerCase()]}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Strategy Input */}
        <StrategyInputPanel destination="agency_growth.acquisition" />

      </div>
    </div>
  );
}
