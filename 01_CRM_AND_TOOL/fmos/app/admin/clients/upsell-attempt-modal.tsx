"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { logUpsellAttempt } from "./client-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";

interface UpsellAttemptModalProps {
  client: { id: string; business_name: string; package?: any };
  onClose: () => void;
}

const METHODS = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "in_person", label: "In Person" },
];

const OUTCOMES = [
  { value: "interested", label: "Interested — will follow up", color: "border-info-line bg-info-soft text-info" },
  { value: "not_now", label: "Not Now — revisit in 30d", color: "border-warn-line bg-warn-soft text-warn" },
  { value: "rejected", label: "Rejected — not interested", color: "border-danger-line bg-danger-soft text-danger" },
  { value: "converted", label: "Converted — agreed!", color: "border-brand-line bg-brand-soft text-brand-deep" },
  { value: "no_response", label: "No Response", color: "border-line-strong bg-slate-50 text-slate-700" },
];

export default function UpsellAttemptModal({ client, onClose }: UpsellAttemptModalProps) {
  const router = useRouter();
  const pkg = client.package;

  const [targetService, setTargetService] = useState(pkg?.upsell_target || "");
  const [method, setMethod] = useState("call");
  const [outcome, setOutcome] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [convertedValue, setConvertedValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!targetService.trim()) {
      setError("Target service is required.");
      return;
    }
    if (!outcome) {
      setError("Please select an outcome.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await logUpsellAttempt(client.id, pkg?.id, {
      current_services: pkg?.services || [],
      target_service: targetService,
      method,
      outcome,
      follow_up_date: followUpDate || undefined,
      converted_value: convertedValue || undefined,
      notes: notes || undefined,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-lg border border-line">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface border-b border-line px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">Log Upsell Attempt</h2>
            <p className="text-xs text-slate-500">{client.business_name}</p>
          </div>
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
            <div className="rounded-lg bg-danger-soft border border-danger-line p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Target Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Service
            </label>
            <Input
              type="text"
              value={targetService}
              onChange={(e) => setTargetService(e.target.value)}
              placeholder="e.g. SEO Growth"
              className="h-10"
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Contact Method
            </label>
            <div className="flex gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    method === m.value
                      ? "border-brand-line bg-brand-soft text-brand-deep"
                      : "border-line bg-surface text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Outcome
            </label>
            <div className="space-y-2">
              {OUTCOMES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold text-left transition-colors ${
                    outcome === opt.value
                      ? opt.color
                      : "border-line bg-surface text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Date */}
          {outcome === "interested" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Follow-up Date
              </label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {/* Converted Value */}
          {outcome === "converted" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Monthly Value Added ₹
              </label>
              <Input
                type="number"
                value={convertedValue}
                onChange={(e) => setConvertedValue(Number(e.target.value))}
                placeholder="0"
                className="h-10 tabular-nums"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What happened..."
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-line bg-surface px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className={buttonVariants({ variant: "secondary" })}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Logging..." : "Log Attempt"}
          </button>
        </div>
      </div>
    </div>
  );
}
