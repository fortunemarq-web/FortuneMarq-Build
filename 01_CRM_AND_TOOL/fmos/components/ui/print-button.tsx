"use client";

import { Printer } from "lucide-react";

/**
 * Triggers the browser print dialog. Pages that render a `.print-area`
 * document get a clean, chrome-free PDF via "Save as PDF".
 */
export default function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
