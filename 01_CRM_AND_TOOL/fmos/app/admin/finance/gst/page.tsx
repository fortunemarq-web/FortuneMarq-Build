import { createServerClientWithCookies } from "@/lib/supabase-server";
import { getBusinessSettings } from "@/app/admin/settings/actions";
import Link from "next/link";
import { FileText, TrendingUp, TrendingDown, IndianRupee, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function getQuarterLabel(month: number, year: number) {
  // Indian FY quarters: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar
  if (month >= 4 && month <= 6) return `Q1 FY${year}-${(year + 1).toString().slice(2)}`;
  if (month >= 7 && month <= 9) return `Q2 FY${year}-${(year + 1).toString().slice(2)}`;
  if (month >= 10 && month <= 12) return `Q3 FY${year}-${(year + 1).toString().slice(2)}`;
  return `Q4 FY${year - 1}-${year.toString().slice(2)}`;
}

function getMonthName(month: number) {
  return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month];
}

export default async function GSTReportPage() {
  const supabase = await createServerClientWithCookies();
  const settings = await getBusinessSettings();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Build last 12 months
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${getMonthName(d.getMonth() + 1)} ${d.getFullYear()}` });
  }

  // Fetch all paid invoices (output GST)
  const { data: invoices } = await (supabase.from("invoices") as any)
    .select("id, invoice_number, amount, subtotal, gst_amount, total_amount, revenue_type, status, paid_at, issue_date, clients(business_name)")
    .in("status", ["paid", "unpaid", "overdue"])
    .order("issue_date", { ascending: false });

  // Fetch all expenses (input GST credits if tracked)
  const { data: expenses } = await (supabase.from("expenses") as any)
    .select("id, description, amount, gst_amount, date, category")
    .order("date", { ascending: false });

  const allInvoices = invoices || [];
  const allExpenses = expenses || [];

  // Build monthly GST data
  const monthlyData = months.map(({ year, month, label }) => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${endDay}`;

    const monthInvoices = allInvoices.filter((inv: any) => {
      const d = (inv.paid_at || inv.issue_date || "").slice(0, 10);
      return d >= start && d <= end;
    });

    const paidInvoices = monthInvoices.filter((inv: any) => inv.status === "paid");
    const allMonthInvoices = monthInvoices;

    const outputGST = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.gst_amount) || 0), 0);
    const taxableValue = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.subtotal) || inv.amount || 0), 0);
    const totalCollected = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.total_amount) || inv.amount || 0), 0);
    const invoiceCount = paidInvoices.length;

    const monthExpenses = allExpenses.filter((exp: any) => {
      const d = (exp.date || "").slice(0, 10);
      return d >= start && d <= end;
    });
    const inputGST = monthExpenses.reduce((s: number, exp: any) => s + (Number(exp.gst_amount) || 0), 0);

    const netGSTPayable = outputGST - inputGST;
    const quarter = getQuarterLabel(month, year);

    return { year, month, label, quarter, outputGST, inputGST, netGSTPayable, taxableValue, totalCollected, invoiceCount };
  });

  // Quarterly rollup
  const quarters: Record<string, { label: string; outputGST: number; inputGST: number; netGST: number; taxableValue: number; months: typeof monthlyData }> = {};
  monthlyData.forEach((m) => {
    if (!quarters[m.quarter]) {
      quarters[m.quarter] = { label: m.quarter, outputGST: 0, inputGST: 0, netGST: 0, taxableValue: 0, months: [] };
    }
    quarters[m.quarter].outputGST += m.outputGST;
    quarters[m.quarter].inputGST += m.inputGST;
    quarters[m.quarter].netGST += m.netGSTPayable;
    quarters[m.quarter].taxableValue += m.taxableValue;
    quarters[m.quarter].months.push(m);
  });

  const currentQuarterData = monthlyData.filter((m) => m.quarter === getQuarterLabel(currentMonth, currentYear));
  const currentQOutputGST = currentQuarterData.reduce((s, m) => s + m.outputGST, 0);
  const currentQInputGST = currentQuarterData.reduce((s, m) => s + m.inputGST, 0);
  const currentQNetGST = currentQOutputGST - currentQInputGST;

  const totalOutputGST12 = monthlyData.reduce((s, m) => s + m.outputGST, 0);
  const totalInputGST12 = monthlyData.reduce((s, m) => s + m.inputGST, 0);

  const gstRate = settings.gst_rate || 18;
  const cgstRate = gstRate / 2;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-2">
            <Link href="/admin/finance" className="hover:text-indigo-600">Finance</Link>
            <span>/</span>
            <span className="text-slate-900">GST Report</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GST Filing Report</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                GSTIN: <span className="font-mono font-bold text-slate-700">{settings.gstin}</span>
                &nbsp;·&nbsp; GST Rate: {gstRate}% (CGST {cgstRate}% + SGST {cgstRate}%)
              </p>
            </div>
            <Link href="/admin/settings" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              Edit GST settings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Current Quarter KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Output GST (Current Qtr)", value: formatINR(currentQOutputGST), sub: "GST collected from clients", color: "border-t-emerald-500", icon: TrendingUp, iconColor: "text-emerald-600" },
            { label: "Input Credit (Current Qtr)", value: formatINR(currentQInputGST), sub: "GST paid on expenses", color: "border-t-blue-400", icon: TrendingDown, iconColor: "text-blue-600" },
            { label: "Net GST Payable", value: formatINR(currentQNetGST), sub: getQuarterLabel(currentMonth, currentYear), color: "border-t-indigo-500", icon: IndianRupee, iconColor: "text-indigo-600" },
            { label: "12-Month Output GST", value: formatINR(totalOutputGST12), sub: "Total collected (trailing 12M)", color: "border-t-slate-400", icon: FileText, iconColor: "text-slate-600" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 border-t-[3px] ${kpi.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.iconColor} opacity-40`} />
                </div>
                <p className="text-xl font-bold font-mono text-slate-900">{kpi.value}</p>
                <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Filing Note */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-900">GSTR-3B Filing Reminder</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              File GSTR-3B by the 20th of the following month. GSTR-1 (outward supplies) by 11th.
              Current quarter: <strong>{getQuarterLabel(currentMonth, currentYear)}</strong>.
              Net payable this quarter: <strong>{formatINR(currentQNetGST)}</strong>.
            </p>
          </div>
        </div>

        {/* Quarterly Breakdown */}
        {Object.values(quarters).reverse().map((q) => (
          <div key={q.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{q.label}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Taxable Value: {formatINR(q.taxableValue)} &nbsp;·&nbsp;
                  Output GST: {formatINR(q.outputGST)} &nbsp;·&nbsp;
                  Input Credit: {formatINR(q.inputGST)} &nbsp;·&nbsp;
                  <span className={`font-bold ${q.netGST > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    Net Payable: {formatINR(q.netGST)}
                  </span>
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${q.netGST > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {q.netGST > 0 ? `Pay ${formatINR(q.netGST)}` : "Nil"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Month", "Taxable Value", "Output GST", "CGST", "SGST", "Input Credit", "Net Payable", "Invoices"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {q.months.map((m) => (
                    <tr key={m.label} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{m.label}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">{formatINR(m.taxableValue)}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">{formatINR(m.outputGST)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{formatINR(m.outputGST / 2)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{formatINR(m.outputGST / 2)}</td>
                      <td className="px-5 py-3.5 font-mono text-blue-600">{formatINR(m.inputGST)}</td>
                      <td className={`px-5 py-3.5 font-mono font-bold ${m.netGSTPayable > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatINR(m.netGSTPayable)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">{m.invoiceCount}</td>
                    </tr>
                  ))}
                  {/* Quarter total row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-5 py-3 font-bold text-slate-900">Quarter Total</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{formatINR(q.taxableValue)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-700">{formatINR(q.outputGST)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-700">{formatINR(q.outputGST / 2)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-700">{formatINR(q.outputGST / 2)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-blue-700">{formatINR(q.inputGST)}</td>
                    <td className={`px-5 py-3 font-mono font-bold text-lg ${q.netGST > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatINR(q.netGST)}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-700">{q.months.reduce((s, m) => s + m.invoiceCount, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Expense GST note */}
        {totalInputGST12 === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">No input GST credits recorded</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add a <span className="font-mono">gst_amount</span> column to your expenses table and start logging GST paid on purchases
                (software, ads, services) to reduce your net payable. Go to{" "}
                <Link href="/admin/finance/expenses" className="underline font-bold">Expense Log</Link> to add expenses.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
