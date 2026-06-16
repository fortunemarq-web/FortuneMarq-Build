"use client";

import { useState, useTransition } from "react";
import { CloudUpload, CheckCircle } from "lucide-react";
import { seedMetaTemplates } from "./actions";

export default function SeedMetaTemplatesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ seeded: number; skipped: number } | null>(null);

  function handleSeed() {
    startTransition(async () => {
      const res = await seedMetaTemplates();
      if (res.success) {
        setResult({ seeded: res.seeded, skipped: res.skipped });
      }
    });
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold">
        <CheckCircle className="h-4 w-4" />
        Registered {result.seeded} Meta templates ({result.skipped} already existed)
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
      {isPending ? "Registering..." : "Register 24 Meta Templates"}
    </button>
  );
}
