"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, MoreVertical, Send, CheckCircle2, AlertCircle, FileText, Trash2, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createInvoice, markInvoiceAsPaid } from "@/app/admin/finance/actions";
import InvoiceCreateModal from "@/components/admin/finance/InvoiceCreateModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "@/components/admin/finance/InvoicePDF";

interface InvoiceManagerClientProps {
  initialInvoices: any[];
  clients: any[];
}

export default function InvoiceManagerClient({ initialInvoices, clients }: InvoiceManagerClientProps) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleMarkAsPaid = async (id: string, amount: number) => {
    if (!confirm("Are you sure you want to mark this invoice as paid?")) return;
    try {
      await markInvoiceAsPaid(id, amount);
      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: 'paid', paid_at: new Date().toISOString(), paid_amount: amount } : inv
      ));
    } catch (err) {
      alert("Error marking invoice as paid: " + (err instanceof Error ? err.message : "Unknown error"));
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
    overdue: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-1">
            <Link href="/admin/finance" className="hover:text-indigo-600">Finance</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">Invoice Manager</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#42CA80] hover:bg-[#38b571] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
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
          <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice #</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Issue Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total (Inc GST)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-900">{inv.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{inv.clients?.business_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-medium">{new Date(inv.issue_date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(inv.total_amount)}</span>
                      <span className="text-[10px] text-slate-400">Sub: {formatCurrency(inv.subtotal)} | GST: {formatCurrency(inv.gst_amount)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {(inv.revenue_type || "mrr").replace("_", "-")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === 'unpaid' || inv.status === 'overdue' ? (
                        <button 
                          onClick={() => handleMarkAsPaid(inv.id, inv.total_amount)}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors title='Mark as Paid'"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      ) : null}
                      
                      {/* PDF DOWNLOAD LINK */}
                      <PDFDownloadLink
                        document={<InvoicePDF invoice={inv} />}
                        fileName={`${inv.invoice_number}.pdf`}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {({ loading }) => (
                          <Download className={`h-4 w-4 ${loading ? 'animate-pulse opacity-50' : ''}`} />
                        )}
                      </PDFDownloadLink>

                      <button 
                        onClick={() => alert("Reminder sent via WhatsApp template.")}
                        className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          clients={clients} 
          onSuccess={(newInv) => {
            setInvoices([newInv, ...invoices]);
            setIsModalOpen(false);
          }}
        />
      )}

    </div>
  );
}
