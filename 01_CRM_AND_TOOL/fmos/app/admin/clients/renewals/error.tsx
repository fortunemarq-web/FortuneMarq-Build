"use client";

import Link from "next/link";

export default function RenewalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load renewals</h2>
        <p className="text-sm text-slate-500">{error.message}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="rounded-xl bg-[#42CA80] px-6 py-3 text-sm font-semibold text-white hover:bg-[#38b571] transition-colors min-h-[44px]">
            Try Again
          </button>
          <Link href="/admin/clients" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]">
            Back to Clients
          </Link>
        </div>
      </div>
    </div>
  );
}
