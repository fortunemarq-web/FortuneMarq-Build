"use client";

import { useState } from "react";
import { X, ArrowRight, CheckCircle2, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

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
            toast.error("Merge failed", "Check the console for details.");
            console.error(e);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface border border-line rounded-2xl shadow-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-line flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                        Merge Leads
                        <Badge tone="info" size="sm" className="uppercase tracking-wider">Wizard</Badge>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-info-soft border border-info-line rounded-lg text-info text-sm flex gap-3">
                                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold mb-1 text-slate-900">Select the Survivor Record</p>
                                    <p className="text-slate-600">The survivor will be kept. The other record will be merged into it (history preserved) and then archived.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setSurvivorId(pair.primary.id)}
                                    className={cn("cursor-pointer rounded-xl border-2 p-4 transition-colors hover:bg-slate-50", survivorId === pair.primary.id ? "border-brand-line bg-brand-soft" : "border-line bg-surface opacity-60")}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Record A</span>
                                        {survivorId === pair.primary.id && <CheckCircle2 className="h-4 w-4 text-brand-deep" />}
                                    </div>
                                    <h4 className="font-semibold text-slate-900 text-lg truncate">{pair.primary.company_name}</h4>
                                    <p className="text-sm text-slate-600">{pair.primary.email || "No Email"}</p>
                                    <p className="text-xs text-slate-500 mt-2 tabular-nums">ID: ...{pair.primary.id.slice(-6)}</p>
                                </div>

                                <div
                                    onClick={() => setSurvivorId(pair.duplicate.id)}
                                    className={cn("cursor-pointer rounded-xl border-2 p-4 transition-colors hover:bg-slate-50", survivorId === pair.duplicate.id ? "border-brand-line bg-brand-soft" : "border-line bg-surface opacity-60")}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Record B</span>
                                        {survivorId === pair.duplicate.id && <CheckCircle2 className="h-4 w-4 text-brand-deep" />}
                                    </div>
                                    <h4 className="font-semibold text-slate-900 text-lg truncate">{pair.duplicate.company_name}</h4>
                                    <p className="text-sm text-slate-600">{pair.duplicate.email || "No Email"}</p>
                                    <p className="text-xs text-slate-500 mt-2 tabular-nums">ID: ...{pair.duplicate.id.slice(-6)}</p>
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
                                        <div key={field} className={cn("group border rounded-lg p-3 transition-colors", isConflict ? "border-warn-line bg-warn-soft" : "border-line bg-surface")}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs uppercase text-slate-500">{field}</span>
                                                {isConflict && <AlertTriangle className="h-3 w-3 text-warn" />}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => toggleField(field, sVal)}
                                                    className={cn("text-left text-sm p-2 rounded-lg border", currentVal === sVal ? "border-brand-line bg-brand-soft text-slate-900" : "border-transparent text-slate-600 hover:bg-slate-50")}
                                                >
                                                    {sVal || <span className="italic opacity-50">Empty</span>}
                                                </button>
                                                <button
                                                    onClick={() => toggleField(field, mVal)}
                                                    className={cn("text-left text-sm p-2 rounded-lg border", currentVal === mVal ? "border-brand-line bg-brand-soft text-slate-900" : "border-transparent text-slate-600 hover:bg-slate-50")}
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
                <div className="p-4 border-t border-line bg-slate-50 flex justify-between rounded-b-2xl">
                    {step === 2 ? (
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    ) : (
                        <div></div>
                    )}

                    {step === 1 ? (
                        <Button onClick={() => setStep(2)}>
                            Next: Review Fields <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleMerge} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                            Confirm Merge
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
