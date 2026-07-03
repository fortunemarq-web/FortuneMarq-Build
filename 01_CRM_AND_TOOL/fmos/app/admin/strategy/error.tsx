"use client";

import Link from "next/link";
import { Copy, AlertTriangle } from "lucide-react";

export default function AgencyGrowthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-full bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Failed to load Growth Hub
        </h2>
        <p className="text-sm text-slate-500">{error.message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-brand-deep px-6 py-3 text-sm font-semibold text-white hover:bg-brand-active transition-colors min-h-[44px]"
          >
            Try Again
          </button>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-surface px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Go to Command Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
