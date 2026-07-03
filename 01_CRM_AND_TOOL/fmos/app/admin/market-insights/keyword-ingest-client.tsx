"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle2, AlertTriangle, Loader2, BarChart2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { ingestKeywordData, type ParsedNicheData } from "@/actions/keyword-ingest";

// ---------------------------------------------------------------------------
// Niche normaliser — maps CSV filename fragments → canonical leads.industry
// ---------------------------------------------------------------------------
const NICHE_MAP: Record<string, string> = {
  dentalclinic: "DentalClinics",
  dentalclinics: "DentalClinics",
  gym: "Gyms",
  gyms: "Gyms",
  skinclinic: "SkinClinics",
  skinclinics: "SkinClinics",
  realestateagent: "RealEstate",
  realestatecleaned: "RealEstate",
  realestate: "RealEstate",
  carrental: "CarRentals",
  carrentals: "CarRentals",
  interiordesigner: "InteriorDesigners",
  interiordesigners: "InteriorDesigners",
  interiordesign: "InteriorDesigners",
  computertraininginstitute: "ComputerTraining",
  computertrainingcleaned: "ComputerTraining",
  computertraining: "ComputerTraining",
  jeecoaching: "JEECoaching",
  neetcoaching: "NEETCoaching",
  modularkitchen: "ModularKitchen",
  ieltscoaching: "IELTSCoaching",
  tuitioncentre: "TuitionCentres",
  tuitioncentres: "TuitionCentres",
  ivffertilityclinic: "IVFClinics",
  ivfclinic: "IVFClinics",
  ivfclinics: "IVFClinics",
  ivf: "IVFClinics",
  physiotherapy: "Physiotherapy",
  physiotherapyclinic: "Physiotherapy",
};

function normaliseNiche(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  return NICHE_MAP[key] || raw; // return raw if no match — user can edit
}

/** Extract City + raw niche token from a Keyword Planner CSV filename. */
function parseFilename(filename: string): { city: string; rawNiche: string } | null {
  const base = filename.replace(/\.(csv)$/i, "");
  // Remove trailing markers like _Keywords, _Cleaned_Keywords, _Cleaned_Therapy, _empty etc.
  const cleaned = base
    .replace(/_?Keywords?.*$/i, "")
    .replace(/_?Cleaned.*$/i, "")
    .replace(/_?empty.*$/i, "")
    .replace(/-keywords?.*$/i, ""); // Dharwad_gym-keywords

  const parts = cleaned.split("_").filter(Boolean);
  if (parts.length < 2) return null;
  const city = parts[0];
  const rawNiche = parts.slice(1).join("_");
  return { city, rawNiche };
}

const LOW_VOLUME_THRESHOLD = 1000;

// ---------------------------------------------------------------------------
// CSV parser — handles Google Keyword Planner export format
// ---------------------------------------------------------------------------
function parseKeywordCsv(text: string): ParsedNicheData | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const kwIdx = header.findIndex(h => h === "Keyword");
  const volIdx = header.findIndex(h => h === "Avg. monthly searches");
  const bidLowIdx = header.findIndex(h => h === "Top of page bid (low range)");
  const bidHighIdx = header.findIndex(h => h === "Top of page bid (high range)");

  if (kwIdx === -1 || volIdx === -1) return null; // not a KP export

  let totalVolume = 0;
  let totalCpcLow = 0;
  let totalCpcHigh = 0;
  let cpcCount = 0;
  const kwRows: { keyword: string; volume: number }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length <= volIdx) continue;
    const vol = parseFloat(cols[volIdx]) || 0;
    const kw = cols[kwIdx] || "";
    if (!kw) continue;
    totalVolume += vol;
    kwRows.push({ keyword: kw, volume: vol });
    if (bidLowIdx !== -1 && bidHighIdx !== -1) {
      const lo = parseFloat(cols[bidLowIdx]) || 0;
      const hi = parseFloat(cols[bidHighIdx]) || 0;
      if (lo || hi) { totalCpcLow += lo; totalCpcHigh += hi; cpcCount++; }
    }
  }

  const topKeywords = [...kwRows]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20);

  return {
    city: "",        // filled by caller
    industry: "",    // filled by caller
    monthlySearchDemand: Math.round(totalVolume),
    avgCpcLow: cpcCount ? Math.round((totalCpcLow / cpcCount) * 100) / 100 : 0,
    avgCpcHigh: cpcCount ? Math.round((totalCpcHigh / cpcCount) * 100) / 100 : 0,
    topKeywords,
    isLowVolume: totalVolume < LOW_VOLUME_THRESHOLD,
    filename: "",    // filled by caller
  };
}

// ---------------------------------------------------------------------------
// Row state
// ---------------------------------------------------------------------------
interface RowState extends ParsedNicheData {
  status: "pending" | "ok" | "error" | "skipped";
  errorMsg?: string;
}

