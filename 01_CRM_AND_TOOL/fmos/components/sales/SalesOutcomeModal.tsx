"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    MessageSquare,
    Mic
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import { format, addDays, addHours, setHours, setMinutes } from "date-fns";

interface SalesOutcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: OutcomeData) => Promise<void>;
    outcome: string; // 'interested', 'follow_up', etc.
    leadName: string;
    initialNotes?: string;
}

export interface OutcomeData {
    outcome: string;
    reason_code?: string;
    notes?: string;
    next_action_date?: string | null;
    services?: string[];
    interest_level?: number;
}

// Reason codes mapping (this should ideally come from DB, but hardcoding map for speed if needed, or fetch)
// For now, I'll fetch or pass them, but let's assume we fetch them inside for simplicity
interface ReasonCode {
    code: string;
    label: string;
}

export default function SalesOutcomeModal({
    isOpen,
    onClose,
    onSave,
    outcome,
    leadName,
    initialNotes
}: SalesOutcomeModalProps) {
    const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
    const [formData, setFormData] = useState<OutcomeData>({
        outcome,
        reason_code: "",
        notes: initialNotes || "",
        next_action_date: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customDate, setCustomDate] = useState("");
    const [customTime, setCustomTime] = useState("10:00");

    // Voice to Text State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recording is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setFormData(prev => ({
                    ...prev,
                    notes: (prev.notes ? prev.notes + ' ' : '') + finalTranscript
                }));
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();

    }, [isRecording]);

    // Keyboard shortcut for Voice
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'v' && isOpen) {
                e.preventDefault();
                toggleRecording();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggleRecording]);

    // Stop recording on unmount or close
    useEffect(() => {
        if (!isOpen && isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [isOpen, isRecording]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                outcome,
                reason_code: "",
                notes: initialNotes || "",
                next_action_date: null,
            });
            fetchReasonCodes(outcome);
            setIsRecording(false);
        }
    }, [isOpen, outcome, initialNotes]);

    const fetchReasonCodes = async (outcomeType: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from("lead_reason_codes" as any)
            .select("code, label")
            .eq("outcome", outcomeType)
            .eq("is_active", true)
            .order("sort_order");
        setReasonCodes((data as any || []) as ReasonCode[]);
    };

    const handleSave = async () => {
        // Validation
        if (requiresReason && !formData.reason_code) {
            alert("Please select a reason.");
            return;
        }
        if (requiresNotes && (!formData.notes || formData.notes.length < 5)) {
            alert("Please add notes (min 5 chars).");
            return;
        }
        if (requiresFollowUp && !formData.next_action_date) {
            alert("Please schedule a follow-up.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to save outcome.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const setFollowUpPreset = (type: string) => {
        const now = new Date();
        let date = now;

        switch (type) {
            case "1_hour":
                date = addHours(now, 1);
                break;
            case "tomorrow_morning":
                date = setMinutes(setHours(addDays(now, 1), 9), 0);
                break;
            case "monday_morning":
                // Calculate days until next Monday (1 = Mon, ..., 7 = Sun)
                const day = now.getDay();
                const daysUntilMonday = day === 0 ? 1 : 8 - day; // If Sun(0), +1. If Mon(1), +7.
                date = setMinutes(setHours(addDays(now, daysUntilMonday), 9), 0);
                break;
            default:
                return;
        }
        setFormData({ ...formData, next_action_date: date.toISOString() });
    };

    const handleCustomDateChange = () => {
        if (customDate && customTime) {
            const date = new Date(`${customDate}T${customTime}`);
            setFormData({ ...formData, next_action_date: date.toISOString() });
        }
    };

    if (!isOpen) return null;

    const requiresReason = ["not_interested", "follow_up", "wrong_number", "invalid_number"].includes(outcome);
    const requiresNotes = ["not_interested", "interested", "follow_up"].includes(outcome);
    const requiresFollowUp = ["follow_up", "busy", "no_answer", "interested"].includes(outcome);

    const outcomeLabels: Record<string, string> = {
        interested: "Positive / Interested",
        follow_up: "Follow Up Required",
        not_interested: "Not Interested",
        no_answer: "No Answer",
        busy: "Busy",
        wrong_number: "Wrong Number",
        invalid_number: "Invalid Number",
        strategy_booked: "Strategy Booked",
    };

    const SERVICES = [
        { id: "seo", label: "SEO" },
        { id: "smma", label: "Social Media Marketing" },
        { id: "ppc", label: "PPC / Ads" },
        { id: "content", label: "Content Marketing" },
        { id: "web_dev", label: "Web Development" },
    ];

    const toggleService = (serviceId: string) => {
        const currentServices = formData.services || [];
        if (currentServices.includes(serviceId)) {
            setFormData({ ...formData, services: currentServices.filter(s => s !== serviceId) });
        } else {
            setFormData({ ...formData, services: [...currentServices, serviceId] });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#2a2a2a] px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Log Call Outcome</h2>
                        <p className="text-sm text-slate-500">Lead: {leadName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Selected Outcome Display */}
                    <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 border border-slate-300">
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Selected Outcome</p>
                            <p className="text-lg font-bold text-slate-900">{outcomeLabels[outcome] || outcome}</p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-[#42CA80]" />
                    </div>

                    {/* Reason Code */}
                    {reasonCodes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.reason_code}
                                onChange={(e) => setFormData({ ...formData, reason_code: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-[#42CA80] focus:outline-none"
                            >
                                <option value="">Select a reason...</option>
                                {reasonCodes.map((rc) => (
                                    <option key={rc.code} value={rc.code}>
                                        {rc.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Notes with Voice-to-Text */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-500">
                                Call Notes {requiresNotes && <span className="text-red-500">*</span>}
                            </label>
                            <button
                                onClick={toggleRecording}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all",
                                    isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-slate-100 text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {isRecording ? <div className="h-2 w-2 rounded-full bg-red-500" /> : <Mic className="h-3 w-3" />}
                                {isRecording ? "Recording..." : "Voice Note"}
                            </button>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={requiresNotes ? "Enter details about the call..." : "Optional notes..."}
                            className={clsx(
                                "w-full h-24 rounded-lg border bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-[#666] resize-none focus:outline-none transition-all",
                                isRecording ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-slate-300 focus:border-[#42CA80]"
                            )}
                        />
                    </div>

                    {/* Follow-up Scheduler */}
                    {requiresFollowUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2">
                                Schedule Follow-up <span className="text-red-500">*</span>
                            </label>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button onClick={() => setFollowUpPreset("1_hour")} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-900 border border-slate-300 hover:border-[#42CA80] transition-colors">
                                    in 1 Hour
                                </button>
                                <button onClick={() => setFollowUpPreset("tomorrow_morning")} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-900 border border-slate-300 hover:border-[#42CA80] transition-colors">
                                    Tom. Morning
                                </button>
                                <button onClick={() => setFollowUpPreset("monday_morning")} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-900 border border-slate-300 hover:border-[#42CA80] transition-colors">
                                    Mon. Morning
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => { setCustomDate(e.target.value); handleCustomDateChange(); }}
                                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-sm"
                                />
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => { setCustomTime(e.target.value); handleCustomDateChange(); }}
                                    className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-sm"
                                />
                            </div>

                            {formData.next_action_date && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-[#42CA80]">
                                    <Clock className="h-4 w-4" />
                                    <span>Scheduled for: {format(new Date(formData.next_action_date), "MMM d, h:mm a")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-[#2a2a2a] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="rounded-lg bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 px-6 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Outcome"}
                    </button>
                </div>
            </div>
        </div>
    );
}
