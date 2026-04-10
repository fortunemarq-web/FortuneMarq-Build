"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GitBranch, Filter, CalendarDays, Clock, FileCheck, Users, ArrowLeft } from "lucide-react";
import OutreachLeadCard from "./outreach-lead-card";
import AdvanceStageModal from "./advance-stage-modal";

interface OutreachBoardProps {
  sequences: any[];
  todayMeetings: any[];
}

const STAGES = [
  { key: "touch1_pending", label: "Touch 1 Pending", bg: "bg-slate-50", border: "border-slate-200", accent: "bg-slate-500" },
  { key: "touch1_sent", label: "Touch 1 Sent", bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500" },
  { key: "pdf_pending", label: "PDF to Send", bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500" },
  { key: "pdf_sent", label: "PDF Sent", bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500" },
  { key: "followup_due", label: "Follow-up Due", bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-500" },
  { key: "meeting_booked", label: "Meeting Booked", bg: "bg-green-50", border: "border-green-200", accent: "bg-green-500" },
  { key: "proposal_sent", label: "Proposal Out", bg: "bg-indigo-50", border: "border-indigo-200", accent: "bg-indigo-500" },
];

const CLOSED_STAGES = ["won", "lost", "dead", "revival"];

export default function OutreachBoard({ sequences, todayMeetings }: OutreachBoardProps) {
  const [industryFilter, setIndustryFilter] = useState("all");
  const [activeSequence, setActiveSequence] = useState<any>(null);

  const industries = useMemo(() => {
    const set = new Set<string>();
    sequences.forEach((s) => {
      if (s.lead?.industry) set.add(s.lead.industry);
    });
    return Array.from(set).sort();
  }, [sequences]);

  const filteredSequences = useMemo(() => {
    if (industryFilter === "all") return sequences;
    return sequences.filter((s) => s.lead?.industry === industryFilter);
  }, [sequences, industryFilter]);

  const getColumnSequences = (stageKey: string) =>
    filteredSequences.filter((s) => s.stage === stageKey);

  const closedSequences = filteredSequences.filter((s) =>
    CLOSED_STAGES.includes(s.stage)
  );

  // Stats
  const totalActive = filteredSequences.filter(
    (s) => !CLOSED_STAGES.includes(s.stage)
  ).length;
  const meetingsToday = todayMeetings.length;
  const pendingFollowups = filteredSequences.filter(
    (s) => s.stage === "followup_due"
  ).length;
  const proposalsOut = filteredSequences.filter(
    (s) => s.stage === "proposal_sent"
  ).length;

  const handleAction = (seq: any) => {
    setActiveSequence(seq);
  };

  const handleModalClose = () => {
    setActiveSequence(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Go Back Button */}
        <div className="mb-4">
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Intelligence
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200">
                <GitBranch className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Outreach Board</h1>
                <p className="text-sm text-slate-500">Track every lead through the sales pipeline</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[36px]"
                >
                  <option value="all">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">Active:</span>
              <span className="font-bold text-slate-900">{totalActive}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm shadow-sm">
              <CalendarDays className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Today&apos;s Meetings:</span>
              <span className="font-bold text-green-900">{meetingsToday}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm shadow-sm">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-orange-700">Follow-ups:</span>
              <span className="font-bold text-orange-900">{pendingFollowups}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm shadow-sm">
              <FileCheck className="h-4 w-4 text-indigo-600" />
              <span className="text-indigo-700">Proposals:</span>
              <span className="font-bold text-indigo-900">{proposalsOut}</span>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${(STAGES.length + 1) * 300}px` }}>
            {STAGES.map((stage) => {
              const columnSeqs = getColumnSequences(stage.key);
              return (
                <div
                  key={stage.key}
                  className={`flex-1 min-w-[280px] rounded-xl border ${stage.border} ${stage.bg} p-3`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${stage.accent}`} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {stage.label}
                      </h3>
                    </div>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-600 shadow-sm border border-slate-200">
                      {columnSeqs.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                    {columnSeqs.map((seq) => (
                      <OutreachLeadCard
                        key={seq.id}
                        sequence={seq}
                        onAction={handleAction}
                      />
                    ))}
                    {columnSeqs.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-4 text-center text-xs text-slate-400">
                        No leads in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Closed Column */}
            <div className="flex-1 min-w-[280px] rounded-xl border border-slate-200 bg-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Closed
                  </h3>
                </div>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-500 shadow-sm border border-slate-200">
                  {closedSequences.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                {closedSequences.map((seq) => (
                  <div
                    key={seq.id}
                    className="rounded-lg bg-white border border-slate-200 p-2.5 text-xs"
                  >
                    <p className="font-semibold text-slate-700 truncate">
                      {seq.lead?.company_name || "Unknown"}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        seq.stage === "won"
                          ? "bg-green-100 text-green-700"
                          : seq.stage === "lost"
                          ? "bg-red-100 text-red-700"
                          : seq.stage === "revival"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {seq.stage}
                      </span>
                      <span className="text-slate-400">
                        {seq.lead?.contact_person}
                      </span>
                    </div>
                  </div>
                ))}
                {closedSequences.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-4 text-center text-xs text-slate-400">
                    No closed leads
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advance Stage Modal */}
      {activeSequence && (
        <AdvanceStageModal
          sequence={activeSequence}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  );
}
