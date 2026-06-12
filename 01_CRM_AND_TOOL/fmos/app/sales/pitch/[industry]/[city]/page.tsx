import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarketInsightCard from "@/components/sales/market-insight-card";
import LeadsList from "@/components/sales/leads-list";

interface PitchPageProps {
  params: Promise<{
    industry: string;
    city: string;
  }>;
}

export default async function PitchPage({ params }: PitchPageProps) {
  const { industry, city } = await params;
  const decodedIndustry = decodeURIComponent(industry);
  const decodedCity = decodeURIComponent(city);

  const supabase = await createServerClientWithCookies();

  // Fetch market insights for this industry/city
  const { data: marketInsight } = await supabase
    .from("market_insights")
    .select("*")
    .eq("industry", decodedIndustry)
    .eq("city", decodedCity)
    .single();

  // Fetch leads for this industry/city
  // For now, fetch all leads (will filter by status later)
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("industry", decodedIndustry)
    .eq("city", decodedCity)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
            {decodedIndustry} in {decodedCity}
          </h1>
          {leads && (
            <p className="mt-2 text-sm text-slate-500 md:text-base">
              {leads.length} Lead{leads.length !== 1 ? "s" : ""} to call
            </p>
          )}
        </div>

        {/* Market Insight Card */}
        <div className="mb-6">
          <MarketInsightCard
            industry={decodedIndustry}
            city={decodedCity}
            data={marketInsight || null}
          />
        </div>

        {/* Leads List */}
        <LeadsList
          initialLeads={leads || []}
          industry={decodedIndustry}
          city={decodedCity}
          leadsError={leadsError}
        />
      </div>
    </div>
  );
}

