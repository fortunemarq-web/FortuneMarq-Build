import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  Phone,
  Users,
  TrendingUp,
  ArrowLeft,
  Target,
  Award,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import LeadStatusChart from "@/components/admin/lead-status-chart";
import FunnelChart from "@/components/admin/funnel-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";

interface Lead {
  id: string;
  status: string | null;
  assigned_sales_exec: string | null;
}

interface CallActivity {
  id: string;
  created_by: string | null;
  lead_id: string | null;
  outcome: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default async function SalesPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch data in parallel
  const [leadsResult, callsResult, profilesResult] = await Promise.all([
    supabase.from("leads").select("id, status, assigned_sales_exec"),
    // The cockpit logs call outcomes to outreach_logs (outcome = uppercase IDs like
    // INTERESTED_BOOK), not lead_outcomes.
    supabase.from("outreach_logs").select("id, actor_id, lead_id, outcome, created_at, touch_type"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const leads: Lead[] = leadsResult.data || [];
  const calls: any[] = callsResult.data || [];
  const profiles: Profile[] = profilesResult.data || [];

  // Create lookup maps
  const profilesMap = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "Unknown"]));

  // Calculate metrics
  const totalLeads = leads.length;
  const totalCalls = calls.length;

  // Strategy Sessions Booked (qualified or strategy_booked)
  const strategySessionsBooked = leads.filter(
    (l) => l.status === "qualified" || l.status === "strategy_booked"
  ).length;

  // Conversion Rate: Leads that received at least one call / Total Leads
  const leadsWithCalls = new Set(calls.map((c) => c.lead_id).filter(Boolean));
  const callConversionRate = totalLeads > 0 ? (leadsWithCalls.size / totalLeads) * 100 : 0;

