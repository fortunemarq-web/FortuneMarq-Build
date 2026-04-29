"use client";

import { useState, useTransition } from "react";
import {
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  ArrowRight,
  AlertOctagon,
  User,
  MapPin,
  Building,
  Search,
  RotateCcw,
  Globe,
  Tag,
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
  lead_type: string | null;
  has_website: boolean | null;
  serp_ranked: boolean | null;
  follow_up_date: string | null;
  last_outcome: string | null;
  tags?: string[] | null;
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
  allNiches?: string[];
  allCities?: string[];
  searchVolumeMap?: Record<string, string>;
}

// ─── Outcome definitions ─────────────────────────────────────────
const OUTCOMES = [
  {
    id: "INTERESTED_BOOK_NOW",
    label: "Interested — Book Meeting Now",
    color: "bg-emerald-600 hover:bg-emerald-700",
    icon: Calendar,
    requiresDate: true,
    stage: "meeting_booked",
  },
  {
    id: "INTERESTED_CALLBACK",
    label: "Interested — Call Back to Book",
    color: "bg-teal-600 hover:bg-teal-700",
    icon: Clock,
    requiresDate: true,
    stage: "follow_up_due",
  },
  {
    id: "INTERESTED_SEND_PDF",
    label: "Interested — Send PDF First",
    color: "bg-blue-600 hover:bg-blue-700",
    icon: MessageCircle,
    requiresDate: false,
    stage: "nurture",
  },
  {
    id: "GATEKEEPER",
    label: "Gatekeeper — Owner Unavailable",
    color: "bg-orange-500 hover:bg-orange-600",
    icon: User,
    requiresDate: false,
    stage: null,
  },
  {
    id: "NO_ANSWER",
    label: "No Answer / Voicemail",
    color: "bg-slate-400 hover:bg-slate-500",
    icon: Phone,
    requiresDate: false,
    stage: null,
  },
  {
    id: "LANGUAGE_BARRIER",
    label: "Language Barrier",
    color: "bg-violet-500 hover:bg-violet-600",
    icon: MessageCircle,
    requiresDate: false,
    stage: null,
  },
  {
    id: "NOT_INTERESTED",
    label: "Not Interested",
    color: "bg-red-600 hover:bg-red-700",
    icon: X,
    requiresDate: false,
    requiresReason: true,
    stage: "disqualified",
  },
  {
    id: "FOLLOW_BACK",
    label: "Follow Back Later",
    color: "bg-amber-600 hover:bg-amber-700",
    icon: Clock,
    requiresDate: true,
    stage: null,
  },
  {
    id: "WRONG_NUMBER",
    label: "Wrong Number / Dead Lead",
    color: "bg-slate-600 hover:bg-slate-700",
    icon: AlertOctagon,
    requiresDate: false,
    stage: "disqualified",
  },
] as const;

const SCRIPT_TYPES: { value: ScriptType; label: string; desc: string }[] = [
  { value: "A", label: "Type A", desc: "Already ranking on Google" },
  { value: "B", label: "Type B", desc: "Has website, not ranking" },
  { value: "C", label: "Type C", desc: "No website, not ranking" },
  { value: "D", label: "Type D", desc: "Low-volume niche" },
];

