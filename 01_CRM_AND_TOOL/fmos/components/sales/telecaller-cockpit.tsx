"use client";

import { useState, useTransition } from "react";
import {
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  ArrowRight,
  AlertOctagon,
  User,
  MapPin,
  Building,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { TelecallerScript, ScriptType } from "@/lib/data/scripts/script.types";
import { getFilledScript } from "@/lib/data/scripts/scripts_index";

// ─── Types ──────────────────────────────────────────────────────
interface Lead {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  industry: string | null;
  city: string | null;
  status: string | null;
  notes: string | null;
  lead_type: string | null;    // "A" | "B" | "C" | "D" for script selection
  has_website: boolean | null;
  serp_ranked: boolean | null;
  follow_up_date: string | null;
  last_outcome: string | null;
}

interface DailyStats {
  callsToday: number;
  pdfsSentToday: number;
  meetingsBookedToday: number;
  followupsLoggedToday: number;
}

interface TelecallerCockpitProps {
  leads: Lead[];
  userId: string | null;
  dailyStats: DailyStats;
}

// ─── Outcome definitions ─────────────────────────────────────────
const OUTCOMES = [
  {
    id: "INTERESTED_BOOK_NOW",
    label: "INTERESTED — Book Now",
    color: "bg-emerald-600 hover:bg-emerald-700",
    icon: Calendar,
    requiresDate: true,
    stage: "meeting_booked",
  },
  {
    id: "INTERESTED_FOLLOW_UP_LATER",
    label: "INTERESTED — Follow Up Later",
    color: "bg-teal-600 hover:bg-teal-700",
    icon: Clock,
    requiresDate: true,
    stage: "follow_up_due",
  },
  {
    id: "INTERESTED_SEND_INFO",
    label: "INTERESTED — Send Info",
    color: "bg-blue-600 hover:bg-blue-700",
    icon: MessageCircle,
    requiresDate: false,
    stage: "nurture",
  },
  {
    id: "NOT_INTERESTED",
    label: "NOT INTERESTED",
    color: "bg-red-600 hover:bg-red-700",
    icon: X,
    requiresDate: false,
    requiresReason: true,
    stage: "disqualified",
    reasons: [
      "Already has an agency",
      "No budget right now",
      "Not the decision maker",
      "Bad timing / not now",
      "Service not relevant",
      "Other",
    ],
  },
  {
    id: "FOLLOW_BACK",
    label: "FOLLOW BACK",
    color: "bg-amber-600 hover:bg-amber-700",
    icon: Clock,
    requiresDate: true,
    stage: null,
  },
  {
    id: "WRONG_NUMBER",
    label: "WRONG / DEAD NUMBER",
    color: "bg-slate-600 hover:bg-slate-700",
    icon: AlertOctagon,
    requiresDate: false,
    stage: "disqualified",
  },
  {
    id: "NO_ANSWER",
    label: "NO ANSWER",
    color: "bg-slate-400 hover:bg-slate-500",
    icon: Phone,
    requiresDate: false,
    stage: null,
  },
] as const;

const SCRIPT_TYPES: { value: ScriptType; label: string; desc: string }[] = [
  { value: "A", label: "Type A", desc: "Already ranking on Google" },
  { value: "B", label: "Type B", desc: "Has website, not ranking" },
  { value: "C", label: "Type C", desc: "No website, not ranking" },
  { value: "D", label: "Type D", desc: "Low-volume niche" },
];

export default function TelecallerCockpit({ leads, userId, dailyStats }: TelecallerCockpitProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showOutcomeLogger, setShowOutcomeLogger] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [outcomeReason, setOutcomeReason] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [scriptTypeOverride, setScriptTypeOverride] = useState<ScriptType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "followups">("queue");
  const [filterNiche, setFilterNiche] = useState<string>("All");
  const [filterCity, setFilterCity] = useState<string>("All");
  const [filterWebsite, setFilterWebsite] = useState<"All" | "Has" | "No">("All");

  const [stats, setStats] = useState(dailyStats);
  const [isPending, startTransition] = useTransition();

  const niches = ["All", ...Array.from(new Set(leads.map((l) => l.industry).filter((x): x is string => x !== null && x !== undefined)))];
  const cities = ["All", ...Array.from(new Set(leads.map((l) => l.city).filter((x): x is string => x !== null && x !== undefined)))];

  const supabase = createClient();
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  // Determine script type for selected lead
  const effectiveScriptType: ScriptType | null = (() => {
    if (scriptTypeOverride) return scriptTypeOverride;
    const lt = selectedLead?.lead_type?.toUpperCase();
    if (lt === "A" || lt === "B" || lt === "C" || lt === "D") return lt as ScriptType;
    return null;
  })();

  const script: TelecallerScript | null = effectiveScriptType && selectedLead
    ? getFilledScript(
        {
          SERP_Ranked: selectedLead.serp_ranked ? "Y" : "N",
          Has_Website: selectedLead.has_website ? "Y" : "N",
          isLowVolume: effectiveScriptType === "D",
        },
        {
          businessName: selectedLead.company_name || "[Business]",
          city: selectedLead.city || "[City]",
          niche: selectedLead.industry || "[Niche]",
          nicheKeyword: `${selectedLead.industry || "business"} near me`,
          searchVolume: "—",
        }
      )
    : null;

  // Tab split
  const isFollowUp = (l: Lead) => l.follow_up_date !== null;
  const currentTabLeads = activeTab === "followups" ? leads.filter(isFollowUp) : leads.filter((l) => !isFollowUp(l));

  // Filter leads by search and dropdowns
  let filteredLeads = currentTabLeads.filter((l) => {
    // Dropdowns
    if (filterNiche !== "All" && l.industry !== filterNiche) return false;
    if (filterCity !== "All" && l.city !== filterCity) return false;
    if (filterWebsite === "Has" && !l.has_website && !l.serp_ranked) return false;
    if (filterWebsite === "No" && (l.has_website || l.serp_ranked)) return false;

    // Search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.company_name?.toLowerCase().includes(q) ||
      l.contact_person?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q)
    );
  });

  // Sort follow-ups (overdue -> today -> upcoming)
  if (activeTab === "followups") {
    filteredLeads.sort((a, b) => {
      const timeA = new Date(a.follow_up_date as string).getTime();
      const timeB = new Date(b.follow_up_date as string).getTime();
      return timeA - timeB; // Ascending (oldest first i.e. overdue)
    });
  }

  async function logOutcome() {
    if (!selectedLead || !selectedOutcome || !userId) return;
    const outcome = OUTCOMES.find((o) => o.id === selectedOutcome);
    if (!outcome) return;

    startTransition(async () => {
      // Log to outreach_logs
      await (supabase.from("outreach_logs" as any).insert({
        lead_id: selectedLead.id,
        actor_id: userId,
        touch_type: selectedOutcome === "INTERESTED_SEND_INFO" ? "pdf_sent" : "follow_up_call",
        outcome: selectedOutcome,
        note: outcomeReason || null,
        created_at: new Date().toISOString(),
      }) as any);

      // Update lead status if applicable
      if (outcome.stage) {
        await supabase
          .from("leads")
          .update({
            status: outcome.stage,
            follow_up_date: dateTime || null,
            last_outcome: selectedOutcome,
          })
          .eq("id", selectedLead.id);
      } else if (dateTime) {
        await supabase
          .from("leads")
          .update({ follow_up_date: dateTime, last_outcome: selectedOutcome })
          .eq("id", selectedLead.id);
      } else {
        await supabase
          .from("leads")
          .update({ last_outcome: selectedOutcome })
          .eq("id", selectedLead.id);
      }

      // Update local stats
      setStats((s) => ({
        ...s,
        callsToday: s.callsToday + 1,
        followupsLoggedToday: s.followupsLoggedToday + 1,
        meetingsBookedToday: selectedOutcome === "INTERESTED_BOOK_NOW" ? s.meetingsBookedToday + 1 : s.meetingsBookedToday,
        pdfsSentToday: selectedOutcome === "INTERESTED_SEND_INFO" ? s.pdfsSentToday + 1 : s.pdfsSentToday,
      }));

      setShowOutcomeLogger(false);
      setSelectedOutcome(null);
      setOutcomeReason("");
      setDateTime("");
      setSelectedLeadId(null);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── DAILY STATS BAR ───────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3 gap-6 overflow-x-auto">
            <p className="text-sm font-bold text-slate-900 shrink-0">
              📞 Today&apos;s Session
            </p>
            <div className="flex items-center gap-6 shrink-0">
              {[
                { label: "Calls", value: stats.callsToday, color: "text-blue-600" },
                { label: "PDFs Sent", value: stats.pdfsSentToday, color: "text-purple-600" },
                { label: "Meetings", value: stats.meetingsBookedToday, color: "text-emerald-600" },
                { label: "Follow-ups", value: stats.followupsLoggedToday, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: CALL QUEUE ──────────────────────── */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg mb-3">
                <button
                  onClick={() => { setActiveTab("queue"); setSelectedLeadId(null); }}
                  className={`flex-1 text-sm font-semibold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === "queue" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Priority Queue
                </button>
                <button
                  onClick={() => { setActiveTab("followups"); setSelectedLeadId(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-all ${
                    activeTab === "followups" ? "bg-white shadow-sm text-[#42CA80]" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Follow-ups
                  {leads.filter(l => l.follow_up_date !== null).length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "followups" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                      {leads.filter(l => l.follow_up_date !== null).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select value={filterNiche} onChange={(e) => setFilterNiche(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80]">
                  {niches.map(n => <option key={n} value={n}>{n === "All" ? "All Niches" : n}</option>)}
                </select>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80]">
                  {cities.map(c => <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-3">
                <select value={filterWebsite} onChange={(e) => setFilterWebsite(e.target.value as any)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80]">
                  <option value="All">Website: All</option>
                  <option value="Has">Has Website/Ranked</option>
                  <option value="No">No Digital Presence</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {filteredLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">No leads match</p>
                </div>
              )}
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setScriptTypeOverride(null);
                    setExpandedStep(0);
                    setShowOutcomeLogger(false);
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    selectedLeadId === lead.id
                      ? "border-[#42CA80] bg-emerald-50 shadow-sm ring-1 ring-[#42CA80]/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">{lead.company_name}</p>
                      {lead.contact_person && (
                        <p className="text-xs text-slate-500 truncate">{lead.contact_person}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {lead.city && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />{lead.city}
                          </span>
                        )}
                        {lead.industry && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Building className="h-2.5 w-2.5" />{lead.industry}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {lead.lead_type && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                          Script {lead.lead_type.toUpperCase()}
                        </span>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: SCRIPT + OUTCOME ───────────────── */}
          <div className="lg:col-span-2">
            {!selectedLead ? (
              <div className="flex flex-col items-center justify-center h-96 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
                <Phone className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Select a lead to load their script</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lead header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedLead.company_name}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                        {selectedLead.contact_person && (
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{selectedLead.contact_person}</span>
                        )}
                        {selectedLead.city && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedLead.city}</span>
                        )}
                        {selectedLead.industry && (
                          <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{selectedLead.industry}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {selectedLead.phone && (
                        <a
                          href={`tel:${selectedLead.phone}`}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      )}
                      {selectedLead.phone && (
                        <a
                          href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Script type selector or loaded script */}
                {activeTab === "followups" ? (
                  <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden mb-4">
                    <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2 bg-amber-50">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">Follow-Up Reconnect</p>
                    </div>
                    <div className="p-5 space-y-4">
                      {selectedLead.last_outcome && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                            Last Outcome
                          </span>
                          <span className="text-sm font-medium text-slate-800">{selectedLead.last_outcome.replace(/_/g, " ")}</span>
                        </div>
                      )}
                      {selectedLead.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 mb-4">
                          <strong className="block text-xs uppercase tracking-wider mb-1">Previous Notes</strong>
                          {selectedLead.notes}
                        </div>
                      )}
                      <p className="text-sm text-slate-800 border-l-4 border-amber-400 pl-3">
                        &quot;Hi {selectedLead.contact_person || 'there'}, this is calling back from FortuneMarq. 
                        We spoke previously and you mentioned we should touch base today.&quot;
                      </p>
                      <p className="text-sm text-slate-800 border-l-4 border-amber-400 pl-3">
                        &quot;Are you still available for a quick chat regarding the online growth system for {selectedLead.company_name}?&quot;
                      </p>
                    </div>
                  </div>
                ) : !effectiveScriptType ? (
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-sm font-semibold text-amber-700 mb-4">
                      ⚠️ No script type set for this lead. Select the type that best matches them:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {SCRIPT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setScriptTypeOverride(t.value)}
                          className="text-left border border-slate-200 rounded-xl p-4 hover:border-[#42CA80] hover:bg-emerald-50 transition-all"
                        >
                          <p className="text-sm font-bold text-slate-900">{t.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Script header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                          FortuneMarq Call Script
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {script?.typeLabel || `Script Type ${effectiveScriptType}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={scriptTypeOverride || effectiveScriptType}
                          onChange={(e) => setScriptTypeOverride(e.target.value as ScriptType)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                        >
                          {SCRIPT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Script steps */}
                    <div className="divide-y divide-slate-100">
                      {(script?.steps || []).map((step, i) => (
                        <div key={step.stepId}>
                          <button
                            onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                              {step.stepId}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-slate-800">{step.stepName}</span>
                            {expandedStep === i ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                          {expandedStep === i && (
                            <div className="px-5 pb-4 space-y-3 bg-slate-50/60">
                              {step.lines.map((line, j) => (
                                <div key={j} className={`text-sm leading-relaxed p-3 rounded-lg ${
                                  line.type === "branch"
                                    ? "bg-amber-50 border border-amber-200 text-amber-900"
                                    : "bg-white border border-slate-200 text-slate-800"
                                }`}>
                                  {line.type === "branch" && line.condition && (
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                                      {line.condition}
                                    </p>
                                  )}
                                  {line.text}
                                </div>
                              ))}
                              {step.objections.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Common Objections
                                  </p>
                                  {step.objections.map((obj, k) => (
                                    <div key={k} className="mb-2 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                                      <p className="bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
                                        💬 &quot;{obj.trigger}&quot;
                                      </p>
                                      <p className="px-3 py-2 text-slate-700 leading-relaxed">{obj.response}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── OUTCOME LOGGER ──────────────────── */}
                {!showOutcomeLogger ? (
                  <button
                    onClick={() => setShowOutcomeLogger(true)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Log Call Outcome
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Log Outcome</p>
                      <button onClick={() => { setShowOutcomeLogger(false); setSelectedOutcome(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {OUTCOMES.map((outcome) => {
                        const Icon = outcome.icon;
                        return (
                          <button
                            key={outcome.id}
                            onClick={() => setSelectedOutcome(outcome.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all ${outcome.color} ${
                              selectedOutcome === outcome.id ? "ring-2 ring-white scale-[0.98]" : ""
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {outcome.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Date/time picker for outcomes that need it */}
                    {selectedOutcome && OUTCOMES.find((o) => o.id === selectedOutcome && o.requiresDate) && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {selectedOutcome === "INTERESTED_BOOK_NOW" ? "Meeting Date & Time" : "Follow-up Date & Time"}
                        </label>
                        <input
                          type="datetime-local"
                          value={dateTime}
                          onChange={(e) => setDateTime(e.target.value)}
                          className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                        />
                      </div>
                    )}

                    {/* Reason picker for NOT_INTERESTED */}
                    {selectedOutcome === "NOT_INTERESTED" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
                        <select
                          value={outcomeReason}
                          onChange={(e) => setOutcomeReason(e.target.value)}
                          className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                        >
                          <option value="">Select reason...</option>
                          {["Already has an agency", "No budget right now", "Not the decision maker", "Bad timing / not now", "Service not relevant", "Other"].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedOutcome && (
                      <button
                        onClick={logOutcome}
                        disabled={isPending || (selectedOutcome === "NOT_INTERESTED" && !outcomeReason)}
                        className="w-full bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        {isPending ? "Saving..." : "Save Outcome"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
