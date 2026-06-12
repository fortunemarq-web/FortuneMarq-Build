"use client";

import { useEffect } from "react";
import { BarChart2, RefreshCw } from "lucide-react";

export default function BuildTrackerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Build Tracker error:", error);
  }, [error]);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100">
          <BarChart2 className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Failed to load Build Tracker
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "Something went wrong loading the tracker data. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/admin"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ← Back to Hub
          </a>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[#42CA80] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#38b571] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
