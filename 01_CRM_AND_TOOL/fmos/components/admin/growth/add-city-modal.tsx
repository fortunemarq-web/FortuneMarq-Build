"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { addAcquisitionCity } from "@/app/admin/growth/actions";
import { toast } from "@/components/ui/toast";

interface AddCityModalProps {
  /** When set, the city is fixed and the modal only adds niches to it. */
  fixedCity?: string;
  buttonLabel?: string;
  buttonClassName?: string;
}

/**
 * Add a city (with target niches) to the acquisition board, or add
 * niches to an existing city. Uses the existing addAcquisitionCity action.
 */
export default function AddCityModal({ fixedCity, buttonLabel, buttonClassName }: AddCityModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(fixedCity ?? "");
  const [niches, setNiches] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const cityName = (fixedCity ?? city).trim();
    const nicheList = niches.split(",").map((n) => n.trim()).filter(Boolean);
    if (!cityName) { toast.error("Enter a city name"); return; }
    if (nicheList.length === 0) { toast.error("Enter at least one niche", "Comma-separated, e.g. dentist, gym, salon"); return; }
    setSaving(true);
    const res = await addAcquisitionCity(cityName, "", nicheList);
    setSaving(false);
    if (!res.success) {
      toast.error("Could not save", res.error ?? "");
      return;
    }
    toast.success(fixedCity ? "Niches added" : "City added", `${cityName} · ${nicheList.length} niche${nicheList.length > 1 ? "s" : ""}`);
    setOpen(false);
    setCity(fixedCity ?? "");
    setNiches("");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover transition-colors"
        }
      >
        <Plus className="h-3.5 w-3.5" /> {buttonLabel ?? (fixedCity ? "Add Niche" : "Add City")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {fixedCity ? `Add niches to ${fixedCity}` : "Add target city"}
              </h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {!fixedCity && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Belgaum"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold focus:border-brand focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Niches (comma-separated)</label>
                <input
                  value={niches}
                  onChange={(e) => setNiches(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  placeholder="dentist, gym, salon"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold focus:border-brand focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
              <button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-brand-deep px-5 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
