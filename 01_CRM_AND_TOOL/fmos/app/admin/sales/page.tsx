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
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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

  // Chart colors (Recharts consumes literal hex): brand green for won, semantic
  // mapping (slate/blue/amber/red) for everything else, never Tailwind classes.
  const statusOrder = [
    { key: "new", label: "New", color: "#64748b" },
    { key: "first_call_pending", label: "1st Call Pending", color: "#94a3b8" },
    { key: "calling", label: "Calling", color: "#3b82f6" },
    { key: "contacted", label: "Contacted", color: "#3b82f6" },
    { key: "qualified", label: "Qualified", color: "#64748b" },
    { key: "strategy_booked", label: "Strategy Booked", color: "#64748b" },
    { key: "strategy_completed", label: "Strategy Done", color: "#f59e0b" },
    { key: "nurture", label: "Nurture", color: "#f59e0b" },
    { key: "closed_won", label: "Closed Won", color: "#42CA80" },
    { key: "closed_lost", label: "Closed Lost", color: "#ef4444" },
    { key: "disqualified", label: "Disqualified", color: "#ef4444" },
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
    { name: "Total Calls", value: totalCalls, color: "#3b82f6" },
    { name: "Connected", value: connectedCalls, color: "#64748b" },
    { name: "Interested", value: interestedCalls, color: "#f59e0b" },
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
    <div className="min-h-full bg-canvas px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Hub
          </Link>
          <PageHeader
            title="Sales Force"
            subtitle="Telecaller performance & lead generation"
            actions={
              <Link href="/admin/sales/leads" className={buttonVariants({ variant: "primary" })}>
                Manage Leads
              </Link>
            }
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Leads"
            value={totalLeads.toLocaleString()}
            icon={Users}
            hint="Total in the system"
          />
          <StatCard
            label="Calls Logged"
            value={totalCalls.toLocaleString()}
            icon={Phone}
            hint="Total call activities"
          />
          <StatCard
            label="Sessions Booked"
            value={strategySessionsBooked}
            icon={Calendar}
            hint="Qualified + booked"
          />
          <StatCard
            label="Contact Rate"
            value={`${callConversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            hint={`${leadsWithCalls.size} leads contacted`}
          />
        </div>

        {/* Charts & Tables Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Call Outcomes Funnel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                  <TrendingUp className="h-5 w-5 text-brand-deep" />
                </div>
                <div>
                  <CardTitle>Call Outcomes</CardTitle>
                  <p className="text-xs text-slate-500">From calls to sessions booked</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnelData} />
            </CardContent>
          </Card>

          {/* Lead Status Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                  <Target className="h-5 w-5 text-brand-deep" />
                </div>
                <div>
                  <CardTitle>Pipeline Breakdown</CardTitle>
                  <p className="text-xs text-slate-500">Current status distribution</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeadStatusChart data={leadStatusChartData} />
            </CardContent>
          </Card>
        </div>

        {/* Phase A: Leaderboard gated — showLeaderboard = false until manager role is built */}
        {showLeaderboard && (
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                  <Award className="h-5 w-5 text-brand-deep" />
                </div>
                <div>
                  <CardTitle>Telecaller Leaderboard</CardTitle>
                  <p className="text-xs text-slate-500">Top performers by call volume &amp; sessions booked</p>
                </div>
              </div>
            </CardHeader>

            {telecallerLeaderboard.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-slate-500">No call data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Name</TH>
                      <TH className="text-center">Calls Made</TH>
                      <TH className="text-center">Sessions Booked</TH>
                      <TH className="text-center">Converted</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {telecallerLeaderboard.map((person, index) => (
                      <TR key={index}>
                        <TD>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-700">
                              {index + 1}
                            </div>
                            <span className="font-medium text-slate-900">{person.name}</span>
                          </div>
                        </TD>
                        <TD className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {person.calls}
                          </span>
                        </TD>
                        <TD className="text-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2.5 py-1 text-sm font-semibold tabular-nums text-brand-deep">
                            <Calendar className="h-3 w-3" />
                            {person.sessions}
                          </span>
                        </TD>
                        <TD className="text-center">
                          <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-brand-soft px-2 py-1 text-sm font-semibold tabular-nums text-brand-deep">
                            {person.converted}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
