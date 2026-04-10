"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const MOCK_DATA = [
  { week: 'W1', instagram: 1100, website: 3800, gmb: 11000 },
  { week: 'W2', instagram: 1120, website: 3850, gmb: 11200 },
  { week: 'W3', instagram: 1150, website: 3900, gmb: 11350 },
  { week: 'W4', instagram: 1180, website: 4000, gmb: 11500 },
  { week: 'W5', instagram: 1200, website: 4100, gmb: 11800 },
  { week: 'W6', instagram: 1210, website: 4150, gmb: 12000 },
  { week: 'W7', instagram: 1225, website: 4180, gmb: 12150 },
  { week: 'W8', instagram: 1245, website: 4210, gmb: 12450 },
];

export default function OrganicTrendChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
          Growth Trend (Last 8 Weeks)
        </h3>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
            <Line 
              type="monotone" 
              dataKey="instagram" 
              name="Instagram"
              stroke="#E1306C" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="website" 
              name="Website Sessions"
              stroke="#42CA80" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="gmb" 
              name="GMB Views"
              stroke="#4285F4" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
