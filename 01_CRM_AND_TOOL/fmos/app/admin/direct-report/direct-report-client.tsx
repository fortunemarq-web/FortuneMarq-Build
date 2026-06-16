"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Database, Send, Eye, FlaskConical, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { runDirectReport, type BlastResult } from "@/actions/direct-report";
import { seedReportAssets } from "@/actions/report-assets";

interface Props {
  cities: string[];
  nicheByCity: Record<string, string[]>;
  langs: string[];
  hasLibrary: boolean;
}

const LEAD_TYPES = ["", "A", "B", "C", "D"] as const;

export default function DirectReportClient({ cities, nicheByCity, langs, hasLibrary }: Props) {
  const [city, setCity] = useState(cities[0] || "");
  const niches = useMemo(() => nicheByCity[city] || [], [nicheByCity, city]);
  const [niche, setNiche] = useState(niches[0] || "");
  const [lang, setLang] = useState(langs[0] || "en");
  const [leadType, setLeadType] = useState<string>("");
  const [dailyCap, setDailyCap] = useState("50");
  const [bodyParamsText, setBodyParamsText] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [result, setResult] = useState<BlastResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

  function onCityChange(c: string) {
    setCity(c);
    setNiche((nicheByCity[c] || [])[0] || "");
  }

  function bodyParams(): string[] | undefined {
    const arr = bodyParamsText.split("\n").map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : undefined;
  }

  function baseInput() {
    return {
      city,
      niche,
      lang: lang as "en" | "kn",
      leadType: (leadType || undefined) as any,
      dailyCap: Number(dailyCap) || 50,
      bodyParams: bodyParams(),
    };
  }

  function handleSeed() {
    startTransition(async () => {
      const r = await seedReportAssets();
      if (r.success || r.registered > 0) {
        setSeedMsg(`Uploaded ${r.uploaded}, registered ${r.registered} reports (${r.skipped} skipped). Reload to refresh the pickers.`);
        toast.success("Report library seeded", `${r.registered} registered`);
      } else {
        setSeedMsg(`Seed failed: ${r.errors[0] || "unknown error"}`);
        toast.error("Seed failed", r.errors[0] || "");
      }
    });
  }

  function handleTest() {
    if (!city || !niche) { toast.error("Pick a city and niche", ""); return; }
    if (!testPhone.trim()) { toast.error("Enter a test phone number", ""); return; }
    startTransition(async () => {
      const r = await runDirectReport({ ...baseInput(), testPhone: testPhone.trim() });
      setResult(r);
      r.ok ? toast.success("Test sent", r.message || "") : toast.error("Test failed", r.message || "");
    });
  }

  function handlePreview() {
    if (!city || !niche) { toast.error("Pick a city and niche", ""); return; }
    startTransition(async () => {
      const r = await runDirectReport({ ...baseInput(), dryRun: true });
      setResult(r);
      if (!r.ok) toast.error("Preview", r.message || "");
    });
  }

  async function handleSend() {
    if (!city || !niche) { toast.error("Pick a city and niche", ""); return; }
    const ok = await promptModal({
      title: "Send direct reports?",
      description: `This sends the market-intel report to eligible ${niche} leads in ${city} (cap ${dailyCap}/day). Real WhatsApp messages will go out.`,
      confirmLabel: "Send reports",
      type: "select",
      options: [{ value: "confirm", label: "Yes, send the reports" }],
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await runDirectReport(baseInput());
      setResult(r);
      r.ok ? toast.success("Send complete", r.message || "") : toast.error("Send failed", r.message || "");
    });
  }

  return (
    <div className="space-y-5">
      {!hasLibrary && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            The report library is empty. Click <strong>Seed report library</strong> to upload the
            market-intel PDFs to Storage and register them, then reload.
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <input list="dr-cities" className={inputClass} value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="Hubli" />
            <datalist id="dr-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className={labelClass}>Niche</label>
            <input list="dr-niches" className={inputClass} value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="DentalClinics" />
            <datalist id="dr-niches">{niches.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Language</label>
            <select className={inputClass} value={lang} onChange={(e) => setLang(e.target.value)}>
              {langs.map((l) => <option key={l} value={l}>{l === "kn" ? "Kannada" : "English"}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Lead type (optional)</label>
            <select className={inputClass} value={leadType} onChange={(e) => setLeadType(e.target.value)}>
              {LEAD_TYPES.map((t) => <option key={t || "all"} value={t}>{t || "All"}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Daily cap</label>
            <input type="number" className={inputClass} value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Body params (optional — one per line)</label>
          <textarea
            className={inputClass}
            rows={2}
            value={bodyParamsText}
            onChange={(e) => setBodyParamsText(e.target.value)}
            placeholder={"Leave empty for header-only. Tokens fill from the lead, e.g.\n{contact_person}"}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            The PDF is attached as the template's document header automatically. Only add body
            params if your direct_report template has {`{{1}}`}… text variables.
          </p>
        </div>
      </div>

      {/* Test send */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-brand-deep" /> Test send (verify the PDF first)
        </p>
        <div className="flex gap-2">
          <input className={inputClass} value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Test phone, e.g. 9XXXXXXXXX" />
          <button onClick={handleTest} disabled={pending} className="shrink-0 rounded-lg border border-brand-deep text-brand-deep px-4 py-2 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 flex items-center gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test
          </button>
        </div>
        <p className="text-[11px] text-slate-400">No lead is updated; one message goes to this number to confirm the report attaches.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handlePreview} disabled={pending} className="rounded-lg border border-slate-200 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview (dry run)
        </button>
        <button onClick={handleSend} disabled={pending} className="rounded-lg bg-brand-deep text-white px-4 py-2 text-sm font-semibold hover:bg-brand-active disabled:opacity-50 flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send reports
        </button>
        <button onClick={handleSeed} disabled={pending} className="ml-auto rounded-lg border border-slate-200 text-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Seed report library
        </button>
      </div>

      {seedMsg && <p className="text-xs text-slate-500">{seedMsg}</p>}

      {/* Result */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            {result.test ? "Test result" : result.dryRun ? "Preview" : "Send result"}
          </p>
          {result.message && <p className="text-sm text-slate-600">{result.message}</p>}
          {!result.test && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <Stat label="Matched" value={result.matched} />
              <Stat label="Eligible" value={result.eligible} />
              <Stat label="Opted out" value={result.optedOut} />
              <Stat label="With report" value={result.withReport} />
              <Stat label="No report" value={result.noReport} />
              <Stat label={result.dryRun ? "Cap left" : "Sent"} value={result.dryRun ? result.capRemaining ?? 0 : result.sent} />
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="text-xs text-red-600 space-y-0.5 max-h-40 overflow-auto">
              {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 py-2">
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}
