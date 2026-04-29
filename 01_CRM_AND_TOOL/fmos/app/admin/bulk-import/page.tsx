"use client";

import { useState } from "react";
import { runBulkImport, type BulkImportResult } from "./actions";
import { CheckCircle, AlertTriangle, Upload, FileText, Loader2 } from "lucide-react";

export default function BulkImportPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  async function handleImport() {
    setRunning(true);
    setResult(null);
    try {
      const res = await runBulkImport();
      setResult(res);
    } catch (e: any) {
      setResult({
        totalFiles: 0,
        totalLeads: 0,
        totalAdded: 0,
        totalSkipped: 0,
        errors: [e.message || "Unknown error"],
        fileResults: [],
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Bulk Lead Import</h1>
          <p className="text-sm text-slate-500 mt-1">
            Imports all CSVs from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">07_DATA_AND_RESEARCH/Lead_Database</code>.
            Duplicates are skipped automatically.
          </p>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <strong>⚠️ Run once only.</strong> Re-running after a successful import will skip everything (already exists). If you need a fresh import, clear the leads table first.
          </div>

          <button
            onClick={handleImport}
            disabled={running}
            className="mt-5 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importing — this may take a few minutes…</>
            ) : (
              <><Upload className="h-4 w-4" /> Start Bulk Import</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <div className={`border rounded-2xl p-6 shadow-sm ${result.errors.length > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.errors.length === 0
                  ? <CheckCircle className="h-6 w-6 text-emerald-600" />
                  : <AlertTriangle className="h-6 w-6 text-amber-600" />
                }
                <h2 className="text-base font-bold text-slate-900">Import Complete</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Files", value: result.totalFiles, color: "text-slate-700" },
                  { label: "Leads Found", value: result.totalLeads, color: "text-slate-700" },
                  { label: "Added", value: result.totalAdded, color: "text-emerald-700" },
                  { label: "Skipped", value: result.totalSkipped, color: "text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-red-700 mb-3">Errors ({result.errors.length})</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono bg-red-50 px-2 py-1 rounded">{e}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Per-file breakdown */}
            {result.fileResults.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> File Breakdown
                </h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {result.fileResults.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-600 font-mono truncate max-w-[60%]">{f.file}</span>
                      <span className="shrink-0 ml-2">
                        <span className="text-emerald-700 font-semibold">+{f.added}</span>
                        {f.skipped > 0 && <span className="text-slate-400 ml-2">skip {f.skipped}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
