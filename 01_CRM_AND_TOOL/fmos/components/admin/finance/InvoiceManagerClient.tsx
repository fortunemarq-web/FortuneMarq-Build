"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Download, MoreVertical, Send, CheckCircle2, AlertCircle, FileText, Trash2, X, ChevronRight, Pencil, Ban, Repeat, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createInvoice, recordInvoicePayment, cancelInvoice, deleteInvoice, generateMonthlyInvoices } from "@/app/admin/finance/actions";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import InvoiceCreateModal from "@/components/admin/finance/InvoiceCreateModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "@/components/admin/finance/InvoicePDF";

interface InvoiceManagerClientProps {
  initialInvoices: any[];
  clients: any[];
  settings?: any;
}

export default function InvoiceManagerClient({ initialInvoices, clients, settings }: InvoiceManagerClientProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);

  // router.refresh() re-renders the server page with fresh data; without this
  // sync the list keeps showing the stale snapshot from first mount.
  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateMrr = async () => {
    if (!confirm("Generate this month's MRR invoices for all active clients with a retainer? Clients already billed this month are skipped.")) return;
    setGenerating(true);
    try {
      const res = await generateMonthlyInvoices();
      if (res.created === 0 && res.errors.length === 0) {
        toast.info("Nothing to generate", `All retainer clients are already billed this month (${res.skipped} skipped).`);
      } else {
        toast.success(`${res.created} invoice${res.created !== 1 ? "s" : ""} generated`, res.skipped > 0 ? `${res.skipped} already billed — skipped` : "");
      }
      res.errors.forEach((e) => toast.error("Generation issue", e));
      router.refresh();
    } catch (err) {
      toast.error("Could not generate invoices", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  // WhatsApp payment reminder — wa.me deep link, no infra needed
  const buildReminderLink = (inv: any) => {
    const phone = inv.clients?.phone ? String(inv.clients.phone).replace(/\D/g, "").slice(-10) : null;
    if (!phone) return null;
    const days = inv.due_date ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000) : 0;
    const dueLine = days > 0
      ? `was due on ${new Date(inv.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} (${days} day${days > 1 ? "s" : ""} ago)`
      : `is due on ${new Date(inv.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`;
    const msg = `Hi! This is a gentle reminder from FortuneMarq.\n\nInvoice *${inv.invoice_number}* for *₹${Number(inv.total_amount).toLocaleString("en-IN")}* ${dueLine}.\n\nYou can pay via bank transfer or UPI — let me know if you need the details or the invoice PDF again.\n\nThank you!\n— Jabeer, FortuneMarq`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.clients?.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesRevenue = revenueFilter === "all" || (inv.revenue_type || 'mrr') === revenueFilter;
    return matchesSearch && matchesStatus && matchesRevenue;
  });

  const handleRecordPayment = async (inv: any) => {
    const remaining = Math.max(0, Number(inv.total_amount) - (Number(inv.paid_amount) || 0));
    const amountStr = await promptModal({
      title: `Record payment — ${inv.invoice_number}`,
      description: `Outstanding: ${formatCurrency(remaining)}. Enter the amount received (partial payments allowed).`,
      type: "text",
      defaultValue: String(remaining),
      confirmLabel: "Next",
    });
    if (!amountStr) return;
    const amount = Number(amountStr.replace(/[^0-9.]/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Invalid amount", "Enter a positive number.");
      return;
    }
    const method = await promptModal({
      title: "Payment method",
      type: "select",
      options: [
        { value: "upi", label: "UPI" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "cash", label: "Cash" },
        { value: "cheque", label: "Cheque" },
        { value: "card", label: "Card" },
        { value: "other", label: "Other" },
      ],
      confirmLabel: "Record Payment",
    });
    if (!method) return;

    const res = await recordInvoicePayment(inv.id, amount, method);
    if (!res.success) {
      toast.error("Could not record payment", res.error);
      return;
    }
    setInvoices(prev => prev.map(i =>
      i.id === inv.id
        ? { ...i, status: res.status, paid_amount: res.paidAmount, paid_at: new Date().toISOString(), payment_method: method }
        : i
    ));
    toast.success(
      res.status === 'paid' ? "Invoice fully paid" : "Partial payment recorded",
      res.status === 'paid' ? "" : `${formatCurrency(res.remaining || 0)} still outstanding`
    );
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel (void) this invoice? It stays in the list for your records but stops counting as outstanding.")) return;
    try {
      await cancelInvoice(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'cancelled' } : inv));
      toast.success("Invoice cancelled");
    } catch (err) {
      toast.error("Error cancelling invoice: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Permanently delete ${invoiceNumber}? This can't be undone. Use Cancel instead if it was ever sent to the client.`)) return;
    try {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success("Invoice deleted");
    } catch (err) {
      toast.error("Error deleting invoice: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const statusColors: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    unpaid: 'bg-amber-50 text-amber-600 border-amber-100',
    partially_paid: 'bg-blue-50 text-blue-600 border-blue-100',
    overdue: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  const isPayable = (s: string) => s === 'unpaid' || s === 'overdue' || s === 'partially_paid';

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-1">
            <Link href="/admin/finance" className="hover:text-slate-700">Finance</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">Invoice Manager</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateMrr}
            disabled={generating}
            title="One invoice per active retainer client; already-billed clients are skipped"
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            Generate MRR Invoices
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-deep hover:bg-brand-hover text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Grid Layout Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by invoice number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select 
            value={revenueFilter}
            onChange={(e) => setRevenueFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All Revenues</option>
            <option value="mrr">MRR</option>
            <option value="setup">Setup Fee</option>
            <option value="one_time">One-Time</option>
          </select>
          {/* (export button removed — it did nothing; add back when CSV export exists) */}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice #</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Client</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Issue Date</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total (Inc GST)</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-900">{inv.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm font-semibold text-slate-700">{inv.clients?.business_name}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs text-slate-500 font-medium">{new Date(inv.issue_date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(inv.total_amount)}</span>
                      <span className="text-[10px] text-slate-400">Sub: {formatCurrency(inv.subtotal)} | GST: {formatCurrency(inv.gst_amount)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {(inv.revenue_type || "mrr").replace("_", "-")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[inv.status] || statusColors.unpaid}`}>
                      {String(inv.status).replace("_", " ")}
                    </span>
                    {inv.status === 'partially_paid' && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatCurrency(Number(inv.paid_amount) || 0)} received
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {isPayable(inv.status) && (
                        <button
                          onClick={() => handleRecordPayment(inv)}
                          title="Record payment (full or partial)"
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}

                      {isPayable(inv.status) && buildReminderLink(inv) && (
                        <a
                          href={buildReminderLink(inv)!}
                          target="_blank"
                          rel="noreferrer"
                          title="Send payment reminder on WhatsApp"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}

                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button
                          onClick={() => { setEditInvoice(inv); setIsModalOpen(true); }}
                          title="Edit invoice"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {/* PDF DOWNLOAD LINK */}
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={inv} settings={settings} />}
                        fileName={`${inv.invoice_number}.pdf`}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {({ loading }) => (
                          <Download className={`h-4 w-4 ${loading ? 'animate-pulse opacity-50' : ''}`} />
                        )}
                      </PDFDownloadLink>

                      {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          title="Cancel (void) invoice"
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
                          title="Delete invoice"
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No invoices found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <InvoiceCreateModal
          key={editInvoice?.id ?? "new"}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditInvoice(null); }}
          clients={clients}
          editInvoice={editInvoice}
          onSuccess={(newInv) => {
            if (editInvoice) {
              setInvoices(prev => prev.map(inv => inv.id === newInv.id ? { ...inv, ...newInv } : inv));
              toast.success("Invoice updated");
            } else {
              setInvoices([newInv, ...invoices]);
              toast.success("Invoice created");
            }
            setIsModalOpen(false);
            setEditInvoice(null);
          }}
        />
      )}

    </div>
  );
}
