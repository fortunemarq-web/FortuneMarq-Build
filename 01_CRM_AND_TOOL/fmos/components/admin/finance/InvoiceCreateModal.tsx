"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calculator } from "lucide-react";
import { createInvoice, updateInvoice } from "@/app/admin/finance/actions";
import { computeGstAmount, gstBreakdown, resolveGstRate } from "@/lib/finance/gst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onSuccess: (newInv: any) => void;
  /** When set, the modal edits this invoice instead of creating a new one. */
  editInvoice?: any | null;
  /** GST rate (percent) from business settings. Defaults to 18. */
  gstRate?: number;
}

export default function InvoiceCreateModal({ isOpen, onClose, clients, onSuccess, editInvoice, gstRate }: InvoiceCreateModalProps) {
  const rate = resolveGstRate(gstRate);
  const isEdit = !!editInvoice;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState(editInvoice?.client_id ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(editInvoice?.invoice_number ?? "");
  const [issueDate, setIssueDate] = useState(editInvoice?.issue_date ?? new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(editInvoice?.due_date ?? "");
  const [revenueType, setRevenueType] = useState(editInvoice?.revenue_type ?? "mrr");
  const [includeGst, setIncludeGst] = useState(isEdit ? (editInvoice?.gst_amount ?? 0) > 0 : true);
  const [isInterstate, setIsInterstate] = useState<boolean>(editInvoice?.is_interstate ?? false);
  const [notes, setNotes] = useState(editInvoice?.notes ?? "");

  const [lineItems, setLineItems] = useState(
    isEdit && editInvoice?.invoice_line_items?.length
      ? [...editInvoice.invoice_line_items]
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((li: any) => ({ description: li.description, amount: li.amount }))
      : [{ description: "", amount: 0 }]
  );

  // Derived state
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const gstAmount = includeGst ? computeGstAmount(subtotal, rate) : 0;
  const totalAmount = subtotal + gstAmount;
  const gstLines = gstBreakdown(gstAmount, rate, isInterstate);

  useEffect(() => {
    if (isEdit) return; // keep existing values when editing

    // 1. Set default due date (+15 days)
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setDueDate(d.toISOString().split('T')[0]);

    // 2. Generate a temporary invoice number based on current year and random part
    // Proper unique numbering should ideally come from DB check, but local placeholder is fine.
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`FM-${year}-${random}`);
  }, [isEdit]);

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
      const invData: any = {
        invoice_number: invoiceNumber,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        is_interstate: includeGst ? isInterstate : false,
        notes,
        revenue_type: revenueType
      };

      const result = isEdit
        ? await updateInvoice(editInvoice.id, invData, lineItems) as any
        : await createInvoice({ ...invData, status: 'unpaid' }, lineItems) as any;
      // Wait for revalidation or optimistic update
      onSuccess({
        ...result,
        clients: clients.find(c => c.id === clientId),
        invoice_line_items: lineItems.map((li: any, i: number) => ({ ...li, sort_order: i })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-soft p-2.5 text-brand-deep">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">{isEdit ? `Edit Invoice ${editInvoice.invoice_number}` : "Create New Invoice"}</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">FortuneMarq Finance</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-8 overflow-y-auto p-6">
          {error && (
            <div className="flex gap-2 rounded-lg border border-danger-line bg-danger-soft p-4 text-sm font-medium text-danger">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Primary Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Select Client</Label>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Invoice Number</Label>
              <Input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="font-semibold tabular-nums"
              />
            </div>
            <div>
              <Label>Revenue Type</Label>
              <Select
                value={revenueType}
                onChange={(e) => setRevenueType(e.target.value)}
              >
                <option value="mrr">Monthly Retainer (MRR)</option>
                <option value="setup">Setup Fee</option>
                <option value="one_time">One-Time Project</option>
              </Select>
            </div>
            <div className="md:col-span-2 flex gap-6">
              <div className="flex-1">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services & Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Service description..."
                      value={item.description}
                      onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                      className="font-semibold tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length === 1}
                    className="mt-1.5 p-1 text-slate-300 transition-colors hover:text-danger disabled:opacity-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="space-y-4 rounded-xl border border-line bg-slate-50 p-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Include GST ({rate}%)</span>
                <button
                  type="button"
                  onClick={() => setIncludeGst(!includeGst)}
                  className={`relative flex h-6 w-10 items-center rounded-full px-1 transition-colors ${includeGst ? 'bg-brand-deep' : 'bg-slate-300'}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${includeGst ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subtotal</p>
                <p className="font-display text-lg font-semibold tabular-nums text-slate-900">₹{subtotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {includeGst && (
              <>
                {/* Place of supply: intra-state (CGST+SGST) vs inter-state (IGST) */}
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setIsInterstate(!isInterstate)}
                    className={`relative flex h-6 w-10 items-center rounded-full px-1 transition-colors ${isInterstate ? 'bg-brand-deep' : 'bg-slate-300'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform ${isInterstate ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className="font-medium text-slate-600">Inter-state supply (IGST)</span>
                  <span className="text-xs text-slate-400">{isInterstate ? 'client outside Karnataka' : 'client in Karnataka'}</span>
                </div>
                {gstLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between text-sm">
                    <p className="font-medium italic text-slate-500">{line.label}</p>
                    <p className="font-semibold tabular-nums text-slate-600">₹{line.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </>
            )}
            <div className="flex items-center justify-between border-t border-line pt-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Total Amount</p>
              <p className="font-display text-2xl font-semibold tabular-nums text-brand-deep">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes / Payment Instructions</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Bank details, internal project code, etc."
              className="h-24"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-line bg-slate-50 p-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Generate Invoice →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