export default function TelecallerCockpit({ leads, userId, dailyStats, allNiches, allCities, searchVolumeMap }: TelecallerCockpitProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOutcomeLogger, setShowOutcomeLogger] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [outcomeReason, setOutcomeReason] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedObjections, setExpandedObjections] = useState<Set<number>>(new Set());
  const [scriptTypeOverride, setScriptTypeOverride] = useState<ScriptType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "followups">("queue");
  const [filterNiche, setFilterNiche] = useState<string>("All");
  const [filterCity, setFilterCity] = useState<string>("All");

  const [stats, setStats] = useState(dailyStats);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // Use server-fetched full niche/city list if provided, otherwise derive from loaded leads
  const nicheOptions = allNiches && allNiches.length > 0
    ? allNiches
    : Array.from(new Set(leads.map((l) => l.industry).filter((x): x is string => !!x))).sort();
  const cityOptions = allCities && allCities.length > 0
    ? allCities
    : Array.from(new Set(leads.map((l) => l.city).filter((x): x is string => !!x))).sort();

  const niches = ["All", ...nicheOptions];
  const cities = ["All", ...cityOptions];

  // Tab split
  const isFollowUp = (l: Lead) => l.follow_up_date !== null;
  const tabLeads = activeTab === "followups" ? leads.filter(isFollowUp) : leads.filter((l) => !isFollowUp(l));

  // Filter
  const filteredLeads = tabLeads.filter((l) => {
    if (filterNiche !== "All" && l.industry !== filterNiche) return false;
    if (filterCity !== "All" && l.city !== filterCity) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.company_name?.toLowerCase().includes(q) ||
      l.contact_person?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q)
    );
  });

  // Sort follow-ups oldest first
  if (activeTab === "followups") {
    filteredLeads.sort((a, b) =>
      new Date(a.follow_up_date as string).getTime() - new Date(b.follow_up_date as string).getTime()
    );
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredLeads.length - 1));
  const currentLead = filteredLeads[safeIndex] || null;

  // Script type auto-detection
  const effectiveScriptType: ScriptType | null = (() => {
    if (scriptTypeOverride) return scriptTypeOverride;
    const lt = currentLead?.lead_type?.toUpperCase();
    if (lt === "A" || lt === "B" || lt === "C" || lt === "D") return lt as ScriptType;
    const tags = currentLead?.tags || [];
    const serpRanked = tags.some((t) => t === "SERP Ranked") || !!currentLead?.serp_ranked;
    const hasWebsite = tags.some((t) => t === "Has Website") || !!currentLead?.has_website;
    const notRanked = tags.some((t) => t === "Not SERP Ranked");
    if (serpRanked) return "A";
    if (notRanked && hasWebsite) return "B";
    if (notRanked && !hasWebsite) return "C";
    if (currentLead?.serp_ranked) return "A";
    if (!currentLead?.serp_ranked && currentLead?.has_website) return "B";
    if (!currentLead?.serp_ranked && !currentLead?.has_website) return "C";
    return null;
  })();

  const searchVolumeForLead = (() => {
    if (!currentLead?.industry || !currentLead?.city) return null;
    const key = `${currentLead.industry}__${currentLead.city}`.toLowerCase();
    return searchVolumeMap?.[key] || null;
  })();

  const script: TelecallerScript | null = effectiveScriptType && currentLead
    ? getFilledScript(
        {
          SERP_Ranked: currentLead.serp_ranked ? "Y" : "N",
          Has_Website: currentLead.has_website ? "Y" : "N",
          isLowVolume: effectiveScriptType === "D",
        },
        {
          businessName: currentLead.company_name || "[Business]",
          city: currentLead.city || "[City]",
          niche: currentLead.industry || "[Niche]",
          nicheKeyword: `${currentLead.industry || "business"} near me`,
          searchVolume: searchVolumeForLead || "[Search Volume]",
        }
      )
    : null;

  // Navigate to next/prev lead
  function goToLead(index: number) {
    setCurrentIndex(index);
    setCurrentStep(0);
    setExpandedObjections(new Set());
    setScriptTypeOverride(null);
    setShowOutcomeLogger(false);
  }

  async function logOutcome() {
    if (!currentLead || !selectedOutcome || !userId) return;
    const outcome = OUTCOMES.find((o) => o.id === selectedOutcome);
    if (!outcome) return;

    startTransition(async () => {
      await (supabase.from("outreach_logs" as any).insert({
        lead_id: currentLead.id,
        actor_id: userId,
        touch_type: selectedOutcome === "INTERESTED_SEND_PDF" ? "pdf_sent" : "follow_up_call",
        outcome: selectedOutcome,
        note: outcomeReason || null,
        created_at: new Date().toISOString(),
      }) as any);

      if (outcome.stage) {
        await supabase.from("leads").update({
          status: outcome.stage,
          follow_up_date: dateTime || null,
          last_outcome: selectedOutcome,
        }).eq("id", currentLead.id);
      } else if (dateTime) {
        await supabase.from("leads").update({ follow_up_date: dateTime, last_outcome: selectedOutcome }).eq("id", currentLead.id);
      } else {
        await supabase.from("leads").update({ last_outcome: selectedOutcome }).eq("id", currentLead.id);
      }

      setStats((s) => ({
        ...s,
        callsToday: s.callsToday + 1,
        followupsLoggedToday: s.followupsLoggedToday + 1,
        meetingsBookedToday: selectedOutcome === "INTERESTED_BOOK_NOW" ? s.meetingsBookedToday + 1 : s.meetingsBookedToday,
        pdfsSentToday: selectedOutcome === "INTERESTED_SEND_PDF" ? s.pdfsSentToday + 1 : s.pdfsSentToday,
      }));

      setShowOutcomeLogger(false);
      setSelectedOutcome(null);
      setOutcomeReason("");
      setDateTime("");

      // Auto-advance to next lead
      if (safeIndex < filteredLeads.length - 1) {
        goToLead(safeIndex + 1);
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── STATS BAR ──────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between py-3 gap-6 overflow-x-auto">
            <p className="text-sm font-bold text-slate-900 shrink-0">📞 Today</p>
            <div className="flex items-center gap-6 shrink-0">
              {[
                { label: "Calls", value: stats.callsToday, color: "text-blue-600" },
                { label: "PDFs", value: stats.pdfsSentToday, color: "text-purple-600" },
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

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">

        {/* ── FILTER CARD ────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          {/* Queue / Follow-up tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => { setActiveTab("queue"); setCurrentIndex(0); }}
              className={`flex-1 text-sm font-semibold px-3 py-1.5 rounded-md transition-all ${
                activeTab === "queue" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Priority Queue
            </button>
            <button
              onClick={() => { setActiveTab("followups"); setCurrentIndex(0); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-all ${
                activeTab === "followups" ? "bg-white shadow-sm text-[#42CA80]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Follow-ups
              {leads.filter(l => l.follow_up_date !== null).length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === "followups" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                  {leads.filter(l => l.follow_up_date !== null).length}
                </span>
              )}
            </button>
          </div>

          {/* Niche + City selectors */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterNiche}
              onChange={(e) => { setFilterNiche(e.target.value); setCurrentIndex(0); }}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
            >
              {niches.map(n => <option key={n} value={n}>{n === "All" ? "All Niches" : n}</option>)}
            </select>
            <select
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); setCurrentIndex(0); }}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
            >
              {cities.map(c => <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>)}
            </select>
          </div>

          {/* Search + lead count */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
              />
            </div>
            <span className="text-sm font-mono text-slate-500 shrink-0 bg-slate-100 px-3 py-2 rounded-xl">
              {filteredLeads.length > 0 ? `${safeIndex + 1} / ${filteredLeads.length}` : "0"}
            </span>
          </div>
        </div>

        {/* ── EMPTY STATE ────────────────────────────── */}
        {filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
            <CheckCircle2 className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No leads match — try adjusting filters</p>
          </div>
        )}

        {/* ── LEAD CARD & NAVIGATION ──────────────────────────────── */}
        {currentLead && (
          <>
            {/* ── LEAD NAVIGATION ──────── */}
            <div className="flex gap-2">
              <button
                onClick={() => goToLead(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Lead
              </button>
              <button
                onClick={() => goToLead(Math.min(filteredLeads.length - 1, safeIndex + 1))}
                disabled={safeIndex >= filteredLeads.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next Lead <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Lead name + status */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{currentLead.company_name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                      {currentLead.contact_person && (
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{currentLead.contact_person}</span>
                      )}
                      {currentLead.city && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{currentLead.city}</span>
                      )}
                      {currentLead.industry && (
                        <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{currentLead.industry}</span>
                      )}
                    </div>
                  </div>
                  {effectiveScriptType && (
                    <span className="shrink-0 text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg">
                      Script {effectiveScriptType}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {(currentLead.tags && currentLead.tags.length > 0) && (
                <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                  {currentLead.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      <Tag className="h-2.5 w-2.5" />{tag}
                    </span>
                  ))}
                  {currentLead.has_website && (
                    <span className="flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      <Globe className="h-2.5 w-2.5" />Has Website
                    </span>
                  )}
                </div>
              )}

              {/* Phone number — big tap target */}
              {currentLead.phone && (
                <div className="px-5 pb-4">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${currentLead.phone}`}
                      className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-[#42CA80] to-[#3ab872] hover:from-[#35A66A] hover:to-[#33a068] text-slate-900 font-bold py-4 rounded-xl text-lg tracking-wider font-mono transition-all active:scale-[0.98]"
                    >
                      <Phone className="h-5 w-5" />
                      {currentLead.phone}
                    </a>
                    <a
                      href={`https://wa.me/${currentLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Previous notes */}
              {currentLead.notes && (
                <div className="px-5 pb-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Previous Notes</p>
                    <p className="text-sm text-amber-900">{currentLead.notes}</p>
                  </div>
                </div>
              )}

              {/* Last outcome */}
              {currentLead.last_outcome && (
                <div className="px-5 pb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Outcome: </span>
                  <span className="text-xs font-semibold text-slate-600">{currentLead.last_outcome.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>

            {/* ── FOLLOW-UP RECONNECT SCRIPT ─────────── */}
            {activeTab === "followups" && (
              <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2 bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">Follow-Up Reconnect</p>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-slate-800 border-l-4 border-amber-400 pl-3">
                    &quot;Hi {currentLead.contact_person || 'there'}, this is Afifa calling back from FortuneMarq. We spoke previously and you mentioned we should touch base today.&quot;
                  </p>
                  <p className="text-sm text-slate-800 border-l-4 border-amber-400 pl-3">
                    &quot;Are you still available for a quick chat regarding the online growth system for {currentLead.company_name}?&quot;
                  </p>
                </div>
              </div>
            )}

            {/* ── SCRIPT (queue tab) ─────────────────── */}
            {activeTab === "queue" && (
              !effectiveScriptType ? (
                <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-amber-700 mb-4">
                    ⚠️ No script type detected. Select manually:
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
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Call Script</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {script?.typeLabel || `Script Type ${effectiveScriptType}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => { setCurrentStep(0); setExpandedObjections(new Set()); }}
                        className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-white transition-colors shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset
                      </button>
                      <select
                        value={scriptTypeOverride || effectiveScriptType}
                        onChange={(e) => { setScriptTypeOverride(e.target.value as ScriptType); setCurrentStep(0); setExpandedObjections(new Set()); }}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80] flex-1 min-w-0"
                      >
                        {SCRIPT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {script && (() => {
                    const steps = script.steps;
                    const step = steps[currentStep];
                    const totalSteps = steps.length;
                    return (
                      <div className="p-5 space-y-4">
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {steps.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => { setCurrentStep(i); setExpandedObjections(new Set()); }}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  i < currentStep ? "bg-[#42CA80]" : i === currentStep ? "bg-indigo-500" : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono text-slate-500 shrink-0">
                            {currentStep + 1} / {totalSteps}
                          </span>
                        </div>

                        {/* Step header */}
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">
                            {step.stepId}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{step.stepName}</h3>
                        </div>

                        {/* Script lines */}
                        <div className="space-y-2">
                          {step.lines.map((line, j) => (
                            <div
                              key={j}
                              className={`text-sm leading-relaxed p-3.5 rounded-lg ${
                                line.type === "branch"
                                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                                  : "bg-slate-900 text-green-300 font-mono"
                              }`}
                            >
                              {line.type === "branch" && line.condition && (
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                                  {line.condition}
                                </p>
                              )}
                              {line.text}
                            </div>
                          ))}
                        </div>

                        {/* Objections */}
                        {step.objections.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              If they object...
                            </p>
                            {step.objections.map((obj, k) => (
                              <div key={k} className="rounded-lg border border-slate-200 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setExpandedObjections((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(k)) next.delete(k); else next.add(k);
                                      return next;
                                    });
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-orange-50 text-left transition-colors"
                                >
                                  <span className="text-xs font-semibold text-slate-700">
                                    💬 &quot;{obj.trigger}&quot;
                                  </span>
                                  {expandedObjections.has(k)
                                    ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                                  }
                                </button>
                                {expandedObjections.has(k) && (
                                  <div className="px-3 py-3 bg-indigo-50 border-t border-slate-200">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">Say this:</p>
                                    <p className="text-sm text-slate-800 leading-relaxed">{obj.response}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Script Prev / Next */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => { setCurrentStep((s) => Math.max(0, s - 1)); setExpandedObjections(new Set()); }}
                            disabled={currentStep === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" /> Previous
                          </button>
                          {currentStep < totalSteps - 1 ? (
                            <button
                              onClick={() => { setCurrentStep((s) => s + 1); setExpandedObjections(new Set()); }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowOutcomeLogger(true)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#42CA80] hover:bg-[#35A66A] text-white text-sm font-semibold transition-colors"
                            >
                              Log Outcome <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )
            )}

            {/* ── LOG OUTCOME ──────── */}
            <div className="space-y-2 pb-6">
              <button
                onClick={() => setShowOutcomeLogger(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <FileText className="h-4 w-4" />
                Log Call Outcome
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── OUTCOME LOGGER MODAL ───────────────────────────────────── */}
      {showOutcomeLogger && currentLead && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <p className="font-bold text-slate-900 text-base">Log Outcome</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{currentLead.company_name}</p>
              </div>
              <button
                onClick={() => { setShowOutcomeLogger(false); setSelectedOutcome(null); setOutcomeReason(""); setDateTime(""); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OUTCOMES.map((outcome) => {
                  const Icon = outcome.icon;
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => setSelectedOutcome(outcome.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all ${outcome.color} ${
                        selectedOutcome === outcome.id ? "ring-2 ring-white ring-offset-1 scale-[0.98]" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {outcome.label}
                    </button>
                  );
                })}
              </div>

              {selectedOutcome && OUTCOMES.find((o) => o.id === selectedOutcome && (o as any).requiresDate) && (
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

              {selectedOutcome === "NOT_INTERESTED" && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
                  <select
                    value={outcomeReason}
                    onChange={(e) => setOutcomeReason(e.target.value)}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                  >
                    <option value="">Select reason...</option>
                    {["Already has an agency", "No budget right now", "Not the decision maker", "Bad timing / not now", "Service not relevant", "Rude / hung up", "Other"].map((r) => (
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
                  {isPending ? "Saving..." : "Save & Next Lead"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
