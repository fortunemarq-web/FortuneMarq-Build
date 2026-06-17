"use client";

import { useState, useTransition } from "react";
import { X, Award, Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";
import { markAsCaseStudy, type CaseStudyMetric } from "@/actions/proof-vault";
import { toast } from "@/components/ui/toast";

export default function CaseStudyModal({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [metrics, setMetrics] = useState<CaseStudyMetric[]>([{ label: "", before: "", after: "" }]);
  const [links, setLinks] = useState("");
  const [consentBy, setConsentBy] = useState("");
  const [consentNote, setConsentNote] = useState("");
  const [consented, setConsented] = useState(false);

  function reset() {
    setTitle(""); setSummary(""); setMetrics([{ label: "", before: "", after: "" }]);
    setLinks(""); setConsentBy(""); setConsentNote(""); setConsented(false);
  }
  function close() { setOpen(false); reset(); }

  function save() {
    startSaving(async () => {
      const res = await markAsCaseStudy({
        clientId,
        title,
        summary,
        consented,
        consentBy,
        consentNote,
        metrics: metrics.filter((m) => m.label.trim() && (m.before.trim() || m.after.trim())),
        sourceLinks: links.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
      });
      if (res.ok) {
        toast.success(`Pushed to Proof Vault: ${res.folder}`);
        close();
      } else {
        toast.error(res.error ?? "Couldn't create the case study.");
      }
    });
  }

  const canSave = consented && consentBy.trim() && consentNote.trim() && title.trim() && summary.trim();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors min-h-[36px]"
      >
        <Award className="h-3.5 w-3.5" />
        Mark as Case Study
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Mark as Case Study</h2>
                <p className="text-xs text-slate-500 mt-0.5">{clientName} → Proof Vault. Consent required.</p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 4× Google Maps calls in 60 days"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80]" />
              </Field>

              <Field label="Result summary">
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
                  placeholder="What changed, over what period, and what drove it."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80] resize-none" />
              </Field>

              <Field label="Metrics (before → after)">
                <div className="space-y-2">
                  {metrics.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={m.label} onChange={(e) => updateMetric(i, "label", e.target.value, metrics, setMetrics)}
                        placeholder="Metric" className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                      <input value={m.before} onChange={(e) => updateMetric(i, "before", e.target.value, metrics, setMetrics)}
                        placeholder="Before" className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                      <input value={m.after} onChange={(e) => updateMetric(i, "after", e.target.value, metrics, setMetrics)}
                        placeholder="After" className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                      <button onClick={() => setMetrics(metrics.filter((_, j) => j !== i))}
                        className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setMetrics([...metrics, { label: "", before: "", after: "" }])}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700">
                    <Plus className="h-3 w-3" /> Add metric
                  </button>
                </div>
              </Field>

              <Field label="Source proof links (one per line — GA / Ads / Meta)">
                <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2}
                  placeholder="https://...screenshot or dashboard"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#42CA80] resize-none font-mono" />
              </Field>

              {/* Consent block */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Consent (required)</span>
                </div>
                <Field label="Consent given by">
                  <input value={consentBy} onChange={(e) => setConsentBy(e.target.value)}
                    placeholder="Name of person at the client who agreed"
                    className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </Field>
                <Field label="How / when consent was captured">
                  <input value={consentNote} onChange={(e) => setConsentNote(e.target.value)}
                    placeholder="e.g. WhatsApp on 2026-06-15, agreed to public case study"
                    className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </Field>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 accent-amber-600" />
                  <span className="text-xs text-amber-800">
                    I confirm these are <strong>real</strong> results and the client has <strong>explicitly consented</strong> to a public case study.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={close} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-3 py-2">Cancel</button>
              <button onClick={save} disabled={!canSave || saving}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white transition-colors">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                Push to Proof Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

function updateMetric(
  i: number, key: keyof CaseStudyMetric, val: string,
  metrics: CaseStudyMetric[], setMetrics: (m: CaseStudyMetric[]) => void
) {
  setMetrics(metrics.map((m, j) => (j === i ? { ...m, [key]: val } : m)));
}
