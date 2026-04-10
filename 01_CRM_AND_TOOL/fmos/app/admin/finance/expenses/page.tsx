import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Plus, Search, Filter, Download, MoreVertical, DollarSign, Wallet, ShoppingCart, Coffee, Settings, MoreHorizontal, ChevronRight, PieChart as PieChartIcon } from "lucide-react";
import Link from "next/link";
import ExpenseLogClient from "@/components/admin/finance/ExpenseLogClient";

export default async function ExpenseLogPage() {
  const supabase = await createServerClientWithCookies();
  
  // 1. Fetch current month expenses
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, clients(id, business_name)')
    .order('expense_date', { ascending: false });

  // 2. Fetch all clients for attributing ad spend
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('status', 'active');

  // 3. Simple aggregation for MTD total
  const mtdExpenses = (expenses || []).filter((e: any) => e.expense_date >= firstDayOfMonth) 
    .reduce((acc: any, curr: any) => acc + Number(curr.amount), 0) || 0;

  // 4. Group by category for small donut chart visualization
  const categoryStats = (expenses || []).reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.keys(categoryStats).map(cat => ({
    name: cat,
    value: categoryStats[cat]
  }));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <ExpenseLogClient 
          initialExpenses={expenses || []} 
          clients={clients || []}
          mtdTotal={mtdExpenses}
          chartData={chartData}
        />
      </div>
    </div>
  );
}
