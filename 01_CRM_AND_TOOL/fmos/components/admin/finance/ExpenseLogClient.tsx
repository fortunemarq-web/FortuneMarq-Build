"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, MoreVertical, DollarSign, Wallet, ShoppingCart, Coffee, Settings, MoreHorizontal, ChevronRight, PieChart as PieChartIcon, X, Calendar, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import ExpenseCreateModal from "@/components/admin/finance/ExpenseCreateModal";
import { deleteExpense } from "@/app/admin/finance/actions";
import { toast } from "@/components/ui/toast";

interface ExpenseLogClientProps {
  initialExpenses: any[];
  clients: any[];
  mtdTotal: number;
  chartData: any[];
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#94A3B8'];

export default function ExpenseLogClient({ initialExpenses, clients, mtdTotal, chartData }: ExpenseLogClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleDelete = async (exp: any) => {
    if (!confirm(`Delete this expense (${exp.description})? This can't be undone.`)) return;
    try {
      await deleteExpense(exp.id);
      setExpenses(prev => prev.filter(e => e.id !== exp.id));
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Error deleting expense: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.clients?.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const categoryIcons: Record<string, any> = {
    "Ad Spend": ShoppingCart,
    "Subscription": Wallet,
    "Stipend/Salary": Settings,
    "Office": Coffee,
    "Tools & Software": Calendar,
    "Misc": MoreHorizontal
  };

  const categoryColors: Record<string, string> = {
    "Ad Spend": "bg-indigo-50 text-indigo-600",
    "Subscription": "bg-emerald-50 text-emerald-600",
    "Stipend/Salary": "bg-amber-50 text-amber-600",
    "Office": "bg-rose-50 text-rose-600",
    "Tools & Software": "bg-pink-50 text-pink-600",
    "Misc": "bg-slate-50 text-slate-600"
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-1">
            <Link href="/admin/finance" className="hover:text-slate-700">Finance</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">Expense Log</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-deep hover:bg-brand-hover text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Log Expense
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Stats Card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 relative z-10">Total Expenses MTD</p>
            <h2 className="text-4xl font-black font-mono tracking-tighter relative z-10">{formatCurrency(mtdTotal)}</h2>
          </div>
          <div className="mt-8 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-40"></div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400">Monthly fiscal track</span>
          </div>
        </div>

        {/* Categories Distribution Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '10px', padding: '10px' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 flex-1 w-full">
            {chartData.map((cat, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by description or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Ad Spend">Ad Spend</option>
            <option value="Subscription">Subscription</option>
            <option value="Stipend/Salary">Stipend/Salary</option>
            <option value="Office">Office</option>
            <option value="Tools & Software">Tools & Software</option>
            <option value="Misc">Misc</option>
          </select>
          {/* (filter icon button removed — it did nothing; the select is the filter) */}
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Client Attribute</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.map((exp) => {
                const CategoryIcon = categoryIcons[exp.category] || MoreHorizontal;
                const colors = categoryColors[exp.category] || "bg-slate-50 text-slate-600";
                
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{new Date(exp.expense_date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors}`}>
                        <CategoryIcon className="h-3 w-3" />
                        {exp.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{exp.description}</span>
                        {exp.is_recurring && <span className="text-[10px] text-indigo-500 font-bold">Monthly Recurring</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs text-slate-500 font-medium">{exp.clients?.business_name || "General Agency"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-mono text-sm font-bold text-slate-900">{formatCurrency(exp.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 flex items-center justify-end gap-1 translate-y-2">
                       <button
                        onClick={() => { setEditExpense(exp); setIsModalOpen(true); }}
                        title="Edit expense"
                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                        <Edit3 className="h-3.5 w-3.5" />
                       </button>
                       <button
                        onClick={() => handleDelete(exp)}
                        title="Delete expense"
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                       </button>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center opacity-40">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm font-medium">No expenses logged for this period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ExpenseCreateModal
          key={editExpense?.id ?? "new"}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditExpense(null); }}
          clients={clients}
          editExpense={editExpense}
          onSuccess={(newExp: any) => {
            if (editExpense) {
              setExpenses(prev => prev.map(e => e.id === newExp.id ? { ...e, ...newExp } : e));
              toast.success("Expense updated");
            } else {
              setExpenses([newExp, ...expenses]);
              toast.success("Expense logged");
            }
            setIsModalOpen(false);
            setEditExpense(null);
          }}
        />
      )}

    </div>
  );
}
