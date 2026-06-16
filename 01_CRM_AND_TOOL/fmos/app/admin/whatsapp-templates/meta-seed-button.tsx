"use client";

import { useState, useTransition } from "react";
import { CloudUpload, CheckCircle } from "lucide-react";
import { seedMetaTemplates } from "./actions";

export default function SeedMetaTemplatesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ seeded: number; error?: string } | null>(null);

  function handleSeed() {
    startTransition(async () => {
      const res = await seedMetaTemplates();
      setResult({ seeded: res.seeded, error: res.success ? undefined : res.error });
    });
  }

  if (result) {
    if (result.error) {
      return (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold">
          Register failed: {result.error}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold">
        <CheckCircle className="h-4 w-4" />
        Registered {result.seeded} Meta templates from the FINAL set
      </div>
    );
  }

  return (
    <button
      onClick={handleSeed}
      disabled={isPending}
      className="flex items-center gap-2 bg-brand-deep hover:bg-brand-active disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
    >
      <CloudUpload className="h-4 w-4" />
      {isPending ? "Registering..." : "Register 33 Meta Templates"}
    </button>
  );
}
