"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Users,
  Target,
  TrendingUp,
  Mail,
  Search,
} from "lucide-react";
import CallOutcomeModal from "./call-outcome-modal";

interface LeadProfileClientProps {
  lead: any;
  sequence: any;
  callOutcomes: any[];
  pdfDeliveries: any[];
  meetings: any[];
  proposals: any[];
  activityEvents: any[];
  marketInsight: any;
}

const STAGE_ORDER = [
  "touch1_pending",
  "touch1_sent",
  "pdf_sent",
  "followup_due",
  "meeting_booked",
  "proposal_sent",
  "won",
];

const STAGE_LABELS: Record<string, string> = {
  touch1_pending: "Touch 1 Pending",
  touch1_sent: "Touch 1 Sent",
  pdf_sent: "PDF Sent",
  followup_due: "Follow-up Due",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  dead: "Dead",
  revival: "Revival",
};

const STAGE_COLORS: Record<string, string> = {
  touch1_pending: "bg-slate-100 text-slate-700",
  touch1_sent: "bg-blue-100 text-blue-700",
  pdf_sent: "bg-amber-100 text-amber-700",
  followup_due: "bg-orange-100 text-orange-700",
  meeting_booked: "bg-green-100 text-green-700",
  proposal_sent: "bg-indigo-100 text-indigo-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  dead: "bg-slate-100 text-slate-500",
  revival: "bg-blue-100 text-blue-700",
};

const OUTCOME_COLORS: Record<string, string> = {
  interested: "bg-green-100 text-green-800",
  not_now: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  busy: "bg-slate-100 text-slate-700",
  callback_requested: "bg-blue-100 text-blue-800",
  wrong_number: "bg-rose-100 text-rose-800",
  already_client: "bg-purple-100 text-purple-800",
  competitor: "bg-orange-100 text-orange-800",
};

