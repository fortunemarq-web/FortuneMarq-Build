"use client";

import { useEffect } from "react";
import { BarChart2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

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
    <div className="min-h-full bg-canvas px-4 py-8 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft border border-danger-line">
          <BarChart2 className="h-6 w-6 text-danger" />
        </div>
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-1">
          Failed to load Build Tracker
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "Something went wrong loading the tracker data. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/admin" className={buttonVariants({ variant: "secondary" })}>
            ← Back to Hub
          </a>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
