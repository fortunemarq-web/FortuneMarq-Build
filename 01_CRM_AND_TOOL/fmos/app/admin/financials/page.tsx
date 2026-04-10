import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  ArrowLeft,
  Wallet,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import RevenuePieChart from "@/components/admin/revenue-pie-chart";
import MonthlyRevenueChart from "@/components/admin/monthly-revenue-chart";
import RevenueBySourceChart from "@/components/admin/revenue-by-source-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";

interface Deal {
  id: string;
  deal_value: number | null;
  deal_probability: number | null;
  status: string | null;
  service_type: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  source: string | null;
}

export default async function FinancialsPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch data in parallel
  const [dealsResult, leadsResult] = await Promise.all([
    supabase.from("deals").select("id, deal_value, deal_probability, status, service_type, created_at, lead_id"),
    supabase.from("leads").select("id, source"),
  ]);

  const deals = (dealsResult.data || []) as any[];
  const leads = (leadsResult.data || []) as Lead[];

  // Create lead source map
  const leadSourceMap = new Map(leads.map((l) => [l.id, l.source || "Direct"]));

  // Calculate metrics
  const closedDeals = deals.filter((d) => d.status === "won" || d.status === "accepted");
  const totalRevenue = closedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const avgDealValue = closedDeals.length > 0 ? totalRevenue / closedDeals.length : 0;

  // Open deals (pipeline)
  const openDeals = deals.filter(
    (d) => d.status !== "won" && d.status !== "accepted" && d.status !== "lost"
  );
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

  // Weighted Forecast: sum of (deal_value * (deal_probability / 100))
  const weightedForecast = openDeals.reduce((sum, d) => {
    const value = d.deal_value || 0;
    const probability = d.deal_probability || 0;
    return sum + value * (probability / 100);
  }, 0);

  // Revenue by Service Type for Pie Chart
  const revenueByService = closedDeals.reduce((acc, d) => {
    const service = d.service_type || "other";
    acc[service] = (acc[service] || 0) + (d.deal_value || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(revenueByService)
    .map(([name, value]) => ({
      name: formatServiceType(name),
      value: value as number,
    }))
    .sort((a, b) => b.value - a.value);

  // Revenue by Source
  const revenueBySource = closedDeals.reduce((acc, d) => {
    const source = d.lead_id ? leadSourceMap.get(d.lead_id) || "Direct" : "Direct";
    acc[source] = (acc[source] || 0) + (d.deal_value || 0);
    return acc;
  }, {} as Record<string, number>);

  const sourceColors: Record<string, string> = {
    "Google Ads": "#4285F4",
    "Facebook Ads": "#1877F2",
    "LinkedIn": "#0A66C2",
    "Referral": "#42CA80",
    "Direct": "#F59E0B",
    "Cold Call": "#8B5CF6",
    "Website": "#06B6D4",
    "Other": "#6B7280",
  };

  const revenueBySourceData = Object.entries(revenueBySource)
    .map(([name, value]) => ({
      name,
      value: value as number,
      color: sourceColors[name] || "#6B7280",
    }))
    .sort((a, b) => b.value - a.value);

  // Monthly Revenue Trend (last 6 months)
  const monthlyRevenue = getMonthlyRevenue(closedDeals);

  // Cash Flow Health: Compare weighted forecast to last month's revenue
  const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.value || 0;
  const cashFlowHealthy = weightedForecast > lastMonthRevenue;

  function formatServiceType(serviceType: string) {
    return serviceType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getMonthlyRevenue(deals: any[]) {
    const months: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }

    deals.forEach((deal) => {
      if (!deal.created_at) return;
      const date = new Date(deal.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (key in months) {
        months[key] += deal.deal_value || 0;
      }
    });

    return Object.entries(months).map(([month, value]) => {
      const [year, m] = month.split("-");
      const date = new Date(parseInt(year), parseInt(m) - 1);
      return {
        name: date.toLocaleDateString("en-US", { month: "short" }),
        value,
        fullName: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                <DollarSign className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
                  Financial Health
                </h1>
                <p className="text-sm text-slate-500">Revenue & profitability metrics</p>
              </div>
            </div>
            {/* Cash Flow Health Badge */}
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${cashFlowHealthy
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
              }`}>
              {cashFlowHealthy ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">
                Cash Flow: {cashFlowHealthy ? "Healthy" : "Attention"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            category="revenue"
            subtitle={`from ${closedDeals.length} closed deals`}
            className="delay-0"
          />
          <KpiCard
            title="Avg Deal Value"
            value={formatCurrency(avgDealValue)}
            icon={Wallet}
            category="volume"
            subtitle="per closed deal"
            className="delay-75"
          />
          <KpiCard
            title="Pipeline Value"
            value={formatCurrency(pipelineValue)}
            icon={PiggyBank}
            category="pipeline"
            subtitle={`${openDeals.length} deals in pipeline`}
            className="delay-150"
          />
          <KpiCard
            title="Weighted Forecast"
            value={formatCurrency(weightedForecast)}
            icon={Target}
            category="performance"
            subtitle="probability adjusted"
            className="delay-300"
          />
        </div>

        {/* Charts Row */}
        <div className="mb-6 rounded-xl bg-slate-100/60 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue by Service Type */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Revenue by Service</h2>
                  <p className="text-xs text-slate-600">Breakdown by service type</p>
                </div>
              </div>
              <RevenuePieChart data={pieChartData} />
            </div>

            {/* Revenue by Source */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Revenue by Source</h2>
                  <p className="text-xs text-slate-600">Where the money comes from</p>
                </div>
              </div>
              <RevenueBySourceChart data={revenueBySourceData} />
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-600">Last 6 months performance</p>
            </div>
          </div>
          <MonthlyRevenueChart data={monthlyRevenue} />
        </div>
      </div>
    </div>
  );
}
