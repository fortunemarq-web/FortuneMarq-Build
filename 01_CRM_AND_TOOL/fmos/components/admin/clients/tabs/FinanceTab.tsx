"use client";
import { Receipt, Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import InvoicePDF from "@/components/admin/finance/InvoicePDF";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

// react-pdf's PDFDownloadLink is a browser-only API — evaluating it during SSR
// throws "PDFDownloadLink is a web specific API". Load it client-side only.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface FinanceTabProps {
  clientId: string;
  invoices: any[];
}

export default function FinanceTab({ clientId, invoices }: FinanceTabProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + Number(inv.paid_amount), 0);
  const outstanding = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').reduce((acc, inv) => acc + Number(inv.total_amount), 0);

  // Every invoice status maps to one of the five tones — no per-status rainbow.
  const STATUS_TONE: Record<string, Tone> = {
    paid: "brand",
    unpaid: "warning",
    overdue: "danger",
    cancelled: "neutral",
    partially_paid: "info",
  };

  return (
    <div className="space-y-6">
      {/* Finance Summary */}
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-brand-soft p-2 text-brand-deep">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">Financial Summary</h3>
            <p className="text-xs text-slate-500">All-time billing for this client</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-slate-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Total Invoiced</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-slate-900">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div className="rounded-xl border border-brand-line bg-brand-soft p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-deep">Total Paid</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-brand-deep">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-xl border border-danger-line bg-danger-soft p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-danger">Outstanding</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-danger">{formatCurrency(outstanding)}</p>
          </div>
        </div>
      </Card>

      {/* Invoice History Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-slate-50 px-5 py-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invoice History
          </h4>
          <Badge tone="neutral" size="sm">
            {invoices.length} Records
          </Badge>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Invoice</TH>
                  <TH>Date</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH className="pr-8 text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((inv) => (
                  <TR key={inv.id} className="group">
                    <TD>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-brand-deep" />
                        <span className="text-xs font-semibold tabular-nums text-slate-900">{inv.invoice_number}</span>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-xs text-slate-500">{new Date(inv.issue_date).toLocaleDateString()}</span>
                    </TD>
                    <TD>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(inv.total_amount)}</span>
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONE[inv.status] || "neutral"} size="sm" className="capitalize">
                        {inv.status}
                      </Badge>
                    </TD>
                    <TD className="pr-6 text-right">
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={inv} />}
                        fileName={`${inv.invoice_number}.pdf`}
                        className="inline-block rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-soft hover:text-brand-deep"
                      >
                        {({ loading }) => (
                          <Download className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                        )}
                      </PDFDownloadLink>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto max-w-xs">
              <Clock className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No invoice data available yet.</p>
              <p className="mt-1 text-xs text-slate-400">
                Invoices generated in the Invoice Manager will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warn">Attention Required</p>
          <p className="text-[11px] font-medium leading-relaxed text-warn">
            Payment reminders are sent via WhatsApp. If an invoice is overdue, you can trigger a reminder from the main Invoice Manager.
          </p>
        </div>
      </div>
    </div>
  );
}
