import { createServerClientWithCookies } from "@/lib/supabase-server";
import TelecallerCockpit from "@/components/sales/telecaller-cockpit";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

export default async function SalesPage() {
  const supabase = await createServerClientWithCookies();

  // Get the current user first
  const userResult = await supabase.auth.getUser();
  const user = userResult.data?.user;

  // ── ALL ROLES: TelecallerCockpit ──────────────────────────────
  {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = today + "T00:00:00";

    // Page through ALL active leads. Supabase caps each request at 1000 rows,
    // so a single .limit() truncated the dataset (the niche/city filters + queue
    // only saw the first cities). Loop with .range() until a short page returns.
    const LEAD_COLS = "id, company_name, contact_person, phone, industry, city, status, notes, lead_type, pitch_type, is_low_volume, has_website, serp_ranked, follow_up_date, last_outcome, tags, no_answer_count, gatekeeper_count, first_contact_at, outreach_stage, lead_source, captured_at";
    const leadRows: any[] = [];
    for (let from = 0; from < 50000; from += 1000) {
      const { data, error } = await supabase
        .from("leads")
        .select(LEAD_COLS)
        .or("status.is.null,status.not.in.(closed_won,closed_lost,disqualified)")
        .order("follow_up_date", { ascending: true, nullsFirst: true })
        .range(from, from + 999);
      if (error) break;
      leadRows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }

    const [callsTodayResult, pdfsTodayResult, meetingsTodayResult, marketInsightsResult] = await Promise.all([
      // Calls logged today — the cockpit logs call outcomes to outreach_logs
      // (touch_type 'call'), not lead_outcomes.
      supabase
        .from("outreach_logs")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user?.id || "")
        .eq("touch_type", "call")
        .gte("created_at", todayStart),

      // PDFs sent today
      supabase
        .from("outreach_logs")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user?.id || "")
        .eq("touch_type", "pdf_sent")
        .gte("created_at", todayStart),

      // Meetings booked today — logOutcome stamps meeting_booked_at, not last_contacted_at.
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("outreach_stage", "meeting_booked")
        .gte("meeting_booked_at", todayStart),

      // Market insights — for search volume lookup by niche+city
      supabase
        .from("market_insights")
        .select("industry, city, search_volume"),
    ]);

    // Spread ALL selected columns through — the cockpit relies on pitch_type,
    // is_low_volume, gatekeeper_count, first_contact_at, captured_at and
    // lead_source (a hand-written map previously dropped them silently).
    const leads = leadRows.map((l: any) => ({
      ...l,
      tags: l.tags || [],
      no_answer_count: l.no_answer_count || 0,
      gatekeeper_count: l.gatekeeper_count || 0,
      outreach_stage: l.outreach_stage || null,
    }));

    // Filter options derived from the COMPLETE (paged) lead set
    const allNiches = Array.from(new Set(
      leads.map((l: any) => l.industry).filter(Boolean)
    )).sort() as string[];

    const allCities = Array.from(new Set(
      leads.map((l: any) => l.city).filter(Boolean)
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
