"use client";

import { useState, useTransition } from "react";
import { RefreshCw, X, Loader2 } from "lucide-react";
import { saveGmbSnapshot } from "@/app/admin/growth/actions";
import { toast } from "@/components/ui/toast";

const FIELDS = [
  { key: "profile_views", label: "Profile Views" },
  { key: "direction_requests", label: "Direction Requests" },
  { key: "calls", label: "Calls from GMB" },
  { key: "website_clicks", label: "Website Clicks" },
  { key: "photo_views", label: "Photo Views" },
] as const;

export default function GmbUpdateMetricsButton({ current }: { current: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    profile_views: String(current.profile_views ?? 0),
    direction_requests: String(current.direction_requests ?? 0),
    calls: String(current.calls ?? 0),
    website_clicks: String(current.website_clicks ?? 0),
    photo_views: String(current.photo_views ?? 0),
  });
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveGmbSnapshot({
        profile_views: Number(values.profile_views) || 0,
        direction_requests: Number(values.direction_requests) || 0,
        calls: Number(values.calls) || 0,
        website_clicks: Number(values.website_clicks) || 0,
        photo_views: Number(values.photo_views) || 0,
      });
      if (result.success) {
        toast.success("GMB metrics updated", "Snapshot saved for this month.");
        setOpen(false);
      } else {
        toast.error("Could not save metrics", result.error ?? "");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-surface border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Update Metrics
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-slate-200 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-900">Update GMB Metrics</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input
                    type="number"
                    min={0}
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
