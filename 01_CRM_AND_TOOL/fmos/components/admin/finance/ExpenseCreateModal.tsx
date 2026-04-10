"use client";

import { useState } from "react";
import { X, Receipt, Search, PlusCircle, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { createExpense } from "@/app/admin/finance/actions";

interface ExpenseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onSuccess: (newExp: any) => void;
}

export default function ExpenseCreateModal({ isOpen, onClose, clients, onSuccess }: ExpenseCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState("Marketing");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState(""); // optional
  const [isRecurring, setIsRecurring] = useState(false);

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

      const result = await createExpense(expenseData) as any;
      onSuccess({ ...result, clients: clients.find(c => c.id === clientId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Log Agency Expense</h2>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase opacity-80">FortuneMarq Finance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Choose a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Date</label>
              <input 
                type="date" 
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Description</label>
              <input 
                type="text" 
                placeholder="Software subscription, Office rent, Meta Ad Spend..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Attribute to Client (Optional)</label>
              <select 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
              >
                <option value="">General Agency</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-2xl flex items-center justify-between border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors`}>
                <RefreshCcw className={`h-4 w-4 ${isRecurring ? 'text-white translate-x-0' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Monthly Recurring</p>
                <p className="text-[10px] text-slate-500 font-medium">Auto-renew this expense every month</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${isRecurring ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
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
            className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-950/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Saving..." : <><PlusCircle className="h-4 w-4" /> Save Expense</>}
          </button>
        </div>
      </div>
    </div>
  );
}
