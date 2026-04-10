"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
    X,
    Calendar as CalendarIcon,
    Clock,
    MessageCircle,
    Phone,
    Mail,
    CheckCircle2,
    Loader2
} from "lucide-react";
import clsx from "clsx";
import { format, addHours, addDays, setHours, setMinutes } from "date-fns";

export interface ScheduleFollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    leadName: string;
    onScheduled?: () => void;
}

export default function ScheduleFollowUpModal({
    isOpen,
    onClose,
    leadId,
    leadName,
    onScheduled
}: ScheduleFollowUpModalProps) {
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<'call' | 'whatsapp' | 'email'>('call');
    const [notes, setNotes] = useState("");

    // DateTime State
    const [customDate, setCustomDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [customTime, setCustomTime] = useState("10:00");

    if (!isOpen) return null;

    const handleQuickSchedule = (preset: "1_hour" | "tomorrow" | "next_week") => {
        const now = new Date();
        let target = now;

        if (preset === "1_hour") {
            target = addHours(now, 1);
        } else if (preset === "tomorrow") {
            target = setMinutes(setHours(addDays(now, 1), 10), 0);
        } else if (preset === "next_week") {
            target = setMinutes(setHours(addDays(now, 7), 10), 0);
        }

        setCustomDate(format(target, "yyyy-MM-dd"));
        setCustomTime(format(target, "HH:mm"));
    };

    const handleSave = async () => {
        if (!customDate || !customTime) {
            alert("Please select a date and time.");
            return;
        }

        setIsSubmitting(true);
        try {
            const scheduledAt = new Date(`${customDate}T${customTime}`).toISOString();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("You must be logged in to schedule a follow-up.");
                return;
            }

            const { error } = await supabase.from("follow_ups" as any).insert({
                lead_id: leadId,
                assigned_to: user.id, // Assign to self initially
                created_by: user.id,
                follow_up_type: type as any,
                scheduled_at: scheduledAt,
                notes: notes,
                status: 'pending' as any
            });

            if (error) throw error;

            // Also update lead's next_action_date
            await supabase.from("leads")
                .update({
                    next_action_date: scheduledAt,
                    status: 'calling' as any
                } as any)
                .eq("id", leadId);

            if (onScheduled) onScheduled();
            onClose();

        } catch (error) {
            console.error("Schedule Error:", error);
            alert("Error scheduling follow-up. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Schedule Follow-up</h2>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">{leadName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Channel Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Channel</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setType('call')}
                                className={clsx(
                                    "flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    type === 'call' ? "border-amber-500 bg-amber-50 text-amber-700 font-bold" : "border-slate-100 text-slate-500 hover:border-slate-200"
                                )}
                            >
                                <Phone className="h-5 w-5" />
                                <span className="text-xs">Call</span>
                            </button>
                            <button
                                onClick={() => setType('whatsapp')}
                                className={clsx(
                                    "flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    type === 'whatsapp' ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" : "border-slate-100 text-slate-500 hover:border-slate-200"
                                )}
                            >
                                <MessageCircle className="h-5 w-5" />
                                <span className="text-xs">WhatsApp</span>
                            </button>
                            <button
                                onClick={() => setType('email')}
                                className={clsx(
                                    "flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                                    type === 'email' ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-slate-100 text-slate-500 hover:border-slate-200"
                                )}
                            >
                                <Mail className="h-5 w-5" />
                                <span className="text-xs">Email</span>
                            </button>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</label>
                            <div className="flex gap-1 text-[10px] font-bold">
                                <button onClick={() => handleQuickSchedule('1_hour')} className="bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors">1 Hr</button>
                                <button onClick={() => handleQuickSchedule('tomorrow')} className="bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors">Tmrw 10am</button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={e => setCustomDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                            <div className="relative w-32">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={e => setCustomTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Follow-up Notes / Goal</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Call back to discuss pricing after they review the PDF..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors resize-none h-24"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-lg font-bold text-white bg-slate-900 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Schedule Follow-up
                    </button>
                </div>
            </div>
        </div>
    );
}
