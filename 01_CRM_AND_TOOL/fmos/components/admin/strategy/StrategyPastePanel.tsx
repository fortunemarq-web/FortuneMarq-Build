"use client";

import { useState } from "react";
import { Bot, FileText, ArrowRight, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractStrategyTasks } from "@/app/admin/strategy/actions";

export default function StrategyPastePanel({ 
  destination, 
  timeframe, 
  assignee 
}: { 
  destination: string, 
  timeframe: string, 
  assignee: string 
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleGenerate = async () => {
    if (!text) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await extractStrategyTasks({ text, destination, timeframe, assignee });

      if (!result.success) {
        throw new Error(result.error);
      }

      const parsedTasks = result.data;

      sessionStorage.setItem("STRATEGY_REVIEW_DATA", JSON.stringify({
        sourceText: text,
        destination,
        timeframe,
        generated: parsedTasks,
      }));

      router.push("/admin/strategy/review");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to process strategy: ${message}`);
      setIsProcessing(false);
    }
  };


  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-100">
          <div className="h-full bg-indigo-500 animate-[pulse_2s_infinite] w-1/3 rounded-r-full" />
        </div>
        
        <Bot className="h-16 w-16 text-indigo-500 mx-auto mb-6 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Reading your strategy...</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Claude is analyzing the document, identifying actionable items, and structuring them into tasks. This takes about 5-15 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 3: Paste Strategy File</h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Paste the raw markdown from Claude.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <XCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#42CA80] focus-within:ring-1 focus-within:ring-[#42CA80] transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`---
STRATEGY_TYPE: instagram_organic
DESTINATION: agency_growth.instagram
...
# Objectives
- Reach 500 followers by end of April

## Week 1 Tasks
- [TASK] Create brand intro reel | DUE: March 15 | PRIORITY: high
`}
          className="w-full h-[400px] p-4 text-sm font-mono text-slate-700 bg-slate-50/50 resize-y focus:outline-none focus:bg-white"
        />
        
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>{charCount.toLocaleString()} chars</span>
            <div className="w-px h-3 bg-slate-300" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setText("")}
              disabled={!text}
              className="text-xs font-semibold text-slate-500 hover:text-red-500 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={!text || wordCount < 10}
              className="flex items-center gap-2 bg-[#42CA80] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#38b571] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate Tasks <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
