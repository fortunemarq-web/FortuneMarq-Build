import { createServerClientWithCookies } from "@/lib/supabase-server";
import TelecallerCockpit from "@/components/sales/telecaller-cockpit";

export const revalidate = 30;

export default async function SalesPage() {
  const supabase = await createServerClientWithCookies();

  // Get the current user first
  const userResult = await supabase.auth.getUser();
  const user = userResult.data?.user;

  // ── ALL ROLES: TelecallerCockpit ──────────────────────────────
  {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = today + "T00:00:00";

    const [leadsResult, callsTodayResult, pdfsTodayResult, meetingsTodayResult, allNichesResult, allCitiesResult, marketInsightsResult] = await Promise.all([
      // All active leads — no limit so niche/city filters see the full dataset
      supabase
        .from("leads")
        .select("id, company_name, contact_person, phone, industry, city, status, notes, lead_type, has_website, serp_ranked, follow_up_date, last_outcome, tags, no_answer_count, outreach_stage, lead_source, captured_at")
        .or("status.is.null,status.not.in.(closed_won,closed_lost,disqualified)")
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
        .from("outreach_logs")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user?.id || "")
        .eq("touch_type", "pdf_sent")
        .gte("created_at", todayStart),

      // Meetings booked today
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("outreach_stage", "meeting_booked")
        .gte("last_contacted_at", todayStart),

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
      no_answer_count: l.no_answer_count || 0,
      outreach_stage: l.outreach_stage || null,
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
}
