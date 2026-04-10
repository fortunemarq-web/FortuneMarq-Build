"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { logCallOutcome } from "./lead-actions";

interface CallOutcomeModalProps {
  leadId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOMES = [
  { value: "interested", label: "Interested", color: "bg-green-50 border-green-300 text-green-800 hover:bg-green-100" },
  { value: "not_now", label: "Not Now", color: "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100" },
  { value: "rejected", label: "Not Interested", color: "bg-red-50 border-red-300 text-red-800 hover:bg-red-100" },
  { value: "busy", label: "Busy / No Answer", color: "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100" },
  { value: "callback_requested", label: "Requested Callback", color: "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100" },
  { value: "wrong_number", label: "Wrong Number", color: "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100" },
  { value: "already_client", label: "Already a Client", color: "bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100" },
  { value: "competitor", label: "Using Competitor", color: "bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100" },
];

const SHOW_FOLLOWUP = ["interested", "not_now", "callback_requested"];

export default function CallOutcomeModal({
  leadId,
  onClose,
  onSuccess,
}: CallOutcomeModalProps) {
  const router = useRouter();
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedOutcome) {
      setError("Please select an outcome.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await logCallOutcome(leadId, {
      outcome: selectedOutcome,
      notes: notes || undefined,
      follow_up_date: followUpDate || undefined,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Log Call Outcome</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Outcome Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              What happened on the call?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedOutcome(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                    selectedOutcome === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-slate-400"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What did they say?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Call notes..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Follow-up Date */}
          {SHOW_FOLLOWUP.includes(selectedOutcome) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Logging..." : "Log Call"}
          </button>
        </div>
      </div>
    </div>
  );
}
