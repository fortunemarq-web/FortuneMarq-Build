"use client";

import { useEffect } from "react";
import Link from "next/link";
import { recoverFromStaleAssets } from "@/lib/stale-asset-recovery";

// App-wide error boundary — replaces Next's raw error screen when any route
// throws on the client. Keeps users inside the branded app with a way forward.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Post-deploy skew: if this is a stale-asset error, hard-reload once to pull
    // the current build instead of showing this screen.
    recoverFromStaleAssets(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <img src="/Logo.png" alt="FortuneMarq" className="mb-6 h-14 w-auto object-contain" />
      <h1 className="font-display text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        An unexpected error occurred. You can try again, or head back to your dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-deep px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Go home
        </Link>
      </div>
      {error?.digest && <p className="mt-4 text-[11px] text-slate-400">Ref: {error.digest}</p>}
    </div>
  );
}
