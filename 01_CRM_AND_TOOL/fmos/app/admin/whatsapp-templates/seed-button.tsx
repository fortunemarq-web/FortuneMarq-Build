"use client";

import { useState, useTransition } from "react";
import { Database, CheckCircle } from "lucide-react";
import { seedWhatsAppTemplates } from "./actions";

export default function SeedTemplatesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ seeded: number; skipped: number } | null>(null);

  function handleSeed() {
    startTransition(async () => {
      const res = await seedWhatsAppTemplates();
      if (res.success) {
        setResult({ seeded: res.seeded, skipped: res.skipped });
      }
    });
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold">
        <CheckCircle className="h-4 w-4" />
        Seeded {result.seeded} templates ({result.skipped} already existed)
      </div>
    );
  }

  return (
    <button
      onClick={handleSeed}
      disabled={isPending}
      className="flex items-center gap-2 bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
    >
      <Database className="h-4 w-4" />
      {isPending ? "Seeding..." : "Seed 17 Templates"}
    </button>
  );
}
