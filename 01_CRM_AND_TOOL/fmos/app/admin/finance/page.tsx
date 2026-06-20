import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  DollarSign, TrendingUp, TrendingDown, Clock,
  Wallet, Users, ArrowRight, Send, CheckCircle2,
  AlertCircle, Layers, Package, Receipt
} from "lucide-react";
import Link from "next/link";
import { autoMarkOverdueInvoices, getRevenueVsExpensesChartData } from "./actions";
import { getBusinessSettings } from "@/app/admin/settings/actions";
import FinanceChart from "@/components/admin/finance/FinanceChart";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function FinanceDashboard() {
  const supabase = await createServerClientWithCookies();
  await autoMarkOverdueInvoices();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // E1: Fetch revenue split + outstanding in parallel
  const [
    mrrResult,
    setupFeeResult,
    oneTimeResult,
    outstandingResult,
    recentInvoicesResult,
    overdueResult,
    chartData,
    expensesResult,
    allPaidInvoicesGST,
  ] = await Promise.all([
    // MRR this month (paid). invoices has no `amount` column — alias total_amount.
    supabase.from("invoices").select("amount:total_amount").eq("revenue_type", "mrr").eq("status", "paid")
      .gte("created_at", monthStart).lte("created_at", monthEnd),

    // Setup fees this month (paid)
    supabase.from("invoices").select("amount:total_amount").eq("revenue_type", "setup_fee").eq("status", "paid")
      .gte("created_at", monthStart).lte("created_at", monthEnd),

    // One-time revenue this month (paid)
    supabase.from("invoices").select("amount:total_amount").eq("revenue_type", "one_time").eq("status", "paid")
      .gte("created_at", monthStart).lte("created_at", monthEnd),

    // Outstanding (unpaid + overdue)
    supabase.from("invoices").select("id, amount:total_amount").in("status", ["unpaid", "overdue"]),

    // Recent invoices
    supabase.from("invoices").select("id, invoice_number, amount:total_amount, revenue_type, status, created_at, clients(business_name)")
      .order("created_at", { ascending: false }).limit(7),

    // Overdue invoices
    supabase.from("invoices").select("id, invoice_number, amount:total_amount, due_date, clients(business_name)")
      .eq("status", "overdue").order("due_date", { ascending: true }).limit(5),

    // Chart data
    getRevenueVsExpensesChartData(),

    // Expenses MTD (expenses uses expense_date, not date)
    supabase.from("expenses").select("amount").gte("expense_date", monthStart).lte("expense_date", monthEnd),
    // GST from paid invoices this quarter
    supabase.from("invoices").select("gst_amount, issue_date").eq("status", "paid"),
  ]);

  // Compute current quarter GST
  function getCurrentQuarterBounds() {
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    if (m >= 4 && m <= 6) return { start: `${y}-04-01`, end: `${y}-06-30`, label: `Q1 FY${y}-${(y+1).toString().slice(2)}` };
    if (m >= 7 && m <= 9) return { start: `${y}-07-01`, end: `${y}-09-30`, label: `Q2 FY${y}-${(y+1).toString().slice(2)}` };
    if (m >= 10 && m <= 12) return { start: `${y}-10-01`, end: `${y}-12-31`, label: `Q3 FY${y}-${(y+1).toString().slice(2)}` };
    return { start: `${y-1}-01-01`, end: `${y}-03-31`, label: `Q4 FY${y-1}-${y.toString().slice(2)}` };
  }
  const qBounds = getCurrentQuarterBounds();
  const currentQtrGST = (allPaidInvoicesGST.data || [])
    .filter((inv: any) => {
      const d = (inv.issue_date || "").slice(0, 10);
      return d >= qBounds.start && d <= qBounds.end;
    })
    .reduce((s: number, inv: any) => s + (Number(inv.gst_amount) || 0), 0);

  const mrr = (mrrResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const setupFees = (setupFeeResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const oneTime = (oneTimeResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const totalRevenue = mrr + setupFees + oneTime;
  const outstanding = (outstandingResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const expenses = (expensesResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const REVENUE_TYPE_LABELS: Record<string, string> = {
    mrr: "MRR",
    setup_fee: "Setup Fee",
    one_time: "One-Time",
  };

  // Every invoice status maps to one of the five tones — no per-status colours.
  const STATUS_TONE: Record<string, Tone> = {
    paid: "brand",
    unpaid: "warning",
    overdue: "danger",
    cancelled: "neutral",
    partially_paid: "info",
  };

  const kpis = [
    { label: "MRR This Month", value: formatINR(mrr), sub: "Paid monthly retainers", icon: TrendingUp },
    { label: "Setup Fees", value: formatINR(setupFees), sub: "One-time setup charges", icon: Package },
    { label: "One-Time Revenue", value: formatINR(oneTime), sub: "Project / ad-hoc work", icon: Layers },
    { label: "Total Revenue MTD", value: formatINR(totalRevenue), sub: "MRR + Setup + One-Time", icon: DollarSign },
    { label: "Outstanding", value: formatINR(outstanding), sub: `${outstandingResult.data?.length || 0} invoices`, icon: Clock },
  ];

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <PageHeader
          title="Finance"
          subtitle="MRR, setup fees, one-time revenue and outstanding — all separated."
          actions={
            <>
              <Link href="/admin/finance/invoices" className={buttonVariants({ variant: "secondary" })}>
                Manage invoices
              </Link>
              <Link href="/admin/finance/pnl" className={buttonVariants({ variant: "primary" })}>
                P&amp;L view
              </Link>
            </>
          }
        />

        {/* KPI cards — one accent, no rainbow top borders */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} hint={kpi.sub} />
          ))}
        </div>

        {/* Revenue mix — brand accent + neutrals, not a 3-colour rainbow */}
        {totalRevenue > 0 && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue mix this month</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800">{formatINR(totalRevenue)}</p>
            </div>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {mrr > 0 && <div className="rounded-l-full bg-brand" style={{ width: `${(mrr / totalRevenue) * 100}%` }} title={`MRR: ${formatINR(mrr)}`} />}
              {setupFees > 0 && <div className="bg-slate-400" style={{ width: `${(setupFees / totalRevenue) * 100}%` }} title={`Setup: ${formatINR(setupFees)}`} />}
              {oneTime > 0 && <div className="rounded-r-full bg-slate-300" style={{ width: `${(oneTime / totalRevenue) * 100}%` }} title={`One-Time: ${formatINR(oneTime)}`} />}
            </div>
            <div className="mt-2 flex flex-wrap gap-4">
              {[
                { label: "MRR", value: mrr, color: "bg-brand" },
                { label: "Setup Fees", value: setupFees, color: "bg-slate-400" },
                { label: "One-Time", value: oneTime, color: "bg-slate-300" },
              ].filter((i) => i.value > 0).map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-slate-500">{item.label}: <strong className="font-semibold text-slate-700">{formatINR(item.value)}</strong></span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="space-y-6 lg:col-span-8">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Revenue vs expenses</CardTitle>
                  <p className="mt-0.5 text-xs text-slate-500">Trailing monthly comparison</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-brand" /> Revenue</div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Expenses</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <FinanceChart data={chartData} />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Recent invoices</CardTitle>
                <Link href="/admin/finance/invoices" className="flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      {["Invoice", "Client", "Type", "Amount", "Status"].map((h) => (
                        <TH key={h} className={h === "Amount" ? "text-right" : ""}>{h}</TH>
                      ))}
                    </TR>
                  </THead>
                  <TBody>
                    {(recentInvoicesResult.data || []).map((inv: any) => (
                      <TR key={inv.id}>
                        <TD className="tabular-nums font-medium text-slate-600">{inv.invoice_number}</TD>
                        <TD className="font-medium text-slate-900">{inv.clients?.business_name || "—"}</TD>
                        <TD><Badge tone="neutral" variant="outline" size="sm">{REVENUE_TYPE_LABELS[inv.revenue_type] || inv.revenue_type}</Badge></TD>
                        <TD className="text-right font-semibold tabular-nums text-slate-900">{formatINR(inv.amount)}</TD>
                        <TD><Badge tone={STATUS_TONE[inv.status] || "neutral"} size="sm" className="capitalize">{inv.status}</Badge></TD>
                      </TR>
                    ))}
                    {!recentInvoicesResult.data?.length && (
                      <TR className="hover:bg-transparent"><TD colSpan={5} className="py-12 text-center text-sm text-slate-400">No invoices yet.</TD></TR>
                    )}
                  </TBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-4 lg:col-span-4">
            {/* P&L */}
            <Card className="p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">P&amp;L this month</h3>
              <div className="space-y-2.5">
                {[
                  { label: "MRR", value: mrr },
                  { label: "Setup Fees", value: setupFees },
                  { label: "One-Time", value: oneTime },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">{formatINR(row.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line pt-2.5 text-sm">
                  <span className="font-semibold text-slate-800">Total revenue</span>
                  <span className="font-semibold tabular-nums text-slate-900">{formatINR(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Expenses</span>
                  <span className="font-semibold tabular-nums text-danger">-{formatINR(expenses)}</span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-slate-900 pt-2.5">
                  <span className="font-semibold text-slate-900">Net</span>
                  <span className={`font-display text-lg font-semibold tabular-nums ${totalRevenue - expenses >= 0 ? "text-brand-deep" : "text-danger"}`}>
                    {formatINR(totalRevenue - expenses)}
                  </span>
                </div>
              </div>
            </Card>

            {/* GST */}
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-brand-deep" />
                  <h3 className="text-sm font-semibold text-slate-900">GST — {qBounds.label}</h3>
                </div>
                <Link href="/admin/finance/gst" className="flex items-center gap-0.5 text-xs font-semibold text-brand-deep hover:underline">
                  Full report <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="font-display text-2xl font-semibold tabular-nums text-slate-900">{formatINR(currentQtrGST)}</p>
              <p className="mt-1 text-xs text-slate-500">Output GST collected this quarter (18%)</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: "100%" }} />
                </div>
                <span className="text-[11px] font-medium text-slate-500">CGST+SGST: {formatINR(currentQtrGST / 2)} each</span>
              </div>
            </Card>

            {/* Overdue */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-danger-line bg-danger-soft px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <h3 className="text-sm font-semibold text-danger">Overdue</h3>
                </div>
                <Badge tone="danger" size="sm">{overdueResult.data?.length || 0}</Badge>
              </div>
              <div className="space-y-2 p-3">
                {(overdueResult.data || []).map((inv: any) => (
                  <div key={inv.id} className="rounded-lg border border-danger-line bg-surface p-3.5">
                    <div className="mb-1 flex items-start justify-between">
                      <p className="text-xs tabular-nums text-slate-400">{inv.invoice_number}</p>
                      <span className="text-[11px] font-semibold text-danger">
                        {Math.ceil((Date.now() - new Date(inv.due_date).getTime()) / 86400000)}d late
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{inv.clients?.business_name}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-danger">{formatINR(inv.amount)}</p>
                  </div>
                ))}
                {!overdueResult.data?.length && (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-brand" />
                    <p className="text-xs font-medium text-slate-500">All clear — nothing overdue</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Tools */}
            <Card className="p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Finance tools</h3>
              <div className="space-y-1.5">
                {[
                  { label: "P&L view", href: "/admin/finance/pnl", icon: TrendingUp },
                  { label: "Expense audit", href: "/admin/finance/expenses", icon: DollarSign },
                  { label: "Manage invoices", href: "/admin/finance/invoices", icon: Wallet },
                  { label: "GST report", href: "/admin/finance/gst", icon: Receipt },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-slate-50">
                    <span className="flex items-center gap-2.5">
                      <link.icon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{link.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
