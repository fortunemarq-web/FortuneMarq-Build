"use client";

import { Fragment, useState, useTransition } from "react";
import { Search, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { runSerpScan, type SerpCompetitorInsight } from "@/actions/serp-scan";
import { generateReportsForNiche } from "@/actions/generate-reports";

interface Row {
  industry: string;
  city: string;
  search_volume: string | null;
  general_insights: { monthlySearchDemand?: number; topKeywords?: unknown[]; updatedAt?: string } | null;
  competitor_insights: SerpCompetitorInsight | null;
}

interface Props {
  rows: Row[];
}

// A competitor_insights value is only a usable SERP scan if it carries the
// bucket breakdown. Legacy/seed rows store a different shape
// ({ top_competitors, competition_level, ... }) with no `buckets`/`topResults`;
// treat those as "not scanned" instead of trusting the shape and crashing.
function asScannedInsight(ci: unknown): SerpCompetitorInsight | null {
  if (ci && typeof ci === "object" && (ci as { buckets?: unknown }).buckets) {
    return ci as SerpCompetitorInsight;
  }
  return null;
}

function BucketBar({ buckets }: { buckets: SerpCompetitorInsight["buckets"] }) {
  const b = buckets ?? { gmb: 0, directories: 0, realSites: 0, socialOther: 0 };
  const segments = [
    { label: "GMB", pct: b.gmb ?? 0, color: "bg-blue-500" },
    { label: "Dirs", pct: b.directories ?? 0, color: "bg-amber-400" },
    { label: "Sites", pct: b.realSites ?? 0, color: "bg-brand-deep" },
    { label: "Other", pct: b.socialOther ?? 0, color: "bg-slate-300" },
  ];
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map(s => s.pct > 0 && (
          <div key={s.label} className={`${s.color}`} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <div className="flex gap-3 text-xs text-slate-500">
        {segments.map(s => (
          <span key={s.label}>
            <span className={`inline-block w-2 h-2 rounded-sm mr-0.5 ${s.color}`} />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SerpScanClient({ rows: initialRows }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [scanning, setScanning] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function key(r: Row) { return `${r.city}__${r.industry}`; }

  function handleScan(row: Row) {
    const k = key(row);
    setScanning(k);
    startTransition(async () => {
      const result = await runSerpScan(row.industry, row.city);
      setScanning(null);
      if (result.ok && result.insight) {
        setRows(prev => prev.map(r =>
          key(r) === k ? { ...r, competitor_insights: result.insight! } : r
        ));
        toast.success("SERP scanned", `${row.industry} in ${row.city} — ${result.insight.totalResults} results classified`);
      } else {
        toast.error("SERP scan failed", result.error || "Unknown error");
      }
    });
  }

  function handleGenerate(row: Row) {
    const k = key(row);
    setGenerating(k);
    startTransition(async () => {
      const result = await generateReportsForNiche(row.industry, row.city);
      setGenerating(null);
      if (result.ok) {
        toast.success("PDFs generated", `${result.generated.length} reports uploaded for ${row.industry} / ${row.city}`);
      } else if (result.generated.length > 0) {
        toast.success("Partial", `${result.generated.length} generated — ${result.errors.length} errors`);
      } else {
        toast.error("Generation failed", result.errors[0] || "Unknown error");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 w-6"></th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">City</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Industry</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Vol / mo</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Type</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Keywords</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">SERP breakdown</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Scanned</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Last updated</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(r => {
            const vol = r.general_insights?.monthlySearchDemand ?? Number(r.search_volume ?? 0);
            const kwCount = r.general_insights?.topKeywords?.length ?? 0;
            const isLow = vol > 0 && vol < 1000;
            const updatedAt = r.general_insights?.updatedAt;
            const ci = asScannedInsight(r.competitor_insights);
            const k = key(r);
            const isScanning = scanning === k;
            const isExpanded = expanded === k;

            return (
              <Fragment key={k}>
                <tr
                  className={`hover:bg-slate-50 cursor-pointer ${isExpanded ? "bg-slate-50" : ""}`}
                  onClick={() => setExpanded(isExpanded ? null : k)}
                >
                  <td className="px-4 py-2 text-slate-400">
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />
                    }
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800">{r.city}</td>
                  <td className="px-4 py-2 text-slate-600">{r.industry}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{vol.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    {isLow
                      ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">D</span>
                      : <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">A/B/C</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-center text-slate-500">{kwCount}</td>
                  <td className="px-4 py-2 min-w-48">
                    {ci ? <BucketBar buckets={ci.buckets} /> : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {ci
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      : <span className="text-xs text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-400">
                    {updatedAt ? new Date(updatedAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleScan(r)}
                        disabled={isScanning || scanning !== null || generating !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-deep hover:text-brand-deep disabled:opacity-40 transition-colors"
                      >
                        {isScanning
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Search className="h-3 w-3" />
                        }
                        {ci ? "Re-scan" : "Scan SERP"}
                      </button>
                      <button
                        onClick={() => handleGenerate(r)}
                        disabled={generating === k || scanning !== null || generating !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-deep hover:text-brand-deep disabled:opacity-40 transition-colors"
                      >
                        {generating === k
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <FileText className="h-3 w-3" />
                        }
                        PDFs
                      </button>
                    </div>
                  </td>
                </tr>

                {isExpanded && ci && (
                  <tr key={`${k}__detail`} className="bg-slate-50 border-b border-slate-200">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          Query: <span className="font-mono text-slate-700">{ci.query}</span>
                          {" · "}Scanned: {new Date(ci.scannedAt).toLocaleString("en-IN")}
                          {" · "}{ci.totalResults} results
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-w-2xl">
                          {(ci.topResults ?? []).map((tr, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs bg-white rounded-lg border border-slate-200 px-3 py-2"
                            >
                              <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-sm ${
                                tr.bucket === "gmb" ? "bg-blue-500"
                                : tr.bucket === "directory" ? "bg-amber-400"
                                : tr.bucket === "realSite" ? "bg-brand-deep"
                                : "bg-slate-300"
                              }`} />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-700 truncate">{tr.title || "—"}</p>
                                <p className="text-slate-400 truncate">{tr.url}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
