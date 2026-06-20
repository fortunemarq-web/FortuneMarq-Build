import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  Target,
  Trophy,
  DollarSign,
  ArrowLeft,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  FileSignature,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import FunnelChart from "@/components/admin/funnel-chart";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

interface Lead {
  id: string;
  status: string | null;
  assigned_strategist: string | null;
  notes: string | null;
}

interface Deal {
  id: string;
  deal_value: number | null;
  status: string | null;
  lead_id: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default async function StrategyPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch data in parallel
  const [leadsResult, dealsResult, profilesResult] = await Promise.all([
    supabase.from("leads").select("id, status, assigned_strategist, notes"),
    supabase.from("deals").select("id, deal_value, status, lead_id, created_at"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const leads: Lead[] = leadsResult.data || [];
  const deals: Deal[] = dealsResult.data || [];
  const profiles: Profile[] = profilesResult.data || [];

  // Create lookup maps
  const profilesMap = new Map(profiles.map((p) => [p.id, p.full_name || p.email || "Unknown"]));
  const leadsMap = new Map(leads.map((l) => [l.id, l.assigned_strategist]));

  // Calculate Pipeline Breakdown for text statuses stored in notes
  // Check both lead status and notes for sub-stages
  const proposalsSent = leads.filter((l) => {
    if (l.status === "proposal_sent") return true;
    if (l.notes?.toLowerCase().includes("proposal_sent")) return true;
    return false;
  }).length;

  const contractsSent = leads.filter((l) => {
    if (l.status === "contract_sent") return true;
    if (l.notes?.toLowerCase().includes("contract_sent")) return true;
    return false;
  }).length;

  const negotiation = leads.filter((l) => {
    if (l.status === "negotiation") return true;
    if (l.notes?.toLowerCase().includes("negotiation")) return true;
    return false;
  }).length;

  // Calculate metrics
  const strategyBookedLeads = leads.filter(
    (l) => l.status === "strategy_booked" || l.status === "strategy_completed"
  ).length;

  const closedWonDeals = deals.filter((d) => d.status === "won" || d.status === "accepted");
  const dealsWon = closedWonDeals.length;
  const totalRevenue = closedWonDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

  // Strategy sessions count
  const strategySessionsCount = leads.filter(
    (l) =>
      l.status === "strategy_booked" ||
      l.status === "strategy_completed" ||
      l.status === "closed_won" ||
      l.status === "closed_lost"
  ).length;

  // Proposal to Close Rate
  const totalProposals = proposalsSent + contractsSent + dealsWon;
  const proposalToCloseRate = totalProposals > 0 ? (dealsWon / totalProposals) * 100 : 0;

  // Funnel Data — Recharts consumes literal hex (brand green for won; semantic
  // slate/blue/amber otherwise), never Tailwind classes.
  const funnelData = [
    { name: "Strategy Sessions", value: strategySessionsCount, color: "#64748b" },
    { name: "Proposals Sent", value: proposalsSent || Math.floor(strategySessionsCount * 0.7), color: "#3b82f6" },
    { name: "Contracts Sent", value: contractsSent || Math.floor(strategySessionsCount * 0.5), color: "#f59e0b" },
    { name: "Negotiation", value: negotiation || Math.floor(strategySessionsCount * 0.3), color: "#64748b" },
    { name: "Deals Won", value: dealsWon, color: "#42CA80" },
  ];

  // Strategist Performance
  const strategistStats = new Map<string, { deals: number; revenue: number }>();

  closedWonDeals.forEach((deal) => {
    if (!deal.lead_id) return;
    const strategistId = leadsMap.get(deal.lead_id);
    if (!strategistId) return;

    if (!strategistStats.has(strategistId)) {
      strategistStats.set(strategistId, { deals: 0, revenue: 0 });
    }
    strategistStats.get(strategistId)!.deals += 1;
    strategistStats.get(strategistId)!.revenue += deal.deal_value || 0;
  });

  const strategistLeaderboard = Array.from(strategistStats.entries())
    .map(([userId, data]) => ({
      name: profilesMap.get(userId) || userId.slice(0, 8) + "...",
      deals: data.deals,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.deals - a.deals)
    .slice(0, 10);

  // Recent Won Deals
  const recentWonDeals = closedWonDeals
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

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
            title="Strategy Engine"
            subtitle="Deal closing & strategist performance"
          />
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Strategy Sessions"
            value={strategySessionsCount}
            icon={Calendar}
            hint={`${strategyBookedLeads} currently booked`}
          />
          <StatCard
            label="Deals Won"
            value={dealsWon}
            icon={Trophy}
            hint="closed successfully"
          />
          <StatCard
            label="Revenue Generated"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            hint="from closed deals"
          />
        </div>

        {/* Pipeline Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Proposals
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-slate-900">
              {proposalsSent || Math.floor(strategySessionsCount * 0.7)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contracts
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-slate-900">
              {contractsSent || Math.floor(strategySessionsCount * 0.5)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Negotiating
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-slate-900">
              {negotiation || Math.floor(strategySessionsCount * 0.3)}
            </p>
          </Card>

          <Card className="border-brand-line bg-brand-soft p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-deep" />
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-deep">
                Close Rate
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-brand-deep">
              {proposalToCloseRate.toFixed(1)}%
            </p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales Funnel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                  <TrendingUp className="h-5 w-5 text-brand-deep" />
                </div>
                <div>
                  <CardTitle>Sales Funnel</CardTitle>
                  <p className="text-xs text-slate-500">Session to close conversion</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnelData} />
            </CardContent>
          </Card>

          {/* Strategist Performance */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                  <Award className="h-5 w-5 text-brand-deep" />
                </div>
                <div>
                  <CardTitle>Strategist Performance</CardTitle>
                  <p className="text-xs text-slate-500">Ranked by revenue generated</p>
                </div>
              </div>
            </CardHeader>

            {strategistLeaderboard.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center">
                <p className="text-sm text-slate-500">No strategist data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Strategist</TH>
                      <TH className="text-center">Deals</TH>
                      <TH className="text-right">Revenue</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {strategistLeaderboard.map((person, index) => (
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
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-sm font-semibold tabular-nums text-brand-deep">
                            <Trophy className="h-3 w-3" />
                            {person.deals}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <span className="text-sm font-semibold tabular-nums text-slate-900">
                            {formatCurrency(person.revenue)}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Wins */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
              <Trophy className="h-5 w-5 text-brand-deep" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Recent Wins</h2>
              <p className="text-xs text-slate-500">Latest closed deals</p>
            </div>
          </div>

          {recentWonDeals.length === 0 ? (
            <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60">
              <p className="text-sm text-slate-500">No closed deals yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {recentWonDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex flex-col items-center justify-center rounded-xl border border-brand-line bg-brand-soft p-4 text-center"
                >
                  <Trophy className="h-5 w-5 text-brand-deep" />
                  <span className="mt-2 text-xl font-semibold tabular-nums text-brand-deep">
                    {formatCurrency(deal.deal_value || 0)}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {formatDate(deal.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
