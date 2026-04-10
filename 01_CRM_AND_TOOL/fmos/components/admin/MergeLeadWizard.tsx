"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, ArrowRight, CheckCircle2, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import clsx from "clsx";

interface MergeLeadWizardProps {
    pair: {
        primary: any;
        duplicate: any;
        id: string; // candidate id
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function MergeLeadWizard({ pair, onClose, onSuccess }: MergeLeadWizardProps) {
    const [survivorId, setSurvivorId] = useState<string>(pair.primary.id);
    const [step, setStep] = useState<1 | 2>(1);
    const [chosenFields, setChosenFields] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const survivor = survivorId === pair.primary.id ? pair.primary : pair.duplicate;
    const merged = survivorId === pair.primary.id ? pair.duplicate : pair.primary;

    // Initialize fields (could be smarter)
    const fields = ["company_name", "phone", "email", "city", "status"]; // simplified for UI

    const toggleField = (field: string, value: any) => {
        setChosenFields(prev => ({ ...prev, [field]: value }));
    };

    const handleMerge = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/leads/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    survivor_id: survivorId,
                    merged_id: merged.id,
                    chosen_fields: chosenFields,
                    merge_strategy: { source: "manual_wizard" }
                })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            onSuccess();
        } catch (e) {
            alert("Merge failed. Check console.");
            console.error(e);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-50 border border-[#222] rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#161616] rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Merge Leads
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 font-mono tracking-wider">WIZARD</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900"><X className="h-5 w-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm flex gap-3">
                                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">Select the Survivor Record</p>
                                    <p>The survivor will be kept. The other record will be merged into it (history preserved) and then archived.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setSurvivorId(pair.primary.id)}
                                    className={clsx("cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-100", survivorId === pair.primary.id ? "border-[#42CA80] bg-[#42CA80]/5" : "border-slate-300 bg-transparent opacity-60")}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Record A</span>
                                        {survivorId === pair.primary.id && <CheckCircle2 className="h-4 w-4 text-[#42CA80]" />}
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg truncate">{pair.primary.company_name}</h4>
                                    <p className="text-sm text-slate-600">{pair.primary.email || "No Email"}</p>
                                    <p className="text-xs text-slate-500 mt-2">ID: ...{pair.primary.id.slice(-6)}</p>
                                </div>

                                <div
                                    onClick={() => setSurvivorId(pair.duplicate.id)}
                                    className={clsx("cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-100", survivorId === pair.duplicate.id ? "border-[#42CA80] bg-[#42CA80]/5" : "border-slate-300 bg-transparent opacity-60")}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Record B</span>
                                        {survivorId === pair.duplicate.id && <CheckCircle2 className="h-4 w-4 text-[#42CA80]" />}
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg truncate">{pair.duplicate.company_name}</h4>
                                    <p className="text-sm text-slate-600">{pair.duplicate.email || "No Email"}</p>
                                    <p className="text-xs text-slate-500 mt-2">ID: ...{pair.duplicate.id.slice(-6)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600">Review and resolve field conflicts. Select the value you want to keep on the survivor.</p>

                            <div className="space-y-3">
                                {fields.map(field => {
                                    const sVal = survivor[field];
                                    const mVal = merged[field];
                                    if (!sVal && !mVal) return null; // skip empty

                                    // Auto-select logic if not chosen yet: prefer survivor unless empty
                                    const currentVal = chosenFields[field] !== undefined ? chosenFields[field] : (sVal || mVal);

                                    // Highlight conflict
                                    const isConflict = sVal && mVal && sVal !== mVal;

                                    return (
                                        <div key={field} className={clsx("group border rounded-lg p-3 transition-colors", isConflict ? "border-amber-500/30 bg-amber-500/5" : "border-slate-300 bg-white")}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono uppercase text-slate-500">{field}</span>
                                                {isConflict && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => toggleField(field, sVal)}
                                                    className={clsx("text-left text-sm p-2 rounded border", currentVal === sVal ? "border-[#42CA80] bg-[#42CA80]/10 text-slate-900" : "border-transparent text-slate-600 hover:bg-slate-100")}
                                                >
                                                    {sVal || <span className="italic opacity-50">Empty</span>}
                                                </button>
                                                <button
                                                    onClick={() => toggleField(field, mVal)}
                                                    className={clsx("text-left text-sm p-2 rounded border", currentVal === mVal ? "border-[#42CA80] bg-[#42CA80]/10 text-slate-900" : "border-transparent text-slate-600 hover:bg-slate-100")}
                                                >
                                                    {mVal || <span className="italic opacity-50">Empty</span>}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#222] bg-[#161616] flex justify-between rounded-b-xl">
                    {step === 2 ? (
                        <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-900 px-4 py-2">Back</button>
                    ) : (
                        <div></div>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 flex items-center gap-2"
                        >
                            Next: Review Fields <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleMerge}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                            Confirm Merge
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
