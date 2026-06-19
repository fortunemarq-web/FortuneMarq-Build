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

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    unpaid: "bg-amber-50 text-amber-600 border-amber-100",
    overdue: "bg-red-50 text-red-600 border-red-100",
    cancelled: "bg-slate-50 text-slate-600 border-slate-100",
  };

  const revenueTypeColors: Record<string, string> = {
    mrr: "bg-indigo-50 text-indigo-600",
    setup_fee: "bg-emerald-50 text-emerald-600",
    one_time: "bg-purple-50 text-purple-600",
  };

  const kpis = [
    {
      label: "MRR This Month",
      value: formatINR(mrr),
      sub: "Paid monthly retainers",
      icon: TrendingUp,
      color: "#4F46E5",
      border: "border-t-indigo-500",
    },
    {
      label: "Setup Fees",
      value: formatINR(setupFees),
      sub: "One-time setup charges",
      icon: Package,
      color: "#10B981",
      border: "border-t-emerald-500",
    },
    {
      label: "One-Time Revenue",
      value: formatINR(oneTime),
      sub: "Project / ad-hoc work",
      icon: Layers,
      color: "#8B5CF6",
      border: "border-t-violet-500",
    },
    {
      label: "Total Revenue MTD",
      value: formatINR(totalRevenue),
      sub: "MRR + Setup + One-Time",
      icon: DollarSign,
      color: "#42CA80",
      border: "border-t-[#42CA80]",
    },
    {
      label: "Outstanding",
      value: formatINR(outstanding),
      sub: `${outstandingResult.data?.length || 0} invoices`,
      icon: Clock,
      color: "#F59E0B",
      border: "border-t-amber-400",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Finance Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">MRR, setup fees, one-time revenue and outstanding — all separated.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/finance/invoices"
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Manage Invoices
            </Link>
            <Link href="/admin/finance/pnl"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors">
              P&L View
            </Link>
          </div>
        </div>

        {/* E1: 5 KPI Cards — MRR Split */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-[3px] ${kpi.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                  <Icon className="h-4 w-4 opacity-20" style={{ color: kpi.color }} />
                </div>
                <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Revenue breakdown bar */}
        {totalRevenue > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Mix This Month</p>
              <p className="text-sm font-bold text-slate-800 font-mono">{formatINR(totalRevenue)}</p>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
              {mrr > 0 && <div className="bg-indigo-500 rounded-l-full" style={{ width: `${(mrr / totalRevenue) * 100}%` }} title={`MRR: ${formatINR(mrr)}`} />}
              {setupFees > 0 && <div className="bg-emerald-500" style={{ width: `${(setupFees / totalRevenue) * 100}%` }} title={`Setup: ${formatINR(setupFees)}`} />}
              {oneTime > 0 && <div className="bg-violet-500 rounded-r-full" style={{ width: `${(oneTime / totalRevenue) * 100}%` }} title={`One-Time: ${formatINR(oneTime)}`} />}
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: "MRR", value: mrr, color: "bg-indigo-500" },
                { label: "Setup Fees", value: setupFees, color: "bg-emerald-500" },
                { label: "One-Time", value: oneTime, color: "bg-violet-500" },
              ].filter(i => i.value > 0).map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] text-slate-500">{item.label}: <strong>{formatINR(item.value)}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart + Recent Invoices */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Revenue vs Expenses</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Trailing monthly comparison</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Revenue</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-400" /> Expenses</div>
                </div>
              </div>
              <div className="h-[300px]">
                <FinanceChart data={chartData} />
              </div>
            </div>

            {/* Recent Invoices with Revenue Type column */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
                <Link href="/admin/finance/invoices" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Invoice", "Client", "Type", "Amount", "Status"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(recentInvoicesResult.data || []).map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">{inv.invoice_number}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{inv.clients?.business_name || "—"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${revenueTypeColors[inv.revenue_type] || "bg-slate-100 text-slate-500"}`}>
                            {REVENUE_TYPE_LABELS[inv.revenue_type] || inv.revenue_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{formatINR(inv.amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[inv.status]}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!recentInvoicesResult.data?.length && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic text-sm">No invoices yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* P&L Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">P&L This Month</h3>
              <div className="space-y-2.5">
                {[
                  { label: "MRR", value: mrr, color: "text-indigo-600" },
                  { label: "Setup Fees", value: setupFees, color: "text-emerald-600" },
                  { label: "One-Time", value: oneTime, color: "text-violet-600" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-bold font-mono ${row.color}`}>{formatINR(row.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2.5">
                  <span className="font-bold text-slate-800">Total Revenue</span>
                  <span className="font-bold font-mono text-slate-900">{formatINR(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Expenses</span>
                  <span className="font-bold font-mono text-red-500">-{formatINR(expenses)}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t-2 border-slate-900 pt-2.5">
                  <span className="font-bold text-slate-900">Net</span>
                  <span className={`font-bold font-mono text-lg ${totalRevenue - expenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatINR(totalRevenue - expenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* GST Summary Card */}
            <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900">GST — {qBounds.label}</h3>
                </div>
                <Link href="/admin/finance/gst" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
                  Full Report <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">{formatINR(currentQtrGST)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Output GST collected this quarter (18%)</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: "100%" }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">CGST+SGST: {formatINR(currentQtrGST / 2)} each</span>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-red-50/50 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-bold text-red-900">Overdue</h3>
                </div>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {overdueResult.data?.length || 0}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {(overdueResult.data || []).map((inv: any) => (
                  <div key={inv.id} className="p-3.5 rounded-xl border border-red-100 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-mono text-slate-400">{inv.invoice_number}</p>
                      <span className="text-[10px] font-bold text-red-600">
                        {Math.ceil((Date.now() - new Date(inv.due_date).getTime()) / 86400000)}d late
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{inv.clients?.business_name}</p>
                    <p className="font-mono font-bold text-red-500 text-sm mt-1">{formatINR(inv.amount)}</p>
                  </div>
                ))}
                {!overdueResult.data?.length && (
                  <div className="text-center py-8 opacity-40">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">All clear</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Finance Tools</h3>
              <div className="space-y-2">
                {[
                  { label: "P&L View", href: "/admin/finance/pnl", icon: TrendingUp },
                  { label: "Expense Audit", href: "/admin/finance/expenses", icon: DollarSign },
                  { label: "Manage Invoices", href: "/admin/finance/invoices", icon: Wallet },
                  { label: "GST Report", href: "/admin/finance/gst", icon: Receipt },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <link.icon className="h-4 w-4 text-[#42CA80]" />
                      <span className="text-sm font-semibold">{link.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-30" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
