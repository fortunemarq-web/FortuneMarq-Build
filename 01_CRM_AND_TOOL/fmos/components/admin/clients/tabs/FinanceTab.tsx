"use client";
import { Receipt, Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "@/components/admin/finance/InvoicePDF";

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

  const statusColors: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    unpaid: 'bg-amber-50 text-amber-600 border-amber-100',
    overdue: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className="space-y-6">
      {/* Finance Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
           style={{ borderTop: "3px solid #4F46E5" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Financial Summary</h3>
            <p className="text-xs text-slate-500 font-medium">All-time billing for this client</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Invoiced</p>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-600/60 font-bold uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
            <p className="text-xs text-rose-600/60 font-bold uppercase tracking-widest mb-1">Outstanding</p>
            <p className="text-2xl font-black text-rose-600 font-mono tracking-tighter">{formatCurrency(outstanding)}</p>
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Invoice History
          </h4>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
            {invoices.length} Records
          </span>
        </div>
        
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 font-medium">{new Date(inv.issue_date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(inv.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusColors[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={inv} />}
                        fileName={`${inv.invoice_number}.pdf`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-block"
                      >
                        {({ loading }) => (
                          <Download className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                        )}
                      </PDFDownloadLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="max-w-xs mx-auto">
              <Clock className="h-10 w-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-500 font-medium">No invoice data available yet.</p>
              <p className="text-xs text-slate-300 mt-1">
                Invoices generated in the Invoice Manager will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1">Attention Required</p>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            Payment reminders are sent via WhatsApp. If an invoice is overdue, you can trigger a reminder from the main Invoice Manager.
          </p>
        </div>
      </div>
    </div>
  );
}
