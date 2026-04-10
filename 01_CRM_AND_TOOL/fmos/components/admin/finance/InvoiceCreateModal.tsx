"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calculator, Info } from "lucide-react";
import { createInvoice } from "@/app/admin/finance/actions";

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onSuccess: (newInv: any) => void;
}

export default function InvoiceCreateModal({ isOpen, onClose, clients, onSuccess }: InvoiceCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [revenueType, setRevenueType] = useState("mrr");
  const [includeGst, setIncludeGst] = useState(true);
  const [notes, setNotes] = useState("");

  const [lineItems, setLineItems] = useState([
    { description: "", amount: 0 }
  ]);

  // Derived state
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const gstAmount = includeGst ? subtotal * 0.18 : 0;
  const totalAmount = subtotal + gstAmount;

  useEffect(() => {
    // 1. Set default due date (+15 days)
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setDueDate(d.toISOString().split('T')[0]);

    // 2. Generate a temporary invoice number based on current year and random part
    // Proper unique numbering should ideally come from DB check, but local placeholder is fine.
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`FM-${year}-${random}`);
  }, []);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newList = [...lineItems];
    newList[index] = { ...newList[index], [field]: value };
    setLineItems(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return setError("Please select a client.");
    if (lineItems.some(i => !i.description || i.amount <= 0)) return setError("Please fix line items.");

    setLoading(true);
    setError(null);

    try {
      const invData = {
        invoice_number: invoiceNumber,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        notes,
        status: 'unpaid',
        revenue_type: revenueType
      };

      const result = await createInvoice(invData, lineItems) as any;
      // Wait for revalidation or optimistic update
      onSuccess({ ...result, clients: clients.find(c => c.id === clientId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase opacity-80">FortuneMarq Finance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8 flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex gap-2">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Primary Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Select Client</label>
              <select 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Invoice Number</label>
              <input 
                type="text" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Revenue Type</label>
              <select 
                value={revenueType}
                onChange={(e) => setRevenueType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="mrr">Monthly Retainer (MRR)</option>
                <option value="setup">Setup Fee</option>
                <option value="one_time">One-Time Project</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Issue Date</label>
                <input 
                  type="date" 
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Services & Line Items</h3>
              <button 
                type="button"
                onClick={addLineItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Service description..."
                      value={item.description}
                      onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length === 1}
                    className="mt-2.5 p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Include GST (18%)</span>
                <button 
                  type="button"
                  onClick={() => setIncludeGst(!includeGst)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${includeGst ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeGst ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400">SUBTOTAL</p>
                <p className="text-lg font-bold text-slate-900 font-mono">₹{subtotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {includeGst && (
              <div className="flex justify-between items-center text-sm">
                <p className="font-semibold text-slate-500 italic">Central Tax (CGST + SGST)</p>
                <p className="font-bold text-slate-600 font-mono">₹{gstAmount.toLocaleString('en-IN')}</p>
              </div>
            )}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Amount</p>
              <p className="text-2xl font-black text-indigo-600 font-mono">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes / Payment Instructions</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Bank details, internal project code, etc."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-24 focus:outline-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50 gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit} 
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Invoice →"}
          </button>
        </div>
      </div>
    </div>
  );
}