export default function KeywordIngestClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [pending, startTransition] = useTransition();
  const [ingestDone, setIngestDone] = useState<{ written: number; leadsUpdated: number } | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newRows: RowState[] = [];

    let processed = 0;
    Array.from(files).forEach(file => {
      if (!file.name.endsWith(".csv")) return;
      const parsed = parseFilename(file.name);
      if (!parsed) return;

      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const data = parseKeywordCsv(text);
        processed++;
        if (data) {
          newRows.push({
            ...data,
            city: parsed.city,
            industry: normaliseNiche(parsed.rawNiche),
            filename: file.name,
            status: "pending",
          });
        }
        if (processed === Array.from(files).filter(f => f.name.endsWith(".csv")).length) {
          newRows.sort((a, b) => a.city.localeCompare(b.city) || a.industry.localeCompare(b.industry));
          setRows(prev => {
            // merge: replace existing rows by filename
            const existing = prev.filter(r => !newRows.find(n => n.filename === r.filename));
            return [...existing, ...newRows].sort((a, b) => a.city.localeCompare(b.city) || a.industry.localeCompare(b.industry));
          });
          setIngestDone(null);
        }
      };
      reader.readAsText(file);
    });
  }

  function updateRow(idx: number, field: "city" | "industry", value: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value, status: "pending" } : r));
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  function handleIngest() {
    const validRows = rows.filter(r => r.city && r.industry && r.monthlySearchDemand >= 0);
    if (validRows.length === 0) { toast.error("Nothing to ingest", "Fix city/niche before proceeding"); return; }

    startTransition(async () => {
      const result = await ingestKeywordData(validRows);
      if (result.ok) {
        toast.success("Ingested", `${result.written} niches written, ${result.leadsUpdated} leads updated`);
        setRows(prev => prev.map(r => ({ ...r, status: "ok" })));
        setIngestDone({ written: result.written, leadsUpdated: result.leadsUpdated });
      } else {
        toast.error("Partial errors", result.errors[0] || "");
        const errSet = new Set(result.errors.map(e => e.split(":")[0]));
        setRows(prev => prev.map(r => ({
          ...r,
          status: errSet.has(`${r.city}/${r.industry}`) ? "error" : "ok",
          errorMsg: result.errors.find(e => e.startsWith(`${r.city}/${r.industry}`)),
        })));
      }
    });
  }

  const validCount = rows.filter(r => r.city && r.industry).length;
  const lowVolCount = rows.filter(r => r.isLowVolume).length;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-deep hover:bg-emerald-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Drop Keyword Planner CSVs here or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">Multiple files OK — filename must start with City_Niche (e.g. Hubli_Dental_Clinic_Keywords.csv)</p>
        <input ref={fileRef} type="file" accept=".csv" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {rows.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span><strong>{rows.length}</strong> files loaded</span>
            <span><strong>{validCount}</strong> ready to write</span>
            {lowVolCount > 0 && (
              <span className="text-amber-600 font-medium">{lowVolCount} low-volume (→ Type D)</span>
            )}
            <button
              onClick={() => { setRows([]); setIngestDone(null); }}
              className="ml-auto text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 text-xs">City</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 text-xs">Industry (editable)</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 text-xs">Total volume/mo</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 text-xs">Avg CPC</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600 text-xs">Keywords</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600 text-xs">Type</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600 text-xs">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={row.filename} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <input
                        className="text-sm border border-slate-200 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-brand-deep"
                        value={row.city}
                        onChange={e => updateRow(idx, "city", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="text-sm border border-slate-200 rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-brand-deep"
                        value={row.industry}
                        onChange={e => updateRow(idx, "industry", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {row.monthlySearchDemand.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500 text-xs">
                      ₹{row.avgCpcLow}–{row.avgCpcHigh}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500">
                      {row.topKeywords.length}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.isLowVolume
                        ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">D</span>
                        : <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">A/B/C</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />}
                      {row.status === "error" && (
                        <span title={row.errorMsg}>
                          <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                        </span>
                      )}
                      {row.status === "pending" && <span className="text-xs text-slate-400">–</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeRow(idx)} className="text-slate-700 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ingest button */}
          {!ingestDone && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleIngest}
                disabled={pending || validCount === 0}
                className="rounded-lg bg-brand-deep text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-active disabled:opacity-50 flex items-center gap-2"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
                Write {validCount} niche{validCount !== 1 ? "s" : ""} to market_insights
              </button>
              <p className="text-xs text-slate-400">
                Updates leads.pitch_type + is_low_volume for each niche × city.
              </p>
            </div>
          )}

          {ingestDone && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Ingest complete</p>
                <p>{ingestDone.written} market_insights rows written · {ingestDone.leadsUpdated} leads re-tagged</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
