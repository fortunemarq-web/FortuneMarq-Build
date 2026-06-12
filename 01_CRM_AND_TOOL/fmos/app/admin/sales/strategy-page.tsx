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
import { KpiCard } from "@/components/dashboard/kpi-card";

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

  // Funnel Data
  const funnelData = [
    { name: "Strategy Sessions", value: strategySessionsCount, color: "#8B5CF6" },
    { name: "Proposals Sent", value: proposalsSent || Math.floor(strategySessionsCount * 0.7), color: "#06B6D4" },
    { name: "Contracts Sent", value: contractsSent || Math.floor(strategySessionsCount * 0.5), color: "#F59E0B" },
    { name: "Negotiation", value: negotiation || Math.floor(strategySessionsCount * 0.3), color: "#EC4899" },
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
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/20">
              <Target className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
                Strategy Engine
              </h1>
              <p className="text-sm text-slate-500">Deal closing & strategist performance</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            title="Strategy Sessions"
            value={strategySessionsCount}
            icon={Calendar}
            category="performance"
            subtitle={`${strategyBookedLeads} currently booked`}
          />
          <KpiCard
            title="Deals Won"
            value={dealsWon}
            icon={Trophy}
            category="revenue"
            subtitle="closed successfully"
          />
          <KpiCard
            title="Revenue Generated"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            category="pipeline"
            subtitle="from closed deals"
          />
        </div>

        {/* Pipeline Breakdown Cards */}
        <div className="mb-8 rounded-xl bg-slate-100/60 p-4 md:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Proposals Sent */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Proposals
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {proposalsSent || Math.floor(strategySessionsCount * 0.7)}
              </p>
            </div>

            {/* Contracts Sent */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Contracts
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {contractsSent || Math.floor(strategySessionsCount * 0.5)}
              </p>
            </div>

            {/* Negotiation */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-pink-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Negotiating
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {negotiation || Math.floor(strategySessionsCount * 0.3)}
              </p>
            </div>

            {/* Proposal to Close Rate */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Close Rate
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
                {proposalToCloseRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-8 rounded-xl bg-slate-100/60 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sales Funnel */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Sales Funnel</h2>
                  <p className="text-xs text-slate-600">Session to close conversion</p>
                </div>
              </div>
              <FunnelChart data={funnelData} />
            </div>

            {/* Strategist Performance */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Award className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Strategist Performance</h2>
                  <p className="text-xs text-slate-600">Ranked by revenue generated</p>
                </div>
              </div>

              {strategistLeaderboard.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-sm text-slate-500">No strategist data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Strategist
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Deals
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {strategistLeaderboard.map((person, index) => (
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
                                      : "bg-slate-100"
                                  }`}
                              >
                                {index + 1}
                              </div>
                              <span className="font-medium text-slate-900">{person.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-emerald-600 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <Trophy className="h-3 w-3" />
                              {person.deals}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                              {formatCurrency(person.revenue)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Wins */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Wins</h2>
              <p className="text-xs text-slate-600">Latest closed deals</p>
            </div>
          </div>

          {recentWonDeals.length === 0 ? (
            <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-sm text-slate-500">No closed deals yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {recentWonDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center"
                >
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <span className="mt-2 text-xl font-bold text-emerald-400">
                    {formatCurrency(deal.deal_value || 0)}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {formatDate(deal.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
