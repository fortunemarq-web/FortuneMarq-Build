"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ComposedChart,
  Line,
  Area
} from 'recharts';

interface FinanceChartProps {
  data: any[];
}

export default function FinanceChart({ data }: FinanceChartProps) {
  // Mobile check (simple heuristic)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-emerald-500"></div>
                <p className="text-xs font-semibold text-slate-500">Revenue</p>
              </div>
              <p className="text-sm font-bold text-slate-900 font-mono">₹{payload[0].value.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-red-400"></div>
                <p className="text-xs font-semibold text-slate-500">Expenses</p>
              </div>
              <p className="text-sm font-bold text-slate-900 font-mono">₹{payload[1].value.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center justify-between gap-8 pt-2 mt-2 border-t border-slate-50">
              <p className="text-xs font-bold text-indigo-600">Net Profit</p>
              <p className="text-sm font-bold text-indigo-600 font-mono">₹{payload[2].value.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) => `₹${Number(value) >= 1000 ? (value / 1000) + 'k' : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="revenue" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]} 
            barSize={isMobile ? 15 : 25}
          />
          <Bar 
            dataKey="expenses" 
            fill="#F87171" 
            radius={[4, 4, 0, 0]} 
            barSize={isMobile ? 15 : 25}
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            fill="url(#colorProfit)" 
            stroke="#6366F1"
            strokeWidth={3}
          />
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
