import { createServerClientWithCookies } from "@/lib/supabase-server";
import SalesPageClient from "./sales-page-client";
import TelecallerCockpit from "@/components/sales/telecaller-cockpit";

// Phase B2: Role-based routing.
// - admin → full SalesIntelligenceCockpit (existing)
// - telecaller → simplified TelecallerCockpit with real scripts + outcome logger

export const revalidate = 30;

export default async function SalesPage() {
  const supabase = await createServerClientWithCookies();

  // Get the current user first
  const userResult = await supabase.auth.getUser();
  const user = userResult.data?.user;

  // Then get their profile by ID to ensure correct role detection
  const profileResult = user?.id
    ? await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
    : { data: null };

  const userRole = (profileResult.data as any)?.role || null;

  // ── TELECALLER VIEW ──────────────────────────────────────────
  if (userRole === "telecaller" || userRole === "sales_executive") {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = today + "T00:00:00";

    const [leadsResult, callsTodayResult, pdfsTodayResult, meetingsTodayResult, allNichesResult, allCitiesResult, marketInsightsResult] = await Promise.all([
      // All active leads — no limit so niche/city filters see the full dataset
      supabase
        .from("leads")
        .select("id, company_name, contact_person, phone, industry, city, status, notes, lead_type, has_website, serp_ranked, follow_up_date, last_outcome, tags")
        .not("status", "in", '("closed_won","closed_lost","disqualified")')
        .order("follow_up_date", { ascending: true, nullsFirst: true })
        .limit(2000),

      // Calls logged today
      supabase
        .from("lead_outcomes")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user?.id || "")
        .gte("created_at", todayStart),

      // PDFs sent today
      supabase
        .from("outreach_logs" as any)
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user?.id || "")
        .eq("touch_type", "pdf_sent")
        .gte("created_at", todayStart),

      // Meetings booked today
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "meeting_booked")
        .gte("updated_at", todayStart),

      // All distinct niches across entire leads table (for filter dropdown)
      supabase
        .from("leads")
        .select("industry")
        .not("industry", "is", null),

      // All distinct cities across entire leads table (for filter dropdown)
      supabase
        .from("leads")
        .select("city")
        .not("city", "is", null),

      // Market insights — for search volume lookup by niche+city
      supabase
        .from("market_insights")
        .select("industry, city, search_volume"),
    ]);

    const leads = (leadsResult.data || []).map((l: any) => ({
      id: l.id,
      company_name: l.company_name,
      contact_person: l.contact_person,
      phone: l.phone,
      industry: l.industry,
      city: l.city,
      status: l.status,
      notes: l.notes,
      lead_type: l.lead_type,
      has_website: l.has_website,
      serp_ranked: l.serp_ranked,
      follow_up_date: l.follow_up_date,
      last_outcome: l.last_outcome,
      tags: l.tags || [],
    }));

    const allNiches = Array.from(new Set(
      (allNichesResult.data || []).map((r: any) => r.industry).filter(Boolean)
    )).sort() as string[];

    const allCities = Array.from(new Set(
      (allCitiesResult.data || []).map((r: any) => r.city).filter(Boolean)
    )).sort() as string[];

    // Build niche+city → search_volume lookup map
    const searchVolumeMap: Record<string, string> = {};
    for (const mi of (marketInsightsResult.data || [])) {
      if (mi.industry && mi.city && mi.search_volume != null) {
        const key = `${mi.industry}__${mi.city}`.toLowerCase();
        searchVolumeMap[key] = mi.search_volume.toLocaleString();
      }
    }

    return (
      <TelecallerCockpit
        leads={leads}
        userId={user?.id || null}
        allNiches={allNiches}
        allCities={allCities}
        searchVolumeMap={searchVolumeMap}
        dailyStats={{
          callsToday: callsTodayResult.count || 0,
          pdfsSentToday: pdfsTodayResult.count || 0,
          meetingsBookedToday: meetingsTodayResult.count || 0,
          followupsLoggedToday: callsTodayResult.count || 0,
        }}
      />
    );
  }

  // ── ADMIN / MANAGER VIEW (existing Sales Cockpit) ────────────
  const [leadsResult, marketInsightsResult, followUpsResult, callsYesterdayResult, priorityQueueResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .not("status", "eq", "closed_won")
      .not("status", "eq", "closed_lost")
      .not("status", "eq", "qualified")
      .not("status", "eq", "disqualified")
      .not("status", "eq", "strategy_booked"),
    supabase.from("market_insights").select("*"),
    supabase.from("follow_ups" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("lead_outcomes").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("outreach_sequences")
      .select("*, lead:leads(id,company_name,contact_person,phone,industry,city)")
      .in("stage", ["followup_due", "meeting_booked"])
      .order("updated_at", { ascending: true })
      .limit(10),
  ]);

  if (leadsResult.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading leads: {leadsResult.error.message}</p>
        </div>
      </div>
    );
  }

  const leads = leadsResult.data ?? [];
  const marketInsights = marketInsightsResult.data ?? [];
  const followUpCount = followUpsResult.count ?? 0;
  const callsYesterday = callsYesterdayResult.count ?? 0;
  const warmLeads = leads
    .filter((l: any) => l.status === "qualified" || l.status === "interested")
    .slice(0, 3)
    .map((l: any) => ({ name: l.company_name || "Company", niche: l.industry || "Niche" }));

  const processedLeads = leads.map((lead: any) => ({
    id: lead.id,
    company_name: lead.company_name,
    contact_person: lead.contact_person,
    phone: lead.phone,
    email: lead.email,
    industry: lead.industry,
    city: lead.city,
    status: lead.status,
    notes: lead.notes,
    next_action_date: lead.next_action_date,
    created_at: lead.created_at,
    lead_type: lead.lead_type || "outbound",
    source: lead.source || null,
    has_website: lead.has_website,
    website_link: lead.website_link,
    attempts: lead.attempts || 0,
    tags: lead.tags || [],
    serp_ranked: lead.serp_ranked,
    serp_source: lead.serp_source,
    gmb_link: lead.gmb_link,
    last_contacted_at: lead.last_contacted_at,
    last_outcome: lead.last_outcome || null,
  }));

  const processedMarketInsights = (marketInsights as any[]).map((mi: any) => ({
    id: mi.id,
    industry: mi.industry,
    city: mi.city,
    search_volume: mi.search_volume,
    market_difficulty: mi.market_difficulty,
    top_competitors: mi.top_competitors,
    pitch_angle: mi.pitch_angle,
  }));

  const newInboundCount = processedLeads.filter(
    (l) => l.lead_type === "inbound" && (l.status === "new" || !l.status)
  ).length;

  const priorityQueue = priorityQueueResult.data ?? [];

  return (
    <SalesPageClient
      initialLeads={processedLeads}
      initialMarketInsights={processedMarketInsights}
      userId={user?.id || null}
      userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Champion"}
      newInboundCount={newInboundCount}
      priorityQueue={priorityQueue}
      briefStats={{
        followUpCount,
        freshLeadCount: processedLeads.filter((l) => l.status === "new" || !l.status).length,
        warmLeads,
        callsYesterday,
        bestNiche: processedLeads[0]?.industry || "Various",
      }}
    />
  );
}