export default function LeadProfileClient({
  lead,
  sequence,
  callOutcomes,
  pdfDeliveries,
  meetings,
  proposals,
  activityEvents,
  marketInsight,
}: LeadProfileClientProps) {
  const [activeTab, setActiveTab] = useState("timeline");
  const [showCallModal, setShowCallModal] = useState(false);

  const currentStage = sequence?.stage || lead.outreach_stage || "touch1_pending";

  // Build timeline by merging all events
  const timeline = useMemo(() => {
    const events: any[] = [];

    activityEvents.forEach((e: any) =>
      events.push({ type: "activity", date: e.created_at, ...e })
    );
    callOutcomes.forEach((c: any) =>
      events.push({ type: "call", date: c.created_at, ...c })
    );
    pdfDeliveries.forEach((p: any) =>
      events.push({ type: "pdf", date: p.sent_at || p.created_at, ...p })
    );
    meetings.forEach((m: any) =>
      events.push({ type: "meeting", date: m.scheduled_at || m.created_at, ...m })
    );
    proposals.forEach((p: any) =>
      events.push({ type: "proposal", date: p.sent_at || p.created_at, ...p })
    );

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activityEvents, callOutcomes, pdfDeliveries, meetings, proposals]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const tabs = [
    { key: "timeline", label: "Timeline" },
    { key: "calls", label: `Calls (${callOutcomes.length})` },
    { key: "meetings", label: `Meetings (${meetings.length})` },
    { key: "proposals", label: `Proposals (${proposals.length})` },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/sales"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Back </span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {lead.company_name}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {lead.industry && (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {lead.industry}
                    </span>
                  )}
                  {lead.city && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3 w-3" />
                      {lead.city}
                    </span>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      STAGE_COLORS[currentStage] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STAGE_LABELS[currentStage] || currentStage}
                  </span>

                  {/* Auto-tags Read-Only */}
                  {(lead.has_website === true || lead.website_link) && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Has Website</span>
                  )}
                  {lead.gmb_link && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">GMB Present</span>
                  )}
                  {(!lead.has_website && !lead.website_link && !lead.gmb_link) && (
                    <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full">No Digital Presence</span>
                  )}

                  {/* Stored Tags Read-Only */}
                  {lead.tags?.map((tag: string) => {
                    let pillColor = "bg-slate-100 text-slate-700";
                    if (tag === "SERP Ranked") pillColor = "bg-violet-100 text-violet-700";
                    if (tag === "Not SERP Ranked") pillColor = "bg-slate-100 text-slate-500";
                    if (tag !== "SERP Ranked" && tag !== "Not SERP Ranked") pillColor = "bg-amber-100 text-amber-700";

                    return (
                      <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pillColor}`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
              {lead.phone && (
                <a
                  href={`https://wa.me/91${lead.phone?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {lead.website_link && (
                <a
                  href={lead.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Open Website"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              <a
                href={
                  lead.gmb_link
                    ? lead.gmb_link
                    : `https://www.google.com/search?q=${encodeURIComponent(
                        (lead.company_name || "") + " " + (lead.city || "")
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title={lead.gmb_link ? "Open GMB Profile" : "Search on Google"}
              >
                <Search className="h-4 w-4" />
                {lead.gmb_link ? "GMB" : "Google"}
              </a>
              <button
                onClick={() => setShowCallModal(true)}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Log Call Outcome
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — 1/3 */}
          <div className="space-y-4">
            {/* Contact Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Contact Details
              </h3>
              <div className="space-y-3">
                {lead.contact_person && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{lead.contact_person}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{lead.email}</span>
                  </div>
                )}
                {lead.city && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{lead.city}</span>
                  </div>
                )}
                {lead.has_website && lead.website_link && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <a
                      href={lead.website_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {lead.website_link}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">
                    Added {formatDate(lead.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Outreach Progress Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Outreach Progress
              </h3>
              <div className="space-y-0">
                {STAGE_ORDER.map((stage, idx) => {
                  const currentIdx = STAGE_ORDER.indexOf(currentStage);
                  const isComplete = idx < currentIdx;
                  const isCurrent = stage === currentStage;

                  const timestamp = sequence
                    ? stage === "touch1_sent"
                      ? sequence.touch1_sent_at
                      : stage === "pdf_sent"
                      ? sequence.pdf_sent_at
                      : stage === "meeting_booked"
                      ? sequence.meeting_booked_at
                      : stage === "proposal_sent"
                      ? sequence.proposal_sent_at
                      : null
                    : null;

                  return (
                    <div key={stage} className="flex items-start gap-3 relative">
                      {/* Vertical line */}
                      {idx < STAGE_ORDER.length - 1 && (
                        <div
                          className={`absolute left-[11px] top-6 w-0.5 h-8 ${
                            isComplete ? "bg-green-400" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <div className="flex-shrink-0 mt-0.5">
                        {isComplete ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : isCurrent ? (
                          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 bg-indigo-50 flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                          </div>
                        ) : (
                          <Circle className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="pb-6">
                        <p
                          className={`text-sm font-semibold ${
                            isComplete
                              ? "text-green-700"
                              : isCurrent
                              ? "text-indigo-700"
                              : "text-slate-400"
                          }`}
                        >
                          {STAGE_LABELS[stage] || stage}
                        </p>
                        {timestamp && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDate(timestamp)} · {formatTime(timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market Intel Card */}
            {marketInsight && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Market Intelligence
                </h3>
                <div className="space-y-3">
                  {marketInsight.pitch_angle && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Pitch Angle</p>
                      <p className="text-sm text-slate-800 mt-0.5">
                        {marketInsight.pitch_angle}
                      </p>
                    </div>
                  )}
                  {marketInsight.search_volume && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Search Volume</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {marketInsight.search_volume}
                      </span>
                    </div>
                  )}
                  {marketInsight.market_difficulty && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Difficulty</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {marketInsight.market_difficulty}
                      </span>
                    </div>
                  )}
                  {marketInsight.top_competitors && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Top Competitors
                      </p>
                      {(Array.isArray(marketInsight.top_competitors)
                        ? marketInsight.top_competitors.slice(0, 3)
                        : []
                      ).map((comp: any, i: number) => (
                        <p key={i} className="text-xs text-slate-600">
                          • {typeof comp === "string" ? comp : comp.name || JSON.stringify(comp)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — 2/3 */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === tab.key
                        ? "border-b-2 border-indigo-500 text-indigo-700 bg-indigo-50/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Timeline Tab */}
                {activeTab === "timeline" && (
                  <div className="space-y-3">
                    {timeline.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No activity recorded yet.
                      </p>
                    )}
                    {timeline.map((event, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {event.type === "call" ? (
                            <Phone className="h-4 w-4 text-blue-500" />
                          ) : event.type === "pdf" ? (
                            <FileText className="h-4 w-4 text-violet-500" />
                          ) : event.type === "meeting" ? (
                            <Calendar className="h-4 w-4 text-green-500" />
                          ) : event.type === "proposal" ? (
                            <Target className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">
                            {event.description ||
                              event.outcome ||
                              event.pdf_name ||
                              event.proposal_number ||
                              event.event_type ||
                              "Event"}
                          </p>
                          {event.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {event.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Calls Tab */}
                {activeTab === "calls" && (
                  <div className="space-y-3">
                    {callOutcomes.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No call outcomes logged.
                      </p>
                    )}
                    {callOutcomes.map((c: any) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                              OUTCOME_COLORS[c.outcome] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.outcome}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                        {c.notes && (
                          <p className="text-sm text-slate-700 mt-1">{c.notes}</p>
                        )}
                        {c.follow_up_date && (
                          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Follow-up: {formatDate(c.follow_up_date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meetings Tab */}
                {activeTab === "meetings" && (
                  <div className="space-y-3">
                    {meetings.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No meetings scheduled.
                      </p>
                    )}
                    {meetings.map((m: any) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {new Date(m.scheduled_at).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                              m.status === "scheduled"
                                ? "bg-green-100 text-green-700"
                                : m.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : m.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.location}
                        </p>
                        {m.outcome && (
                          <p className="text-sm text-slate-700 mt-2">{m.outcome}</p>
                        )}
                        {m.notes && (
                          <p className="text-xs text-slate-500 mt-1">{m.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Proposals Tab */}
                {activeTab === "proposals" && (
                  <div className="space-y-3">
                    {proposals.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No proposals sent.
                      </p>
                    )}
                    {proposals.map((p: any) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-bold text-slate-800">
                              {p.proposal_number}
                            </span>
                            {p.proposal_type && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({p.proposal_type})
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                              p.status === "sent"
                                ? "bg-indigo-100 text-indigo-700"
                                : p.status === "accepted"
                                ? "bg-green-100 text-green-700"
                                : p.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        {p.monthly_value && (
                          <p className="text-sm font-mono font-semibold text-slate-800">
                            ₹{Number(p.monthly_value).toLocaleString("en-IN")}/mo
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Sent {formatDate(p.sent_at)}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-slate-500 mt-1">{p.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Outcome Modal */}
      {showCallModal && (
        <CallOutcomeModal
          leadId={lead.id}
          onClose={() => setShowCallModal(false)}
          onSuccess={() => setShowCallModal(false)}
        />
      )}
    </div>
  );
}
