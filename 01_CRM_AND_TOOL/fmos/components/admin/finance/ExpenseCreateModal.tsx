"use client";

import { useState } from "react";
import { X, Receipt, PlusCircle, AlertTriangle, RefreshCcw } from "lucide-react";
import { createExpense, updateExpense } from "@/app/admin/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ExpenseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onSuccess: (newExp: any) => void;
  /** When set, the modal edits this expense instead of creating a new one. */
  editExpense?: any | null;
}

export default function ExpenseCreateModal({ isOpen, onClose, clients, onSuccess, editExpense }: ExpenseCreateModalProps) {
  const isEdit = !!editExpense;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [expenseDate, setExpenseDate] = useState(editExpense?.expense_date ?? new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(editExpense?.category ?? "");
  const [description, setDescription] = useState(editExpense?.description ?? "");
  const [amount, setAmount] = useState(editExpense?.amount != null ? String(editExpense.amount) : "");
  const [clientId, setClientId] = useState(editExpense?.client_id ?? ""); // optional
  const [isRecurring, setIsRecurring] = useState(editExpense?.is_recurring ?? false);

  const categories = ["Ad Spend", "Subscription", "Stipend/Salary", "Office", "Tools & Software", "Misc"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return setError("Please select a category.");
    if (!description) return setError("Please enter a description.");
    if (!amount || Number(amount) <= 0) return setError("Please enter a valid amount.");

    setLoading(true);
    setError(null);

    try {
      const expenseData = {
        expense_date: expenseDate,
        category,
        description,
        amount: Number(amount),
        client_id: clientId || null,
        is_recurring: isRecurring
      };

      const result = isEdit
        ? await updateExpense(editExpense.id, expenseData) as any
        : await createExpense(expenseData) as any;
      onSuccess({ ...result, clients: clients.find(c => c.id === clientId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-soft p-2.5 text-brand-deep">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">{isEdit ? "Edit Expense" : "Log Agency Expense"}</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">FortuneMarq Finance</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="flex gap-2 rounded-lg border border-danger-line bg-danger-soft p-4 text-sm font-medium text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Choose a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                type="text"
                placeholder="Software subscription, Office rent, Meta Ad Spend..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-semibold tabular-nums"
              />
            </div>
            <div>
              <Label>Attribute to Client (Optional)</Label>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">General Agency</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 transition-colors ${isRecurring ? 'bg-brand-deep' : 'bg-slate-200'}`}>
                <RefreshCcw className={`h-4 w-4 ${isRecurring ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-slate-900">Monthly Recurring</p>
                <p className="text-[11px] font-medium text-slate-500">Auto-renew this expense every month</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative flex h-6 w-10 items-center rounded-full px-1 transition-colors ${isRecurring ? 'bg-brand-deep' : 'bg-slate-300'}`}
            >
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-line bg-slate-50 p-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : <><PlusCircle className="h-4 w-4" /> {isEdit ? "Save Changes" : "Save Expense"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
