"use client";

import { useState, useTransition } from "react";
import { updateGrowthMetric } from "@/app/admin/actions";
import { TrendingUp, TrendingDown, Minus, Edit3, Check, Loader2 } from "lucide-react";

interface GrowthMetric {
  id: string;
  metric_key: string;
  metric_label: string;
  icon: string | null;
  current_value: number | null;
  last_month_value: number | null;
}

function DeltaIndicator({
  current,
  last,
}: {
  current: number;
  last: number;
}) {
  if (last === 0 && current === 0)
    return <Minus className="h-3 w-3 text-slate-300" />;

  const delta = current - last;
  const pct = last > 0 ? Math.round((delta / last) * 100) : 0;

  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
        <TrendingUp className="h-3 w-3" />
        +{pct}%
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
        <TrendingDown className="h-3 w-3" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
      <Minus className="h-3 w-3" />
      0%
    </span>
  );
}

export default function AgencyGrowthCard({
  initialMetrics,
}: {
  initialMetrics: GrowthMetric[];
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const startEdit = (metric: GrowthMetric) => {
    setEditingKey(metric.metric_key);
    setEditValue(String(metric.current_value ?? 0));
  };

  const handleSave = (metricKey: string) => {
    const parsed = parseInt(editValue, 10);
    if (isNaN(parsed) || parsed < 0) return;

    setEditingKey(null);
    // Optimistic update
    setMetrics((prev) =>
      prev.map((m) =>
        m.metric_key === metricKey
          ? { ...m, last_month_value: m.current_value ?? 0, current_value: parsed }
          : m
      )
    );

    startTransition(async () => {
      const result = await updateGrowthMetric(metricKey, parsed);
      if (result.success) {
        setSavedKey(metricKey);
        setTimeout(() => setSavedKey(null), 1500);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          🌱 FortuneMarq Organic Growth
        </h2>
        <span className="text-[10px] text-slate-400 font-medium">
          Click value to edit
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {metrics.map((metric) => (
          <div
            key={metric.metric_key}
            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors group"
          >
            <span className="text-lg flex-shrink-0 w-7 text-center">
              {metric.icon || ""}
            </span>
            <span className="flex-1 text-xs font-medium text-slate-600 truncate">
              {metric.metric_label}
            </span>

            {editingKey === metric.metric_key ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  min={0}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(metric.metric_key);
                    if (e.key === "Escape") setEditingKey(null);
                  }}
                  className="w-24 rounded-lg border border-[#42CA80] bg-white px-2 py-1 text-right text-sm font-bold font-mono text-slate-900 outline-none ring-2 ring-[#42CA80]/20"
                />
                <button
                  onClick={() => handleSave(metric.metric_key)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#42CA80] text-white hover:bg-[#38b571] transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <DeltaIndicator
                  current={metric.current_value ?? 0}
                  last={metric.last_month_value ?? 0}
                />
                <button
                  onClick={() => startEdit(metric)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-mono font-bold tabular-nums text-slate-800 hover:bg-slate-100 transition-colors min-h-[36px]"
                  title="Click to edit"
                >
                  {savedKey === metric.metric_key ? (
                    <Check className="h-3 w-3 text-[#42CA80]" />
                  ) : (
                    <Edit3 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {(metric.current_value ?? 0).toLocaleString("en-IN")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
