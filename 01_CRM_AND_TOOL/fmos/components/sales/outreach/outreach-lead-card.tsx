"use client";

import { Phone, Eye, Clock } from "lucide-react";
import Link from "next/link";

interface OutreachLeadCardProps {
  sequence: any;
  onAction: (seq: any) => void;
}

const ACTION_LABELS: Record<string, string> = {
  touch1_pending: "Mark Touch 1 Sent",
  touch1_sent: "Log PDF Sent",
  pdf_pending: "Log PDF Sent",
  pdf_sent: "Schedule Follow-up",
  followup_due: "Log Call + Advance",
  meeting_booked: "Log Outcome",
  proposal_sent: "Mark Won/Lost",
};

const ACTION_COLORS: Record<string, string> = {
  touch1_pending: "bg-slate-900 hover:bg-slate-800 text-white",
  touch1_sent: "bg-blue-600 hover:bg-blue-500 text-white",
  pdf_pending: "bg-violet-600 hover:bg-violet-500 text-white",
  pdf_sent: "bg-amber-600 hover:bg-amber-500 text-white",
  followup_due: "bg-orange-600 hover:bg-orange-500 text-white",
  meeting_booked: "bg-green-600 hover:bg-green-500 text-white",
  proposal_sent: "bg-indigo-600 hover:bg-indigo-500 text-white",
};

const INDUSTRY_COLORS: Record<string, string> = {
  Dental: "bg-cyan-100 text-cyan-800",
  "Real Estate": "bg-violet-100 text-violet-800",
  Restaurant: "bg-orange-100 text-orange-800",
  Healthcare: "bg-green-100 text-green-800",
  Education: "bg-blue-100 text-blue-800",
  Fitness: "bg-pink-100 text-pink-800",
  Travel: "bg-indigo-100 text-indigo-800",
};

export default function OutreachLeadCard({ sequence, onAction }: OutreachLeadCardProps) {
  const lead = sequence.lead;
  if (!lead) return null;

  const daysInStage = Math.floor(
    (Date.now() - new Date(sequence.updated_at).getTime()) / 86400000
  );
  const daysColor =
    daysInStage > 7
      ? "text-red-600 bg-red-50 border-red-200"
      : daysInStage > 3
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-slate-500 bg-slate-50 border-slate-200";

  const industryColor =
    INDUSTRY_COLORS[lead.industry || ""] || "bg-slate-100 text-slate-700";

  const meetingDate =
    sequence.stage === "meeting_booked" && sequence.meeting_date
      ? new Date(sequence.meeting_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {lead.company_name}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {lead.contact_person}{lead.city ? ` · ${lead.city}` : ""}
          </p>
        </div>
        <span className={`ml-2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${daysColor}`}>
          <Clock className="h-2.5 w-2.5" />
          {daysInStage}d
        </span>
      </div>

      {/* Industry Badge */}
      {lead.industry && (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${industryColor} mb-2`}>
          {lead.industry}
        </span>
      )}

      {/* Meeting date if stage is meeting_booked */}
      {meetingDate && (
        <p className="text-xs text-green-700 bg-green-50 rounded-md px-2 py-1 mb-2 font-medium">
          📅 {meetingDate}
        </p>
      )}

      {/* Phone */}
      {lead.phone && (
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors mb-2"
        >
          <Phone className="h-3 w-3" />
          {lead.phone}
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onAction(sequence)}
          className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${ACTION_COLORS[sequence.stage] || "bg-slate-900 hover:bg-slate-800 text-white"}`}
        >
          {ACTION_LABELS[sequence.stage] || "View"}
        </button>
        <Link
          href={`/sales/leads/${lead.id}`}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Eye className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
