"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TeamLoadChartProps {
  data: { name: string; tasks: number }[];
}

const COLORS = ["#42CA80", "#3b82f6", "#f59e0b", "#ef4444", "#64748b"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-line bg-surface p-3 shadow-md">
        <p className="text-sm font-medium text-slate-900">{payload[0].payload.name}</p>
        <p className="text-lg font-semibold tabular-nums text-brand-deep">
          {payload[0].value} tasks
        </p>
      </div>
    );
  }
  return null;
};

export default function TeamLoadChart({ data }: TeamLoadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-line bg-slate-50">
        <p className="text-sm text-slate-500">No task assignment data</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data as any} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={{ stroke: "#e2e8f0" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(66, 202, 128, 0.08)" }} />
          <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

