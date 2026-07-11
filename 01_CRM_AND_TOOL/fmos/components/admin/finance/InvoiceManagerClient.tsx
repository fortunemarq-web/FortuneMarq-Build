"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Download, CheckCircle2, FileText, Trash2, ChevronRight, Pencil, Ban, Repeat, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createInvoice, recordInvoicePayment, cancelInvoice, deleteInvoice, generateMonthlyInvoices } from "@/app/admin/finance/actions";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import InvoiceCreateModal from "@/components/admin/finance/InvoiceCreateModal";
import dynamic from "next/dynamic";
import InvoicePDF from "@/components/admin/finance/InvoicePDF";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

// react-pdf's PDFDownloadLink is a browser-only API — evaluating it during SSR
// throws "PDFDownloadLink is a web specific API". Load it client-side only.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

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
    const ok = await promptModal({ title: "Generate MRR invoices?", description: "Creates this month's retainer invoices for all active clients. Clients already billed this month are skipped.", confirmLabel: "Generate", type: "select", options: [{ value: "confirm", label: "Yes, generate now" }] });
    if (!ok) return;
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
    const revType = inv.revenue_type || 'mrr';
    const matchesRevenue = revenueFilter === "all" || revType === revenueFilter || (revenueFilter === "setup_fee" && revType === "setup");
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
    const ok = await promptModal({ title: "Cancel this invoice?", description: "It stays in the list for your records but stops counting as outstanding.", confirmLabel: "Cancel Invoice", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, cancel it" }] });
    if (!ok) return;
    try {
      await cancelInvoice(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'cancelled' } : inv));
      toast.success("Invoice cancelled");
    } catch (err) {
      toast.error("Error cancelling invoice: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    const ok = await promptModal({ title: `Delete ${invoiceNumber}?`, description: "This can't be undone. Use Cancel instead if the invoice was ever sent to the client.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete permanently" }] });
    if (!ok) return;
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

  // Every invoice status maps to one of the five tones — no per-status colours.
  const statusTone: Record<string, Tone> = {
    paid: 'brand',
    unpaid: 'warning',
    partially_paid: 'info',
    overdue: 'danger',
    cancelled: 'neutral'
  };

  const isPayable = (s: string) => s === 'unpaid' || s === 'overdue' || s === 'partially_paid';

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/admin/finance" className="hover:text-slate-700">Finance</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">Invoice Manager</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">Invoices</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleGenerateMrr}
            disabled={generating}
            title="One invoice per active retainer client; already-billed clients are skipped"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            Generate MRR Invoices
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Grid Layout Filter Bar */}
      <Card className="flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by invoice number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Filter className="hidden h-4 w-4 text-slate-400 md:block" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-40 md:flex-none"
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={revenueFilter}
            onChange={(e) => setRevenueFilter(e.target.value)}
            className="flex-1 md:w-40 md:flex-none"
          >
            <option value="all">All Revenues</option>
            <option value="mrr">MRR</option>
            <option value="setup_fee">Setup Fee</option>
            <option value="one_time">One-Time</option>
          </Select>
          {/* (export button removed — it did nothing; add back when CSV export exists) */}
        </div>
      </Card>

      {/* Invoice Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Invoice #</TH>
                <TH>Client</TH>
                <TH>Issue Date</TH>
                <TH>Total (Inc GST)</TH>
                <TH>Type</TH>
                <TH className="text-center">Status</TH>
                <TH className="pr-10 text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filteredInvoices.map((inv) => (
                <TR key={inv.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{inv.invoice_number}</span>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-sm font-semibold text-slate-700">{inv.clients?.business_name}</span>
                  </TD>
                  <TD>
                    <span className="text-xs font-medium text-slate-500">{new Date(inv.issue_date).toLocaleDateString()}</span>
                  </TD>
                  <TD>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(inv.total_amount)}</span>
                      <span className="text-[11px] tabular-nums text-slate-400">Sub: {formatCurrency(inv.subtotal)} | GST: {formatCurrency(inv.gst_amount)}</span>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {(inv.revenue_type || "mrr").replace("_", "-")}
                    </span>
                  </TD>
                  <TD className="text-center">
                    <Badge tone={statusTone[inv.status] || "warning"} size="sm" className="capitalize">
                      {String(inv.status).replace("_", " ")}
                    </Badge>
                    {inv.status === 'partially_paid' && (
                      <p className="mt-1 text-[11px] tabular-nums text-slate-400">
                        {formatCurrency(Number(inv.paid_amount) || 0)} received
                      </p>
                    )}
                  </TD>
                  <TD className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPayable(inv.status) && (
                        <button
                          onClick={() => handleRecordPayment(inv)}
                          title="Record payment (full or partial)"
                          className="rounded-lg p-2 text-brand-deep transition-colors hover:bg-brand-soft"
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
                          className="rounded-lg p-2 text-brand-deep transition-colors hover:bg-brand-soft"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}

                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button
                          onClick={() => { setEditInvoice(inv); setIsModalOpen(true); }}
                          title="Edit invoice"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {/* PDF DOWNLOAD LINK */}
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={inv} settings={settings} />}
                        fileName={`${inv.invoice_number}.pdf`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      >
                        {({ loading }) => (
                          <Download className={`h-4 w-4 ${loading ? 'animate-pulse opacity-50' : ''}`} />
                        )}
                      </PDFDownloadLink>

                      {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          title="Cancel (void) invoice"
                          className="rounded-lg p-2 text-warn transition-colors hover:bg-warn-soft"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
                          title="Delete invoice"
                          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
              {filteredInvoices.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={7} className="py-20 text-center">
                    <div className="mx-auto max-w-xs text-slate-400">
                      <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No invoices found matching your filters.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </Card>

      {isModalOpen && (
        <InvoiceCreateModal
          key={editInvoice?.id ?? "new"}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditInvoice(null); }}
          clients={clients}
          editInvoice={editInvoice}
          gstRate={settings?.gst_rate}
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
