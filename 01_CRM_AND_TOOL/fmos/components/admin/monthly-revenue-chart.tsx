"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  name: string;
  value: number;
  fullName: string;
}

interface MonthlyRevenueChartProps {
  data: MonthlyData[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-md">
        <p className="font-medium text-slate-900">{payload[0].payload.fullName}</p>
        <p className="text-sm font-semibold tabular-nums text-brand-deep">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">No revenue data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data as any} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar
          dataKey="value"
          fill="#42CA80"
          radius={[6, 6, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

