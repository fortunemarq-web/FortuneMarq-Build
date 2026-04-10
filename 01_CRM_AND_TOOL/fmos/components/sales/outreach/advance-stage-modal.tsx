"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { advanceOutreachStage } from "./outreach-actions";

interface AdvanceStageModalProps {
  sequence: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PROPOSAL_TYPES = [
  "V1 Website",
  "V2 Google Ads",
  "V3 Meta Ads",
  "V4 SEO",
  "V5 GMB",
  "V6 WhatsApp",
  "V7 Full Package",
  "V8 Custom",
];

export default function AdvanceStageModal({
  sequence,
  onClose,
  onSuccess,
}: AdvanceStageModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [pdfName, setPdfName] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [location, setLocation] = useState("In-person (office)");
  const [proposalType, setProposalType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const stage = sequence.stage;
  const lead = sequence.lead;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    let data: any = {};

    switch (stage) {
      case "touch1_pending":
        break;
      case "touch1_sent":
      case "pdf_pending":
        if (!pdfName.trim()) {
          setError("Please enter the PDF name.");
          setIsSubmitting(false);
          return;
        }
        data.pdf_name = pdfName;
        break;
      case "pdf_sent":
        if (!followupDate) {
          setError("Please select a follow-up date.");
          setIsSubmitting(false);
          return;
        }
        data.followup_date = followupDate;
        break;
      case "followup_due":
        if (!meetingDate) {
          setError("Please select a meeting date.");
          setIsSubmitting(false);
          return;
        }
        data.meeting_date = `${meetingDate}T${meetingTime}:00`;
        data.location = location;
        break;
      case "meeting_booked":
        if (!proposalType) {
          setError("Please select a proposal type.");
          setIsSubmitting(false);
          return;
        }
        data.proposal_type = proposalType;
        break;
      case "proposal_sent":
        if (!outcome) {
          setError("Please select an outcome.");
          setIsSubmitting(false);
          return;
        }
        data.outcome = outcome;
        data.notes = notes;
        break;
    }

    const result = await advanceOutreachStage(
      sequence.id,
      sequence.lead_id,
      stage,
      data
    );

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onSuccess();
    }
  };

  const getTitle = () => {
    switch (stage) {
      case "touch1_pending": return "Confirm Touch 1 Sent";
      case "touch1_sent":
      case "pdf_pending": return "Log PDF Delivery";
      case "pdf_sent": return "Schedule Follow-up";
      case "followup_due": return "Book Meeting";
      case "meeting_booked": return "Log Proposal Sent";
      case "proposal_sent": return "Log Final Outcome";
      default: return "Advance Stage";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{getTitle()}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead?.company_name} · {lead?.contact_person}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* touch1_pending — just confirm */}
          {stage === "touch1_pending" && (
            <p className="text-sm text-slate-600">
              Confirm that Touch 1 WhatsApp message was sent to{" "}
              <span className="font-semibold">{lead?.company_name}</span>.
            </p>
          )}

          {/* touch1_sent / pdf_pending — PDF name */}
          {(stage === "touch1_sent" || stage === "pdf_pending") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Which PDF did you send?
              </label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="e.g. Dental Clinic Audit Report"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {/* pdf_sent — follow-up date */}
          {stage === "pdf_sent" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Schedule follow-up for
              </label>
              <input
                type="datetime-local"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {/* followup_due — meeting booking */}
          {stage === "followup_due" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </>
          )}

          {/* meeting_booked — proposal type */}
          {stage === "meeting_booked" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Proposal Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROPOSAL_TYPES.map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setProposalType(pt)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      proposalType === pt
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* proposal_sent — outcome */}
          {stage === "proposal_sent" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Outcome
                </label>
                <div className="space-y-2">
                  {[
                    { value: "won", label: "Won ✅", color: "border-green-500 bg-green-50 text-green-800" },
                    { value: "lost", label: "Lost ❌", color: "border-red-500 bg-red-50 text-red-800" },
                    { value: "revival", label: "Not Now — Revival 🔄", color: "border-blue-500 bg-blue-50 text-blue-800" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOutcome(opt.value)}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                        outcome === opt.value ? opt.color : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What happened..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </>
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
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Processing..." : getTitle()}
          </button>
        </div>
      </div>
    </div>
  );
}
