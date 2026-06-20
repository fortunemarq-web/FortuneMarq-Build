"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { leadStageUpdate } from "@/lib/pipeline";
import { notifyOutcome } from "./outcome-actions";
import { Button } from "@/components/ui/button";
import { type Tone } from "@/components/ui/badge";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface CallOutcomeModalProps {
  leadId: string;
  leadCompanyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type OutcomeType =
  | "no_answer"
  | "callback_scheduled"
  | "not_interested"
  | "wrong_number"
  | "qualified_pass_to_strategist";

interface OutcomeConfig {
  type: OutcomeType;
  label: string;
  /** outreach_stage to move the lead to — the single source of truth */
  stage: string;
  /** One of the five status tones — no per-outcome rainbow. */
  tone: Tone;
  needsDateTime: boolean;
}

// Five-tone status map: positive=brand, waiting=warning, neutral=slate, negative=danger.
const TONE_CLASSES: Record<Tone, string> = {
  brand: "border-brand-line bg-brand-soft text-brand-deep hover:bg-brand/10",
  warning: "border-warn-line bg-warn-soft text-warn hover:bg-warn/10",
  info: "border-info-line bg-info-soft text-info hover:bg-info/10",
  neutral: "border-line bg-slate-50 text-slate-700 hover:bg-slate-100",
  danger: "border-danger-line bg-danger-soft text-danger hover:bg-red-100",
};

const outcomes: OutcomeConfig[] = [
  {
    type: "no_answer",
    label: "No Answer",
    stage: "no_answer",
    tone: "neutral",
    needsDateTime: false,
  },
  {
    type: "callback_scheduled",
    label: "Callback / Interested",
    stage: "follow_back",
    tone: "warning",
    needsDateTime: true,
  },
  {
    type: "not_interested",
    label: "Not Interested",
    stage: "not_interested",
    tone: "danger",
    needsDateTime: false,
  },
  {
    type: "wrong_number",
    label: "Wrong Number",
    stage: "dead",
    tone: "danger",
    needsDateTime: false,
  },
  {
    type: "qualified_pass_to_strategist",
    label: "Qualified!",
    stage: "meeting_booked",
    tone: "brand",
    needsDateTime: false,
  },
];

export default function CallOutcomeModal({
  leadId,
  leadCompanyName,
  isOpen,
  onClose,
  onSuccess,
}: CallOutcomeModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeConfig | null>(
    null
  );
  const [callbackDateTime, setCallbackDateTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;


  const handleOutcomeSelect = (outcome: OutcomeConfig) => {
    setSelectedOutcome(outcome);
    setMessage(null);
    if (!outcome.needsDateTime) {
      handleSubmit(outcome, null);
    }
  };

  const handleSubmit = async (
    outcome: OutcomeConfig,
    dateTime: string | null
  ) => {
    if (outcome.needsDateTime && !dateTime) {
      setMessage({
        type: "error",
        text: "Please select a date and time for the callback.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Calculate next_action_date
      let nextActionDate: string | null = null;
      if (outcome.needsDateTime && dateTime) {
        // Convert datetime-local to ISO string
        nextActionDate = new Date(dateTime).toISOString();
      } else if (outcome.type === "no_answer") {
        // For "no_answer", set date only (not datetime) +2 days
        const date = new Date();
        date.setDate(date.getDate() + 2);
        nextActionDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      }

      // Update the lead — stage writes ONLY via lib/pipeline.ts helpers
      // (keeps outreach_stage + legacy status + last_activity_at in lockstep)
      const leadUpdateQuery = (supabase.from("leads") as any)
        .update(leadStageUpdate(outcome.stage, { next_action_date: nextActionDate }))
        .eq("id", leadId);
      const { error: leadError } = await leadUpdateQuery;

      if (leadError) throw leadError;

      // Insert call activity (assuming call_activities table exists)
      // If the table doesn't exist yet, this will fail gracefully
      const callActivityData: any = {
        lead_id: leadId,
        outcome: outcome.type,
        created_at: new Date().toISOString(),
      };

      if (outcome.needsDateTime && dateTime) {
        callActivityData.callback_datetime = new Date(dateTime).toISOString();
      }

      // Try to insert call activity, but don't fail if table doesn't exist
      try {
        const activityQuery = (supabase.from("call_activities") as any).insert(callActivityData);
        await activityQuery;
      } catch (err) {
        // Silently fail if call_activities table doesn't exist
        console.warn("call_activities table may not exist:", err);
      }

      // Optional outbound WhatsApp on outcome (config-gated via
      // WA_OUTCOME_TEMPLATES; server-side, fail-open — never blocks logging).
      try {
        await notifyOutcome(leadId, outcome.type);
      } catch (err) {
        console.warn("outcome WhatsApp send failed (non-fatal):", err);
      }

      setMessage({
        type: "success",
        text: `Call outcome recorded: ${outcome.label}`,
      });

      // Close modal after a brief delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to save call outcome. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedOutcome(null);
    setCallbackDateTime("");
    setMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleDateTimeSubmit = () => {
    if (selectedOutcome && callbackDateTime) {
      handleSubmit(selectedOutcome, callbackDateTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-4 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">How did the call go?</h2>
            <p className="mt-1 text-sm text-slate-500">{leadCompanyName}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {selectedOutcome?.needsDateTime ? (
            /* DateTime Picker for Callback */
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="callback-datetime"
                  className="mb-2 block text-sm font-medium text-slate-900"
                >
                  Select Callback Date & Time
                </label>
                <input
                  id="callback-datetime"
                  type="datetime-local"
                  value={callbackDateTime}
                  onChange={(e) => setCallbackDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={inputClasses}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDateTimeSubmit}
                  disabled={!callbackDateTime || isSubmitting}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  {isSubmitting ? "Saving..." : "Schedule Callback"}
                </Button>
                <Button
                  onClick={() => setSelectedOutcome(null)}
                  disabled={isSubmitting}
                  variant="secondary"
                  size="lg"
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            /* Outcome Buttons Grid — five tones only, no per-outcome rainbow */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <button
                  key={outcome.type}
                  onClick={() => handleOutcomeSelect(outcome)}
                  disabled={isSubmitting}
                  className={cn(
                    "flex min-h-[60px] items-center justify-center rounded-lg border px-4 py-4 font-display font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                    TONE_CLASSES[outcome.tone]
                  )}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={cn(
                "mt-4 flex items-center gap-2 rounded-lg border px-4 py-3",
                message.type === "success"
                  ? "border-brand-line bg-brand-soft text-brand-deep"
                  : "border-danger-line bg-danger-soft text-danger"
              )}
              role="alert"
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

