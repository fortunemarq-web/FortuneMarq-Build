"use client";

import { useState } from "react";
import { Plus, Search, Wallet, ShoppingCart, Coffee, Settings, MoreHorizontal, ChevronRight, Calendar, Edit3, Trash2 } from "lucide-react";
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
import { promptModal } from "@/components/ui/prompt-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

interface ExpenseLogClientProps {
  initialExpenses: any[];
  clients: any[];
  mtdTotal: number;
  chartData: any[];
}

// Pie slices feed Recharts fill= / inline style — literal hex required (Tailwind
// classes break the chart). Brand green leads; the rest use the semantic palette.
const COLORS = ['#42CA80', '#3b82f6', '#f59e0b', '#ef4444', '#64748b', '#94A3B8'];

export default function ExpenseLogClient({ initialExpenses, clients, mtdTotal, chartData }: ExpenseLogClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleDelete = async (exp: any) => {
    const ok = await promptModal({ title: `Delete expense?`, description: `"${exp.description}" — this can't be undone.`, confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
    if (!ok) return;
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

  // Category is a type, not a status — keep it on the neutral tone (no colour soup).
  const categoryColors: Record<string, string> = {
    "Ad Spend": "bg-slate-100 text-slate-600",
    "Subscription": "bg-slate-100 text-slate-600",
    "Stipend/Salary": "bg-slate-100 text-slate-600",
    "Office": "bg-slate-100 text-slate-600",
    "Tools & Software": "bg-slate-100 text-slate-600",
    "Misc": "bg-slate-100 text-slate-600"
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/admin/finance" className="hover:text-slate-700">Finance</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">Expense Log</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">Expenses</h1>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Log Expense
        </Button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Total Stats Card */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Total Expenses MTD</p>
            <h2 className="font-display text-4xl font-semibold tabular-nums text-slate-900">{formatCurrency(mtdTotal)}</h2>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-brand opacity-40"></div>
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-400">Monthly fiscal track</span>
          </div>
        </Card>

        {/* Categories Distribution Card */}
        <Card className="flex flex-col items-center gap-8 p-6 md:flex-row lg:col-span-2">
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
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', padding: '10px' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid w-full flex-1 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {chartData.map((cat, i) => (
              <div key={i} className="flex flex-col">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Filter Bar */}
      <Card className="flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by description or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:w-48 md:flex-none"
          >
            <option value="all">All Categories</option>
            <option value="Ad Spend">Ad Spend</option>
            <option value="Subscription">Subscription</option>
            <option value="Stipend/Salary">Stipend/Salary</option>
            <option value="Office">Office</option>
            <option value="Tools & Software">Tools & Software</option>
            <option value="Misc">Misc</option>
          </Select>
          {/* (filter icon button removed — it did nothing; the select is the filter) */}
        </div>
      </Card>

      {/* Expense Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Date</TH>
                <TH>Category</TH>
                <TH>Description</TH>
                <TH>Client Attribute</TH>
                <TH className="text-right">Amount</TH>
                <TH className="pr-8 text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filteredExpenses.map((exp) => {
                const CategoryIcon = categoryIcons[exp.category] || MoreHorizontal;
                const colors = categoryColors[exp.category] || "bg-slate-100 text-slate-600";

                return (
                  <TR key={exp.id}>
                    <TD>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{new Date(exp.expense_date).toLocaleDateString()}</span>
                    </TD>
                    <TD>
                      <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${colors}`}>
                        <CategoryIcon className="h-3 w-3" />
                        {exp.category}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{exp.description}</span>
                        {exp.is_recurring && <span className="text-[11px] font-semibold text-brand-deep">Monthly Recurring</span>}
                      </div>
                    </TD>
                    <TD>
                       <span className="text-xs font-medium text-slate-500">{exp.clients?.business_name || "General Agency"}</span>
                    </TD>
                    <TD className="text-right">
                       <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(exp.amount)}</span>
                    </TD>
                    <TD className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditExpense(exp); setIsModalOpen(true); }}
                          title="Edit expense"
                          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          title="Delete expense"
                          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-danger-soft hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
              {filteredExpenses.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={6} className="py-20 text-center text-slate-400">
                    <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No expenses logged for this period.</p>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </Card>

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
