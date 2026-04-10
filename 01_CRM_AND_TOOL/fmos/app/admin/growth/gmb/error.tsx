"use client";

import Link from "next/link";

export default function AcquisitionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Failed to load Client Acquisition Tracker</h2>
        <p className="text-sm text-slate-500">{error.message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="rounded-lg bg-[#42CA80] px-4 py-2 text-sm font-semibold text-white">Try Again</button>
          <Link href="/admin/growth" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Back</Link>
        </div>
      </div>
    </div>
  );
}