  // Lead Status Distribution
  const leadsByStatus = leads.reduce((acc, l) => {
    const status = l.status || "new";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusOrder = [
    { key: "new", label: "New", color: "#6B7280" },
    { key: "first_call_pending", label: "1st Call Pending", color: "#9CA3AF" },
    { key: "calling", label: "Calling", color: "#60A5FA" },
    { key: "contacted", label: "Contacted", color: "#3B82F6" },
    { key: "qualified", label: "Qualified", color: "#8B5CF6" },
    { key: "strategy_booked", label: "Strategy Booked", color: "#A78BFA" },
    { key: "strategy_completed", label: "Strategy Done", color: "#F59E0B" },
    { key: "nurture", label: "Nurture", color: "#FBBF24" },
    { key: "closed_won", label: "Closed Won", color: "#42CA80" },
    { key: "closed_lost", label: "Closed Lost", color: "#EF4444" },
    { key: "disqualified", label: "Disqualified", color: "#DC2626" },
  ];

  const leadStatusChartData = statusOrder
    .map((s) => ({
      name: s.label,
      value: leadsByStatus[s.key] || 0,
      color: s.color,
    }))
    .filter((item) => item.value > 0);

  // Call Outcomes Funnel — outreach_logs.outcome holds uppercase cockpit IDs.
  const connectedCalls = calls.filter((c) =>
    c.outcome && !["NO_ANSWER", "WRONG_NUMBER", "GATEKEEPER", "LANGUAGE_BARRIER"].includes(c.outcome)
  ).length;
  const interestedCalls = calls.filter((c) =>
    c.outcome && ["INTERESTED_BOOK", "INTERESTED_FOLLOW_UP", "INTERESTED_SEND_INFO"].includes(c.outcome)
  ).length;
  const sessionsBooked = calls.filter((c) =>
    c.outcome === "INTERESTED_BOOK"
  ).length;

  const funnelData = [
    { name: "Total Calls", value: totalCalls, color: "#3B82F6" },
    { name: "Connected", value: connectedCalls, color: "#06B6D4" },
    { name: "Interested", value: interestedCalls, color: "#8B5CF6" },
    { name: "Session Booked", value: sessionsBooked, color: "#42CA80" },
  ];

  // Telecaller Leaderboard with Sessions Booked
  const telecallerStats = new Map<string, { calls: number; converted: number; sessions: number }>();

  // Count calls per user
  calls.forEach((call) => {
    const userId = call.actor_id || "unknown";
    if (!telecallerStats.has(userId)) {
      telecallerStats.set(userId, { calls: 0, converted: 0, sessions: 0 });
    }
    telecallerStats.get(userId)!.calls += 1;
    if (call.outcome === "INTERESTED_BOOK") {
      telecallerStats.get(userId)!.sessions += 1;
    }
  });

  // Count converted leads per assigned_sales_exec
  leads
    .filter((l) => l.status === "closed_won" && l.assigned_sales_exec)
    .forEach((lead) => {
      const userId = lead.assigned_sales_exec!;
      if (!telecallerStats.has(userId)) {
        telecallerStats.set(userId, { calls: 0, converted: 0, sessions: 0 });
      }
      telecallerStats.get(userId)!.converted += 1;
    });

  const telecallerLeaderboard = Array.from(telecallerStats.entries())
    .map(([userId, data]) => ({
      name: profilesMap.get(userId) || userId.slice(0, 8) + "...",
      calls: data.calls,
      converted: data.converted,
      sessions: data.sessions,
    }))
    .sort((a, b) => b.calls - a.calls || b.sessions - a.sessions)
    .slice(0, 10);

  // Phase A: Leaderboard hidden until a manager role is implemented
  // Change to true to re-enable
  const showLeaderboard = false;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Command Hub
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
                <Phone className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
                  Sales Force
                </h1>
                <p className="text-sm text-slate-500">Telecaller performance & lead generation</p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/sales/leads"
            className="rounded-lg bg-[#42CA80] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2"
          >
            Manage Leads
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Leads"
            value={totalLeads.toLocaleString()}
            icon={Users}
            category="volume"
            subtitle="Total in the system"
            className="delay-0"
          />
          <KpiCard
            title="Calls Logged"
            value={totalCalls.toLocaleString()}
            icon={Phone}
            category="volume"
            subtitle="Total call activities"
            className="delay-75"
          />
          <KpiCard
            title="Sessions Booked"
            value={strategySessionsBooked}
            icon={Calendar}
            category="pipeline"
            subtitle="Qualified + booked"
            className="delay-150"
          />
          <KpiCard
            title="Contact Rate"
            value={`${callConversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            category="performance"
            subtitle={`${leadsWithCalls.size} leads contacted`}
            className="delay-300"
          />
        </div>

        {/* Charts & Tables Row */}
        <div className="mb-8 rounded-xl bg-slate-100/60 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Call Outcomes Funnel */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50/50">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Call Outcomes</h2>
                  <p className="text-xs text-slate-500">From calls to sessions booked</p>
                </div>
              </div>
              <FunnelChart data={funnelData} />
            </div>

            {/* Lead Status Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50/50">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Pipeline Breakdown</h2>
                  <p className="text-xs text-slate-500">Current status distribution</p>
                </div>
              </div>
              <LeadStatusChart data={leadStatusChartData} />
            </div>
          </div>
        </div>

        {/* Phase A: Leaderboard gated — showLeaderboard = false until manager role is built */}
        {showLeaderboard && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50/50">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Telecaller Leaderboard</h2>
                  <p className="text-xs text-slate-500">Top performers by call volume &amp; sessions booked</p>
                </div>
              </div>
            </div>

            {telecallerLeaderboard.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-500">No call data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Calls Made
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Sessions Booked
                      </th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Converted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {telecallerLeaderboard.map((person, index) => (
                      <tr key={index} className="transition-colors hover:bg-slate-50/70 duration-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-slate-900 ${index === 0
                                ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                                : index === 1
                                  ? "bg-gradient-to-br from-gray-300 to-gray-400"
                                  : index === 2
                                    ? "bg-gradient-to-br from-amber-600 to-amber-700"
                                    : "bg-white"
                                }`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium text-slate-900">{person.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-slate-900">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {person.calls}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 font-mono text-sm font-semibold tabular-nums text-purple-600">
                            <Calendar className="h-3 w-3" />
                            {person.sessions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-emerald-50 px-2 py-1 font-mono text-sm font-semibold tabular-nums text-emerald-600">
                            {person.converted}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
