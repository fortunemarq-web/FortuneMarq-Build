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
        <div className="rounded-lg border border-line bg-surface p-4 shadow-md">
          <p className="mb-3 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded bg-brand"></div>
                <p className="text-xs font-medium text-slate-500">Revenue</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900">₹{payload[0].value.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded bg-danger"></div>
                <p className="text-xs font-medium text-slate-500">Expenses</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900">₹{payload[1].value.toLocaleString('en-IN')}</p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-8 border-t border-line pt-2">
              <p className="text-xs font-semibold text-brand-deep">Net Profit</p>
              <p className="text-sm font-semibold tabular-nums text-brand-deep">₹{payload[2].value.toLocaleString('en-IN')}</p>
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
            fill="#42CA80"
            radius={[4, 4, 0, 0]}
            barSize={isMobile ? 15 : 25}
          />
          <Bar
            dataKey="expenses"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={isMobile ? 15 : 25}
          />
          <Area
            type="monotone"
            dataKey="profit"
            fill="url(#colorProfit)"
            stroke="#1E7A4F"
            strokeWidth={3}
          />
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E7A4F" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#1E7A4F" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
