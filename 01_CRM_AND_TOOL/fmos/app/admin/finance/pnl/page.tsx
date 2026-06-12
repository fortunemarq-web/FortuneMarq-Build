import { createServerClientWithCookies } from "@/lib/supabase-server";
import { TrendingUp, TrendingDown, DollarSign, Wallet, FileBarChart, ArrowRight, ChevronRight, Activity, Percent } from "lucide-react";
import Link from "next/link";
import { getRevenueVsExpensesChartData } from "../actions";

export default async function PnLPage() {
  const pnlData = await getRevenueVsExpensesChartData();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateMargin = (rev: number, exp: number) => {
    if (rev === 0) return 0;
    return (((rev - exp) / rev) * 100).toFixed(1);
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-1">
              <Link href="/admin/finance" className="hover:text-indigo-600">Finance</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-900">Profit & Loss</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <FileBarChart className="h-8 w-8 text-indigo-600" />
              P&L Statement
            </h1>
            <p className="text-slate-500 mt-1">Net profitability and fiscal health over the last 6 months</p>
          </div>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
             <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wider">Historical</div>
             <div className="px-4 py-2 text-slate-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed">Projections</div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Financial Month</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">MRR</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Setup</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">One-Time</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Total Rev</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Expenses</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Net Profit</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pnlData.map((row: any, i) => {
                  const margin = Number(calculateMargin(row.revenue, row.expenses));
                  const isPositive = margin > 0;
                  const isBreakEven = margin === 0 && row.revenue > 0;
                  
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{row.name}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-xs font-bold text-slate-600">{formatCurrency(row.mrr || 0)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-xs font-bold text-slate-600">{formatCurrency(row.setupFee || 0)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-xs font-bold text-slate-600">{formatCurrency(row.oneTime || 0)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-sm font-bold text-emerald-600">{formatCurrency(row.revenue)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono text-sm font-bold text-red-500">-{formatCurrency(row.expenses)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`font-mono text-sm font-black ${isPositive ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {formatCurrency(row.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 
                          isBreakEven ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600'
                        }`}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {margin}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
              <Activity className="h-6 w-6 mb-4 opacity-50" />
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Avg. Monthly Profit</p>
              <h3 className="text-3xl font-black font-mono">
                {formatCurrency(pnlData.reduce((acc, r) => acc + r.profit, 0) / pnlData.length)}
              </h3>
           </div>
           
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <Percent className="h-6 w-6 mb-4 text-[#42CA80]" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Health Score</p>
              <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900">84/100</h3>
                 <span className="text-[10px] font-bold text-emerald-500 mb-1">Optimal</span>
              </div>
           </div>

           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <Wallet className="h-6 w-6 mb-4 text-orange-400" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Cash Reserves</p>
              <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900">₹8.4L</h3>
                 <span className="text-[10px] font-bold text-slate-400 mb-1">Approx.</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
