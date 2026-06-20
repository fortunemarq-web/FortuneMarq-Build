"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AcquisitionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-full bg-canvas flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="font-display text-xl font-semibold text-slate-900">Failed to load Client Acquisition Tracker</h2>
        <p className="text-sm text-slate-500">{error.message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className={buttonVariants({ variant: "primary" })}>Try Again</button>
          <Link href="/admin/growth" className={buttonVariants({ variant: "secondary" })}>Back</Link>
        </div>
      </div>
    </div>
  );
}
