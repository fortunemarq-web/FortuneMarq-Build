"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface StrategyInputPanelProps {
  destination?: string;
  defaultTimeframe?: string;
}

export default function StrategyInputPanel({ 
  destination = "agency_growth.instagram",
  defaultTimeframe = "30_days"
}: StrategyInputPanelProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Strategy-to-Task Engine</h3>
        </div>
      </div>
      
      <div className="p-6 relative">
        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-4">
            Have a strategy ready? Our AI Engine can automatically break down any text document into actionable tasks and route them here.
          </p>
          <button
            onClick={() => router.push(`/admin/strategy?destination=${destination}&timeframe=${defaultTimeframe}`)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:from-indigo-600 hover:to-purple-700 transition-all min-h-[44px]"
          >
            <Sparkles className="h-4 w-4" /> Go to Strategy Engine <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
