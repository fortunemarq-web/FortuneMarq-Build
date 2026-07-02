"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateHealthScore } from "./client-actions";

interface HealthScoreModalProps {
  client: { id: string; business_name: string; package?: any };
  onClose: () => void;
}

const FACTORS = [
  {
    key: "hs_payment",
    label: "Payment Status",
    weight: 0.25,
    hint: "100=on time · 70=minor delay · 40=overdue · 0=stopped",
  },
  {
    key: "hs_results",
    label: "Results Trend",
    weight: 0.30,
    hint: "100=improving · 70=stable · 40=declining · 10=no results",
  },
  {
    key: "hs_engagement",
    label: "Engagement",
    weight: 0.20,
    hint: "100=responds fast · 70=ok · 40=slow · 0=unreachable",
  },
  {
    key: "hs_tenure",
    label: "Relationship Age",
    weight: 0.10,
    hint: "100=6+ months · 70=3–5 months · 40=1–2 months · 20=first month",
  },
  {
    key: "hs_risk",
    label: "Risk Signals",
    weight: 0.15,
    hint: "100=no issues · 60=minor concern · 20=complaint/pause · 0=dispute",
  },
];

export default function HealthScoreModal({ client, onClose }: HealthScoreModalProps) {
  const router = useRouter();
  const pkg = client.package;

  const [scores, setScores] = useState({
    hs_payment: pkg?.hs_payment ?? 70,
    hs_results: pkg?.hs_results ?? 70,
    hs_engagement: pkg?.hs_engagement ?? 70,
    hs_tenure: pkg?.hs_tenure ?? 40,
    hs_risk: pkg?.hs_risk ?? 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalScore = Math.round(
    scores.hs_payment * 0.25 +
    scores.hs_results * 0.30 +
    scores.hs_engagement * 0.20 +
    scores.hs_tenure * 0.10 +
    scores.hs_risk * 0.15
  );

  const getScoreBand = (score: number) => {
    if (score >= 80) return { label: "HEALTHY", color: "text-green-700 bg-green-100 border-green-300" };
    if (score >= 60) return { label: "STABLE", color: "text-info bg-info-soft border-info-line" };
    if (score >= 40) return { label: "AT RISK", color: "text-amber-700 bg-amber-100 border-amber-300" };
    return { label: "CRITICAL", color: "text-red-700 bg-red-100 border-red-300" };
  };

  const band = getScoreBand(finalScore);

  const getScoreCircleColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-info";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateHealthScore(client.id, scores, finalScore);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Health Score</h2>
            <p className="text-xs text-slate-500">{client.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Live Score Display */}
          <div className="text-center py-4">
            <p className={`text-6xl font-bold font-mono tabular-nums ${getScoreCircleColor(finalScore)}`}>
              {finalScore}
            </p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${band.color}`}>
              {band.label}
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            {FACTORS.map((factor) => (
              <div key={factor.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-slate-700">
                    {factor.label}
                    <span className="text-xs text-slate-400 ml-1">
                      ({(factor.weight * 100).toFixed(0)}%)
                    </span>
                  </label>
                  <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                    {scores[factor.key as keyof typeof scores]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={scores[factor.key as keyof typeof scores]}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [factor.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-[#1E7A4F]"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">{factor.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Update Score"}
          </button>
        </div>
      </div>
    </div>
  );
}
