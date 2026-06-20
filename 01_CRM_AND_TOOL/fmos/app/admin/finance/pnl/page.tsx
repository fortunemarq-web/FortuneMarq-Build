import { createServerClientWithCookies } from "@/lib/supabase-server";
import { TrendingUp, TrendingDown, Wallet, Activity, Percent } from "lucide-react";
import { getRevenueVsExpensesChartData } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function PnLPage() {
  const pnlData = await getRevenueVsExpensesChartData();

  const totalRevenue = pnlData.reduce((a, r) => a + r.revenue, 0);
  const totalProfit = pnlData.reduce((a, r) => a + r.profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const healthScore = Math.min(100, Math.max(0, Math.round(avgMargin + 50)));
  const healthLabel =
    healthScore >= 90 ? "Optimal" :
    healthScore >= 75 ? "Healthy" :
    healthScore >= 60 ? "Good" :
    healthScore >= 40 ? "Fair" : "Critical";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateMargin = (rev: number, exp: number) => {
    if (rev === 0) return 0;
    return (((rev - exp) / rev) * 100).toFixed(1);
  };

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <PageHeader
          eyebrow="Finance / Profit & Loss"
          title="P&L Statement"
          subtitle="Net profitability and fiscal health over the last 6 months"
          actions={
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-1">
              <Badge tone="brand" size="sm">Historical</Badge>
              <span className="cursor-not-allowed px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Projections</span>
            </div>
          }
        />

        {/* Breakdown Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Financial Month</TH>
                  <TH className="text-right">MRR</TH>
                  <TH className="text-right">Setup</TH>
                  <TH className="text-right">One-Time</TH>
                  <TH className="text-right">Total Rev</TH>
                  <TH className="text-right">Expenses</TH>
                  <TH className="text-right">Net Profit</TH>
                  <TH className="text-center">Margin</TH>
                </TR>
              </THead>
              <TBody>
                {pnlData.map((row: any, i) => {
                  const margin = Number(calculateMargin(row.revenue, row.expenses));
                  const isPositive = margin > 0;
                  const isBreakEven = margin === 0 && row.revenue > 0;

                  return (
                    <TR key={i}>
                      <TD>
                        <span className="text-sm font-semibold text-slate-900">{row.name}</span>
                      </TD>
                      <TD className="text-right text-xs font-semibold tabular-nums text-slate-600">{formatCurrency(row.mrr || 0)}</TD>
                      <TD className="text-right text-xs font-semibold tabular-nums text-slate-600">{formatCurrency(row.setupFee || 0)}</TD>
                      <TD className="text-right text-xs font-semibold tabular-nums text-slate-600">{formatCurrency(row.oneTime || 0)}</TD>
                      <TD className="text-right text-sm font-semibold tabular-nums text-brand-deep">{formatCurrency(row.revenue)}</TD>
                      <TD className="text-right text-sm font-semibold tabular-nums text-danger">-{formatCurrency(row.expenses)}</TD>
                      <TD className={`text-right text-sm font-semibold tabular-nums ${isPositive ? "text-brand-deep" : "text-slate-900"}`}>
                        {formatCurrency(row.profit)}
                      </TD>
                      <TD className="text-center">
                        <Badge tone={isPositive ? "brand" : isBreakEven ? "neutral" : "danger"} size="sm">
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {margin}%
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Avg. Monthly Profit"
            value={formatCurrency(pnlData.reduce((acc, r) => acc + r.profit, 0) / pnlData.length)}
            icon={Activity}
          />
          <StatCard
            label="Health Score"
            value={`${healthScore}/100`}
            icon={Percent}
            hint={healthLabel}
          />
          <StatCard
            label="Net Cash (6 Mo)"
            value={formatCurrency(totalProfit)}
            icon={Wallet}
            hint="Cumulative"
          />
        </div>

      </div>
    </div>
  );
}
