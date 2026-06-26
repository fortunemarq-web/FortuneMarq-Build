import { createServerClientWithCookies } from "@/lib/supabase-server";
import { getBusinessSettings } from "@/app/admin/settings/actions";
import Link from "next/link";
import { FileText, TrendingUp, TrendingDown, IndianRupee, ArrowRight, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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
    // invoices has no `amount` column — use subtotal / total_amount.
    .select("id, invoice_number, subtotal, gst_amount, total_amount, revenue_type, status, paid_at, issue_date, is_interstate, clients(business_name)")
    .in("status", ["paid", "unpaid", "overdue"])
    .order("issue_date", { ascending: false });

  // Fetch all expenses. NOTE: expenses has no gst_amount column (input-GST not tracked
  // yet — see empty-state below), and its date column is `expense_date`.
  const { data: expenses } = await (supabase.from("expenses") as any)
    .select("id, description, amount, expense_date, category")
    .order("expense_date", { ascending: false });

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
    // Split output GST by place of supply: intra-state → CGST+SGST, inter-state → IGST.
    const igst = paidInvoices.reduce((s: number, inv: any) => s + (inv.is_interstate ? (Number(inv.gst_amount) || 0) : 0), 0);
    const intraGst = outputGST - igst;
    const cgst = intraGst / 2;
    const sgst = intraGst / 2;
    const taxableValue = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.subtotal) || inv.amount || 0), 0);
    const totalCollected = paidInvoices.reduce((s: number, inv: any) => s + (Number(inv.total_amount) || inv.amount || 0), 0);
    const invoiceCount = paidInvoices.length;

    const monthExpenses = allExpenses.filter((exp: any) => {
      const d = (exp.expense_date || "").slice(0, 10);
      return d >= start && d <= end;
    });
    const inputGST = monthExpenses.reduce((s: number, exp: any) => s + (Number(exp.gst_amount) || 0), 0);

    const netGSTPayable = outputGST - inputGST;
    const quarter = getQuarterLabel(month, year);

    return { year, month, label, quarter, outputGST, cgst, sgst, igst, inputGST, netGSTPayable, taxableValue, totalCollected, invoiceCount };
  });

  // Quarterly rollup
  const quarters: Record<string, { label: string; outputGST: number; cgst: number; sgst: number; igst: number; inputGST: number; netGST: number; taxableValue: number; months: typeof monthlyData }> = {};
  monthlyData.forEach((m) => {
    if (!quarters[m.quarter]) {
      quarters[m.quarter] = { label: m.quarter, outputGST: 0, cgst: 0, sgst: 0, igst: 0, inputGST: 0, netGST: 0, taxableValue: 0, months: [] };
    }
    quarters[m.quarter].outputGST += m.outputGST;
    quarters[m.quarter].cgst += m.cgst;
    quarters[m.quarter].sgst += m.sgst;
    quarters[m.quarter].igst += m.igst;
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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <PageHeader
          eyebrow="Finance / GST Report"
          title="GST Filing Report"
          subtitle={
            <>
              GSTIN: <span className="font-semibold tabular-nums text-slate-700">{settings.gstin}</span>
              &nbsp;·&nbsp; GST Rate: {gstRate}% (intra-state CGST {cgstRate}% + SGST {cgstRate}% · inter-state IGST {gstRate}%)
            </>
          }
          actions={
            <Link href="/admin/settings" className="flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline">
              Edit GST settings <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />

        {/* Current Quarter KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Output GST (Current Qtr)" value={formatINR(currentQOutputGST)} icon={TrendingUp} hint="GST collected from clients" />
          <StatCard label="Input Credit (Current Qtr)" value={formatINR(currentQInputGST)} icon={TrendingDown} hint="GST paid on expenses" />
          <StatCard label="Net GST Payable" value={formatINR(currentQNetGST)} icon={IndianRupee} hint={getQuarterLabel(currentMonth, currentYear)} />
          <StatCard label="12-Month Output GST" value={formatINR(totalOutputGST12)} icon={FileText} hint="Total collected (trailing 12M)" />
        </div>

        {/* Filing Note */}
        <div className="flex items-start gap-3 rounded-xl border border-info-line bg-info-soft p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <div>
            <p className="text-sm font-semibold text-info">GSTR-3B Filing Reminder</p>
            <p className="mt-0.5 text-xs text-slate-600">
              File GSTR-3B by the 20th of the following month. GSTR-1 (outward supplies) by 11th.
              Current quarter: <strong className="font-semibold text-slate-700">{getQuarterLabel(currentMonth, currentYear)}</strong>.
              Net payable this quarter: <strong className="font-semibold text-slate-700">{formatINR(currentQNetGST)}</strong>.
            </p>
          </div>
        </div>

        {/* Quarterly Breakdown */}
        {Object.values(quarters).reverse().map((q) => (
          <Card key={q.label} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-slate-50 px-6 py-4">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">{q.label}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Taxable Value: {formatINR(q.taxableValue)} &nbsp;·&nbsp;
                  Output GST: {formatINR(q.outputGST)} &nbsp;·&nbsp;
                  Input Credit: {formatINR(q.inputGST)} &nbsp;·&nbsp;
                  <span className={`font-semibold ${q.netGST > 0 ? "text-danger" : "text-brand-deep"}`}>
                    Net Payable: {formatINR(q.netGST)}
                  </span>
                </p>
              </div>
              <Badge tone={q.netGST > 0 ? "danger" : "brand"} size="sm">
                {q.netGST > 0 ? `Pay ${formatINR(q.netGST)}` : "Nil"}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    {["Month", "Taxable Value", "Output GST", "CGST", "SGST", "IGST", "Input Credit", "Net Payable", "Invoices"].map((h) => (
                      <TH key={h} className="whitespace-nowrap">{h}</TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {q.months.map((m) => (
                    <TR key={m.label}>
                      <TD className="whitespace-nowrap font-semibold text-slate-800">{m.label}</TD>
                      <TD className="tabular-nums text-slate-700">{formatINR(m.taxableValue)}</TD>
                      <TD className="font-semibold tabular-nums text-brand-deep">{formatINR(m.outputGST)}</TD>
                      <TD className="tabular-nums text-slate-500">{formatINR(m.cgst)}</TD>
                      <TD className="tabular-nums text-slate-500">{formatINR(m.sgst)}</TD>
                      <TD className="tabular-nums text-slate-500">{formatINR(m.igst)}</TD>
                      <TD className="tabular-nums text-info">{formatINR(m.inputGST)}</TD>
                      <TD className={`font-semibold tabular-nums ${m.netGSTPayable > 0 ? "text-danger" : "text-slate-400"}`}>
                        {formatINR(m.netGSTPayable)}
                      </TD>
                      <TD className="tabular-nums text-slate-500">{m.invoiceCount}</TD>
                    </TR>
                  ))}
                  {/* Quarter total row */}
                  <TR className="border-t-2 border-line-strong bg-slate-50 hover:bg-slate-50">
                    <TD className="font-semibold text-slate-900">Quarter Total</TD>
                    <TD className="font-semibold tabular-nums text-slate-900">{formatINR(q.taxableValue)}</TD>
                    <TD className="font-semibold tabular-nums text-brand-deep">{formatINR(q.outputGST)}</TD>
                    <TD className="font-semibold tabular-nums text-slate-700">{formatINR(q.cgst)}</TD>
                    <TD className="font-semibold tabular-nums text-slate-700">{formatINR(q.sgst)}</TD>
                    <TD className="font-semibold tabular-nums text-slate-700">{formatINR(q.igst)}</TD>
                    <TD className="font-semibold tabular-nums text-info">{formatINR(q.inputGST)}</TD>
                    <TD className={`font-display text-base font-semibold tabular-nums ${q.netGST > 0 ? "text-danger" : "text-brand-deep"}`}>
                      {formatINR(q.netGST)}
                    </TD>
                    <TD className="font-semibold tabular-nums text-slate-700">{q.months.reduce((s, m) => s + m.invoiceCount, 0)}</TD>
                  </TR>
                </TBody>
              </Table>
            </div>
          </Card>
        ))}

        {/* Expense GST note */}
        {totalInputGST12 === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <div>
              <p className="text-sm font-semibold text-warn">No input GST credits recorded</p>
              <p className="mt-0.5 text-xs text-slate-600">
                Add a <span className="tabular-nums">gst_amount</span> column to your expenses table and start logging GST paid on purchases
                (software, ads, services) to reduce your net payable. Go to{" "}
                <Link href="/admin/finance/expenses" className="font-semibold text-brand-deep underline">Expense Log</Link> to add expenses.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
