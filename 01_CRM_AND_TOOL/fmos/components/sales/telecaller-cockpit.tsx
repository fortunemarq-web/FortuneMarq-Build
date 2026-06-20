"use client";

import { useState, useEffect, useTransition } from "react";
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
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { TelecallerScript, ScriptType } from "@/lib/data/scripts/script.types";
import { getFilledScript } from "@/lib/data/scripts/scripts_index";
import WhatsAppTemplatePicker from "./whatsapp-template-picker";
import { sendNotification } from "@/lib/notifications";
import { fireTrigger } from "@/actions/automations";
import { sendOutcomeWhatsApp } from "@/actions/outcome-wa-send";
import { bookMeeting } from "@/actions/book-meeting";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { FOLLOW_UP_QUEUE_STAGES, stageToStatus } from "@/lib/pipeline";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

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
  no_answer_count?: number | null;
  gatekeeper_count?: number | null;
  outreach_stage: string | null;
  lead_source?: string | null;
  captured_at?: string | null;
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

// ─── Language labels ──────────────────────────────────────────────
const LANG_LABEL: Record<"kannada" | "hindi" | "english", string> = {
  kannada: "ಕನ್ನಡ",
  hindi: "हिंदी",
  english: "English",
};

// ─── Outcome definitions ─────────────────────────────────────────
// Status collapses to the five tones — no per-outcome rainbow.
// positive=brand · negative=danger · neutral=slate · waiting=warning/info.
const OUTCOME_TONE_CLASSES: Record<Tone, string> = {
  brand: "border-brand-line bg-brand-soft text-brand-deep hover:bg-brand/10",
  warning: "border-warn-line bg-warn-soft text-warn hover:bg-warn/10",
  info: "border-info-line bg-info-soft text-info hover:bg-info/10",
  neutral: "border-line bg-slate-50 text-slate-700 hover:bg-slate-100",
  danger: "border-danger-line bg-danger-soft text-danger hover:bg-red-100",
};

const OUTCOMES = [
  {
    id: "INTERESTED_BOOK",
    label: "Interested — Book Meeting Now",
    tone: "brand",
    icon: Calendar,
    requiresDate: true,
    stage: "meeting_booked",
  },
  {
    id: "INTERESTED_FOLLOW_UP",
    label: "Interested — Follow Up Later",
    tone: "brand",
    icon: Clock,
    requiresDate: true,
    stage: "follow_up_due",
  },
  {
    id: "INTERESTED_SEND_INFO",
    label: "Interested — Send Info / PDF",
    tone: "info",
    icon: FileText,
    requiresDate: false,
    stage: "pdf_sent",
  },
  {
    id: "NOT_INTERESTED",
    label: "Not Interested",
    tone: "danger",
    icon: X,
    requiresDate: false,
    requiresReason: true,
    stage: "not_interested",
  },
  {
    id: "FOLLOW_BACK",
    label: "Follow Back Later",
    tone: "warning",
    icon: Clock,
    requiresDate: true,
    stage: "follow_back",
  },
  {
    id: "WRONG_NUMBER",
    label: "Wrong / Dead Number",
    tone: "neutral",
    icon: AlertOctagon,
    requiresDate: false,
    stage: "dead",
  },
  {
    id: "NO_ANSWER",
    label: "No Answer",
    tone: "neutral",
    icon: Phone,
    requiresDate: false,
    stage: "no_answer",
  },
  {
    id: "GATEKEEPER",
    label: "Gatekeeper — Owner Not Available",
    tone: "warning",
    icon: User,
    requiresDate: false,
    stage: "gatekeeper",
  },
  {
    id: "LANGUAGE_BARRIER",
    label: "Language Barrier",
    tone: "info",
    icon: MessageCircle,
    requiresDate: false,
    stage: "language_barrier",
  },
] as const satisfies readonly {
  id: string; label: string; tone: Tone; icon: any;
  requiresDate: boolean; requiresReason?: boolean; stage: string;
}[];

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
  const [selectedLang, setSelectedLang] = useState<"kannada" | "hindi" | "english" | null>(null);
  const [scriptTypeOverride, setScriptTypeOverride] = useState<ScriptType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "followups">("queue");
  const [filterNiche, setFilterNiche] = useState<string>("All");
  const [filterCity, setFilterCity] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterOutcome, setFilterOutcome] = useState<string>("All");
  const [followUpPreset, setFollowUpPreset] = useState<"today" | "1hour" | "tomorrow" | null>(null);
  const [followUpCustomTime, setFollowUpCustomTime] = useState<string>("");

  const [stats, setStats] = useState(dailyStats);
  const [callTarget, setCallTarget] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Add lead modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ company_name: "", phone: "", industry: "", city: "", contact_person: "", has_website: false, notes: "", source: "manual" });
  const [addLeadError, setAddLeadError] = useState<string | null>(null);
  const [addLeadLoading, setAddLeadLoading] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  const supabase = createClient();

  // PDF options based on lead's niche+city
  const getPdfOptions = (niche: string | null, city: string | null): string[] => {
    if (!niche || !city) return [];
    const nicheSlug = niche.toLowerCase().replace(/\s+/g, "_");
    const citySlug = city.toLowerCase().replace(/\s+/g, "_");
    return [
      `${citySlug}_${nicheSlug}_EN.pdf`,
      `${citySlug}_${nicheSlug}_KN.pdf`,
    ];
  };

  // Use server-fetched full niche/city list if provided, otherwise derive from loaded leads
  const nicheOptions = allNiches && allNiches.length > 0
    ? allNiches
    : Array.from(new Set(leads.map((l) => l.industry).filter((x): x is string => !!x))).sort();
  const cityOptions = allCities && allCities.length > 0
    ? allCities
    : Array.from(new Set(leads.map((l) => l.city).filter((x): x is string => !!x))).sort();

  const niches = ["All", ...nicheOptions];
  const cities = ["All", ...cityOptions];

  // Tab split — queue membership comes from the shared state machine
  const isFollowUp = (l: Lead) =>
    FOLLOW_UP_QUEUE_STAGES.includes(l.outreach_stage || "");

  const isReportEngaged = (l: Lead) =>
    l.tags?.includes("tapped_book_meeting") || l.tags?.includes("tapped_tell_me_more");

  // ─── Lead score (priority) — decides who Afifa calls first ─────────
  // Maps the lead's real fields onto the scoring factors in lib/lead-scoring.ts.
  const scoreLead = (l: Lead): number =>
    calculateLeadScore({
      hasPhone: !!l.phone,
      hasBusinessName: !!l.company_name,
      // We have a ready PDF/script kit when both niche + city are known.
      isNicheKitComplete: !!l.industry && !!l.city,
      hasFollowUpScheduled: !!l.follow_up_date,
      isInterestedOnce:
        (l.last_outcome?.startsWith("INTERESTED") ?? false) ||
        ["pdf_sent", "follow_up_due", "meeting_booked", "curiosity_sent"].includes(l.outreach_stage || "") ||
        !!isReportEngaged(l),
      isNotInterested: l.outreach_stage === "not_interested" || l.last_outcome === "NOT_INTERESTED",
      noContactIn7Days: false, // refine once last_activity_at is surfaced to the cockpit
    });

  // No-emoji visual (design rule): tone dot + word label only.
  // Hot=brand · Warm=warning · Cold=neutral — within the five-tone system.
  const scoreVisual = (score: number): { label: string; tone: Tone } => {
    if (score >= 7) return { label: "Hot", tone: "brand" };
    if (score >= 4) return { label: "Warm", tone: "warning" };
    return { label: "Cold", tone: "neutral" };
  };

  const tabLeads = activeTab === "followups" ? localLeads.filter(isFollowUp) : localLeads.filter((l) => !isFollowUp(l));

  // Filter
  const getLeadScriptType = (l: Lead): string => {
    const pt = (l as any).pitch_type;
    if (pt === "A" || pt === "B" || pt === "C" || pt === "D") return pt;
    // fallback for leads not yet tagged by the tagger
    if ((l as any).is_low_volume) return "D";
    if (l.serp_ranked) return "A";
    if (l.has_website) return "B";
    return "C";
  };

  const filteredLeads = tabLeads.filter((l) => {
    if (filterNiche !== "All" && l.industry !== filterNiche) return false;
    if (filterCity !== "All" && l.city !== filterCity) return false;
    if (filterType !== "All" && getLeadScriptType(l) !== filterType) return false;
    if (activeTab === "followups" && filterOutcome !== "All") {
      if (filterOutcome === "report_engaged" && !isReportEngaged(l)) return false;
      if (filterOutcome === "follow_back" && l.outreach_stage !== "follow_back") return false;
      if (filterOutcome === "follow_up_due" && l.outreach_stage !== "follow_up_due") return false;
      if (filterOutcome === "no_answer" && l.outreach_stage !== "no_answer") return false;
      if (filterOutcome === "gatekeeper" && l.outreach_stage !== "gatekeeper") return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.company_name?.toLowerCase().includes(q) ||
      l.contact_person?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q)
    );
  });

  // Sort follow-ups: Report Engaged pinned first, then oldest follow_up_date
  if (activeTab === "followups") {
    filteredLeads.sort((a, b) => {
      const aEngaged = isReportEngaged(a) ? 0 : 1;
      const bEngaged = isReportEngaged(b) ? 0 : 1;
      if (aEngaged !== bEngaged) return aEngaged - bEngaged;
      const aDate = a.follow_up_date ? new Date(a.follow_up_date).getTime() : Infinity;
      const bDate = b.follow_up_date ? new Date(b.follow_up_date).getTime() : Infinity;
      return aDate - bDate;
    });
  } else {
    // Priority Queue: hottest leads first so the rep's time goes to the best prospects.
    filteredLeads.sort((a, b) => {
      const diff = scoreLead(b) - scoreLead(a);
      if (diff !== 0) return diff;
      // Tiebreak: most recently captured first.
      const aCap = a.captured_at ? new Date(a.captured_at).getTime() : 0;
      const bCap = b.captured_at ? new Date(b.captured_at).getTime() : 0;
      return bCap - aCap;
    });
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredLeads.length - 1));
  const currentLead = filteredLeads[safeIndex] || null;

  // Inbound lead that hasn't been contacted yet → gets the dedicated
  // inbound script (they enquired — this is a response call, not cold outreach)
  const isInboundFresh =
    !!currentLead && currentLead.lead_type === "inbound" && !currentLead.last_outcome;

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
    setSelectedLang(null);
    setShowOutcomeLogger(false);
    setFollowUpPreset(null);
    setFollowUpCustomTime("");
  }

  // ─── Date helpers ────────────────────────────────────────────────
  function buildFollowUpDateTime(preset: "today" | "1hour" | "tomorrow", customTime: string): string {
    const now = new Date();
    if (preset === "1hour") {
      now.setHours(now.getHours() + 1);
      return now.toISOString().slice(0, 16);
    }
    const [hh, mm] = customTime ? customTime.split(":").map(Number) : [10, 0];
    if (preset === "today") {
      now.setHours(hh, mm, 0, 0);
      return now.toISOString().slice(0, 16);
    }
    // tomorrow
    now.setDate(now.getDate() + 1);
    now.setHours(hh, mm, 0, 0);
    return now.toISOString().slice(0, 16);
  }

  function autoScheduleNoAnswer(count: number): string {
    const now = new Date();
    if (count === 1) {
      now.setHours(now.getHours() + 3);
    } else if (count === 2) {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 0, 0, 0);
    } else {
      now.setDate(now.getDate() + 2);
      now.setHours(10, 0, 0, 0);
    }
    return now.toISOString().slice(0, 16);
  }

  function autoScheduleGatekeeper(count: number): string {
    const now = new Date();
    if (count === 1) {
      // same day evening 5pm
      now.setHours(17, 0, 0, 0);
      if (now <= new Date()) now.setDate(now.getDate() + 1);
    } else {
      // next morning 9am
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    }
    return now.toISOString().slice(0, 16);
  }

  async function logOutcome() {
    if (!currentLead || !selectedOutcome || !userId) return;
    const outcome = OUTCOMES.find((o) => o.id === selectedOutcome);
    if (!outcome) return;

    startTransition(async () => {
      // Map outreach_stage correctly
      const stageMap: Record<string, string> = {
        "meeting_booked": "meeting_booked",
        "follow_up_due": "follow_up_due",
        "pdf_sent": "pdf_sent",
        "not_interested": "not_interested",
        "follow_back": "follow_back",
        "no_answer": "no_answer",
        "dead": "dead",
        "gatekeeper": "gatekeeper",
        "language_barrier": "language_barrier",
      };

      const { error: logError } = await supabase.from("outreach_logs").insert({
        lead_id: currentLead.id,
        actor_id: userId,
        touch_type: selectedOutcome === "INTERESTED_SEND_INFO" ? "pdf_sent" : "call",
        outcome: selectedOutcome,
        pdf_name: selectedOutcome === "INTERESTED_SEND_INFO" ? selectedPdfName : null,
        note: outcomeReason || null,
        created_at: new Date().toISOString(),
      });

      if (logError) {
        toast.error("Could not log call outcome", logError.message);
        return; // keep the logger open so the rep can retry
      }

      let leadUpdates: any = { last_outcome: selectedOutcome };

      // Speed-to-lead: stamp the very first contact on this lead
      if (!(currentLead as any).first_contact_at) {
        leadUpdates.first_contact_at = new Date().toISOString();
      }

      if (outcome.stage) {
        const mappedStage = stageMap[outcome.stage] || outcome.stage;
        leadUpdates.outreach_stage = mappedStage;
        if (dateTime) leadUpdates.follow_up_date = dateTime;
      } else if (dateTime) {
        leadUpdates.follow_up_date = dateTime;
      }

      // Feature 4: NO_ANSWER auto-retry
      if (selectedOutcome === "NO_ANSWER") {
        const newCount = (currentLead.no_answer_count ?? 0) + 1;
        leadUpdates.no_answer_count = newCount;
        if (newCount >= 3) {
          leadUpdates.outreach_stage = "unreachable";
        } else {
          leadUpdates.outreach_stage = "no_answer";
          leadUpdates.follow_up_date = autoScheduleNoAnswer(newCount);
        }
      }

      // Feature 3: GATEKEEPER retry
      if (selectedOutcome === "GATEKEEPER") {
        const newCount = (currentLead.gatekeeper_count ?? 0) + 1;
        leadUpdates.gatekeeper_count = newCount;
        leadUpdates.outreach_stage = newCount >= 3 ? "gatekeeper_flagged" : "gatekeeper";
        leadUpdates.follow_up_date = autoScheduleGatekeeper(newCount);
      }

      // Keep legacy status in lockstep with the canonical stage
      if (leadUpdates.outreach_stage) {
        leadUpdates.status = stageToStatus(leadUpdates.outreach_stage);
        if (leadUpdates.outreach_stage === "meeting_booked") {
          leadUpdates.meeting_booked_at = new Date().toISOString();
        }
      }
      leadUpdates.last_activity_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("leads")
        .update(leadUpdates)
        .eq("id", currentLead.id);

      if (updateError) {
        toast.error("Could not update lead stage", updateError.message);
        return; // outcome is logged, but the stage move failed — let the rep retry
      }

      // Update local state so filters/tabs reflect the new stage immediately
      setLocalLeads((prev) => prev.map((l) =>
        l.id === currentLead.id ? { ...l, ...leadUpdates } : l
      ));

      // Fire automation triggers (fire-and-forget — never block the UI path)
      void fireTrigger("lead_outcome_logged", "lead", currentLead.id, { outcome: selectedOutcome });
      if (leadUpdates.outreach_stage === "meeting_booked") {
        void fireTrigger("meeting_booked", "lead", currentLead.id);
      }

      // 3.2 / 3.4 — Outcome → WhatsApp auto-send + Google Calendar (fire-and-forget)
      if (selectedOutcome === "INTERESTED_BOOK" && (dateTime || leadUpdates.follow_up_date)) {
        void bookMeeting({
          leadId: currentLead.id,
          startIso: dateTime || leadUpdates.follow_up_date,
        });
      } else {
        void sendOutcomeWhatsApp({
          leadId: currentLead.id,
          outcome: selectedOutcome as any,
          followUpDate: dateTime || leadUpdates.follow_up_date || null,
        });
      }

      if (selectedOutcome === "INTERESTED_BOOK") {
        const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
        if (adminProfile) {
          await sendNotification({
            userId: adminProfile.id,
            type: "system",
            title: "New Meeting Booked!",
            body: `${currentLead.company_name} booked a meeting.`,
            link: `/admin/leads/${currentLead.id}`,
            entityType: "lead",
            entityId: currentLead.id
          });
        }
      }

      setStats((s) => ({
        ...s,
        callsToday: s.callsToday + 1,
        followupsLoggedToday: s.followupsLoggedToday + 1,
        meetingsBookedToday: selectedOutcome === "INTERESTED_BOOK" ? s.meetingsBookedToday + 1 : s.meetingsBookedToday,
        pdfsSentToday: selectedOutcome === "INTERESTED_SEND_INFO" ? s.pdfsSentToday + 1 : s.pdfsSentToday,
      }));

      toast.success("Outcome logged", `${currentLead.company_name} → ${outcome.label}`);

      setShowOutcomeLogger(false);
      setSelectedOutcome(null);
      setOutcomeReason("");
      setDateTime("");
      setSelectedPdfName(null);
      setFollowUpPreset(null);
      setFollowUpCustomTime("");

      // Auto-advance to next lead
      if (safeIndex < filteredLeads.length - 1) {
        goToLead(safeIndex + 1);
      }
    });
  }

  async function saveNewLead() {
    if (!newLead.company_name.trim()) { setAddLeadError("Business name is required."); return; }
    if (!newLead.phone.trim()) { setAddLeadError("Phone number is required."); return; }
    setAddLeadError(null);
    setAddLeadLoading(true);

    // Duplicate check — same phone (last 10 digits) or same business name,
    // before the lead pollutes the pipeline.
    const phoneDigits = newLead.phone.replace(/\D/g, "").slice(-10);
    const { data: dupes } = await supabase
      .from("leads")
      .select("id, company_name, phone, outreach_stage")
      .or(`phone.ilike.%${phoneDigits},company_name.ilike.${newLead.company_name.trim().replace(/[,()]/g, " ")}`)
      .limit(3);
    if (dupes && dupes.length > 0) {
      const d: any = dupes[0];
      const proceed = await promptModal({
        title: "Possible duplicate found",
        description: `"${d.company_name}" (${d.phone || "no phone"}) already exists${d.outreach_stage ? ` in stage "${d.outreach_stage.replace(/_/g, " ")}"` : ""}. Add anyway?`,
        confirmLabel: "Add Anyway",
        type: "select",
        options: [{ value: "confirm", label: "Yes, add as new lead" }],
      });
      if (!proceed) {
        setAddLeadLoading(false);
        setAddLeadError(`Duplicate of "${d.company_name}" — search for it in the list instead.`);
        return;
      }
    }

    const { data, error } = await supabase.from("leads").insert({
      company_name: newLead.company_name.trim(),
      phone: newLead.phone.trim(),
      industry: newLead.industry.trim() || null,
      city: newLead.city.trim() || null,
      contact_person: newLead.contact_person.trim() || null,
      has_website: newLead.has_website,
      notes: newLead.notes.trim() || null,
      lead_type: ["call", "gbp", "referral", "walk_in"].includes(newLead.source) ? "inbound" : "outbound",
      source: newLead.source,
      lead_source: ({ manual: "Manual Entry", call: "Phone Call", gbp: "Google Business Profile", referral: "Referral", walk_in: "Walk-in" } as Record<string, string>)[newLead.source] || "Manual Entry",
      captured_at: newLead.source === "manual" ? null : new Date().toISOString(),
      status: null,
    }).select().single();
    setAddLeadLoading(false);
    if (error) { setAddLeadError(error.message); return; }
    if (data) {
      setLocalLeads((prev) => [data as Lead, ...prev]);
    }
    setShowAddLead(false);
    setNewLead({ company_name: "", phone: "", industry: "", city: "", contact_person: "", has_website: false, notes: "", source: "manual" });
  }

  // My daily call target (team_targets) — shown as progress in the stats bar
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      // team_targets has no daily_target column — the value is target_value, and the
      // canonical row uses target_type='daily_calls' (matches /telecaller/my-stats).
      const { data } = await (supabase.from("team_targets") as any)
        .select("target_value")
        .eq("user_id", userId)
        .eq("target_type", "daily_calls")
        .maybeSingle();
      if (!cancelled && data) setCallTarget(Number(data.target_value) || null);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Today's booked meetings from the live lead list
  const todayStr = new Date().toLocaleDateString("en-CA");
  // Follow-ups DUE today or overdue (live count — not "logged today")
  const followupsDueCount = localLeads.filter(
    (l) => isFollowUp(l) && (!l.follow_up_date || String(l.follow_up_date).slice(0, 10) <= todayStr)
  ).length;
  const meetingsTodayList = localLeads
    .filter((l) => l.outreach_stage === "meeting_booked" && l.follow_up_date && String(l.follow_up_date).startsWith(todayStr))
    .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)));

  return (
    <div className="min-h-full bg-canvas">

      {/* ── STATS BAR ──────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between py-3 gap-6 overflow-x-auto">
            <p className="text-sm font-semibold text-slate-900 shrink-0">Today</p>
            <div className="flex items-center gap-6 shrink-0">
              {[
                { label: callTarget ? `Calls / ${callTarget}` : "Calls", value: stats.callsToday },
                { label: "PDFs", value: stats.pdfsSentToday },
                { label: "Meetings", value: stats.meetingsBookedToday },
                { label: "Follow-ups due", value: followupsDueCount },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-lg font-semibold tabular-nums text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Call-target progress bar */}
          {callTarget !== null && callTarget > 0 && (
            <div className="pb-2 -mt-1">
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stats.callsToday >= callTarget ? "bg-brand" : "bg-brand/60"}`}
                  style={{ width: `${Math.min((stats.callsToday / callTarget) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TODAY'S MEETINGS STRIP ─────────────────── */}
      {meetingsTodayList.length > 0 && (
        <div className="border-b border-brand-line bg-brand-soft">
          <div className="mx-auto max-w-2xl px-4 py-2.5 flex items-center gap-3 overflow-x-auto">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
              {meetingsTodayList.length} meeting{meetingsTodayList.length > 1 ? "s" : ""} today
            </span>
            <div className="flex items-center gap-2">
              {meetingsTodayList.map((m) => (
                <span key={m.id} className="shrink-0 rounded-full border border-brand-line bg-surface px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {m.company_name}
                  {m.follow_up_date && String(m.follow_up_date).includes("T") && (
                    <span className="text-brand-deep ml-1 tabular-nums">
                      {new Date(m.follow_up_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">

        {/* ── FILTER CARD ────────────────────────────── */}
        <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
          {/* Queue / Follow-up tabs */}
          <Tabs
            className="flex w-full"
            value={activeTab}
            onValueChange={(v) => { setActiveTab(v as "queue" | "followups"); setCurrentIndex(0); setFilterOutcome("All"); }}
            tabs={[
              { value: "queue", label: "Priority Queue" },
              { value: "followups", label: "Follow-ups", count: localLeads.filter(l => l.follow_up_date !== null).length || undefined },
            ]}
          />

          {/* Follow-up outcome filter chips — only shown on follow-ups tab */}
          {activeTab === "followups" && (() => {
            const fu = localLeads.filter(isFollowUp);
            const counts: Record<string, number> = {
              All: fu.length,
              report_engaged: fu.filter(isReportEngaged).length,
              follow_back: fu.filter(l => l.outreach_stage === "follow_back").length,
              follow_up_due: fu.filter(l => l.outreach_stage === "follow_up_due").length,
              no_answer: fu.filter(l => l.outreach_stage === "no_answer").length,
              gatekeeper: fu.filter(l => l.outreach_stage === "gatekeeper" || l.outreach_stage === "gatekeeper_flagged").length,
            };
            const chips = [
              { value: "All", label: "All" },
              { value: "report_engaged", label: "Engaged", highlight: true },
              { value: "follow_back", label: "Follow Back" },
              { value: "follow_up_due", label: "Interested" },
              { value: "no_answer", label: "No Answer" },
              { value: "gatekeeper", label: "Gatekeeper" },
            ];
            return (
              <div className="flex gap-1.5 flex-wrap">
                {chips.map((chip) => (
                  counts[chip.value] > 0 || chip.value === "All" ? (
                    <button
                      key={chip.value}
                      onClick={() => { setFilterOutcome(chip.value); setCurrentIndex(0); }}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                        filterOutcome === chip.value
                          ? chip.highlight
                            ? "bg-warn text-white border-warn"
                            : "bg-brand-deep text-white border-brand-deep"
                          : chip.highlight
                            ? "bg-warn-soft text-warn border-warn-line hover:bg-warn/10"
                            : "bg-surface text-slate-600 border-line hover:border-brand-line hover:text-brand-deep"
                      )}
                    >
                      {chip.label}
                      {counts[chip.value] > 0 && (
                        <span className={cn(
                          "text-[11px] font-semibold tabular-nums px-1 py-0.5 rounded-full",
                          filterOutcome === chip.value ? "bg-white/20" : "bg-slate-100 text-slate-500"
                        )}>
                          {counts[chip.value]}
                        </span>
                      )}
                    </button>
                  ) : null
                ))}
              </div>
            );
          })()}

          {/* Niche + City selectors */}
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filterNiche}
              onChange={(e) => { setFilterNiche(e.target.value); setCurrentIndex(0); }}
            >
              {niches.map(n => <option key={n} value={n}>{n === "All" ? "All Niches" : n}</option>)}
            </Select>
            <Select
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); setCurrentIndex(0); }}
            >
              {cities.map(c => <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>)}
            </Select>
          </div>

          {/* Business Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Type:</span>
            <div className="flex gap-1.5 flex-1">
              {[
                { value: "All", label: "All" },
                { value: "A", label: "A", desc: "Ranking" },
                { value: "B", label: "B", desc: "Website" },
                { value: "C", label: "C", desc: "No Site" },
                { value: "D", label: "D", desc: "Low Vol" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setFilterType(t.value); setCurrentIndex(0); }}
                  className={cn(
                    "flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors",
                    filterType === t.value
                      ? "bg-brand-deep text-white border-brand-deep"
                      : "bg-surface text-slate-600 border-line hover:border-brand-line hover:text-brand-deep"
                  )}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search + lead count + add */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className={cn(inputClasses, "pl-9")}
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
              />
            </div>
            <span className="text-sm tabular-nums text-slate-500 shrink-0 bg-slate-100 px-3 py-1.5 rounded-lg">
              {filteredLeads.length > 0 ? `${safeIndex + 1} / ${filteredLeads.length}` : "0"}
            </span>
            <Button
              onClick={() => { setShowAddLead(true); setAddLeadError(null); }}
              variant="primary"
              size="icon"
              title="Add lead manually"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── EMPTY STATE ────────────────────────────── */}
        {filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-line-strong bg-surface text-slate-400">
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
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-line bg-surface text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Lead
              </button>
              <button
                onClick={() => goToLead(Math.min(filteredLeads.length - 1, safeIndex + 1))}
                disabled={safeIndex >= filteredLeads.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-line bg-surface text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next Lead <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-surface border border-line rounded-xl overflow-hidden">
              {/* Lead name + status */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold text-slate-900 leading-tight">{currentLead.company_name}</h2>
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
                      {(currentLead.no_answer_count ?? 0) > 0 && (currentLead.outreach_stage === "no_answer" || currentLead.outreach_stage === "unreachable") && (
                        <Badge tone={currentLead.outreach_stage === "unreachable" ? "danger" : "warning"} size="sm">
                          {currentLead.outreach_stage === "unreachable"
                            ? "UNREACHABLE"
                            : `No answer ${currentLead.no_answer_count}/3`}
                        </Badge>
                      )}
                      {(currentLead.gatekeeper_count ?? 0) > 0 && (
                        <Badge tone={currentLead.outreach_stage === "gatekeeper_flagged" ? "danger" : "warning"} size="sm">
                          {currentLead.outreach_stage === "gatekeeper_flagged"
                            ? "Gatekeeper 3/3"
                            : `Gatekeeper ${currentLead.gatekeeper_count}/3`}
                        </Badge>
                      )}
                      {isReportEngaged(currentLead) && (
                        <Badge tone="warning" size="sm">
                          {currentLead.tags?.includes("tapped_book_meeting") ? "Wants Meeting" : "Wants Info"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {(() => {
                      const sc = scoreLead(currentLead);
                      const v = scoreVisual(sc);
                      return (
                        <Badge tone={v.tone} variant="outline" size="sm" dot title={`Lead score ${sc}/10`}>
                          {v.label} <span className="tabular-nums">{sc}</span>
                        </Badge>
                      );
                    })()}
                    {effectiveScriptType && (
                      <Badge tone="neutral" size="sm">Script {effectiveScriptType}</Badge>
                    )}
                  </div>
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
                    <span className="flex items-center gap-1 text-[11px] font-medium bg-info-soft text-info px-2 py-0.5 rounded-full">
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
                      className="flex-1 flex items-center justify-center gap-3 bg-brand-deep hover:bg-brand-deeper text-white font-semibold py-4 rounded-lg text-lg tracking-wide tabular-nums transition-colors active:scale-[0.98]"
                    >
                      <Phone className="h-5 w-5" />
                      {currentLead.phone}
                    </a>
                    <a
                      href={`https://wa.me/${currentLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border border-brand-line bg-brand-soft text-brand-deep hover:bg-brand/10 px-4 rounded-lg font-semibold text-sm transition-colors active:scale-[0.98]"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Previous notes */}
              {currentLead.notes && (
                <div className="px-5 pb-4">
                  <div className="bg-warn-soft border border-warn-line rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-warn uppercase tracking-wide mb-1">Previous Notes</p>
                    <p className="text-sm text-slate-800">{currentLead.notes}</p>
                  </div>
                </div>
              )}

              {/* Last outcome */}
              {currentLead.last_outcome && (
                <div className="px-5 pb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Last Outcome: </span>
                  <span className="text-xs font-semibold text-slate-600">{currentLead.last_outcome.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>

            {/* ── FOLLOW-UP + INBOUND SCRIPTS ─────────────────── */}
            {(activeTab === "followups" || isInboundFresh) && (() => {
              const name = currentLead.contact_person || "there";
              const biz = currentLead.company_name || "your business";
              const niche = currentLead.industry || "your industry";
              const city = currentLead.city || "your city";
              const stage = currentLead.outreach_stage;
              const channel = currentLead.lead_source || "WhatsApp / our website";
              const capturedAgo = (() => {
                if (!currentLead.captured_at) return null;
                const mins = Math.round((Date.now() - new Date(currentLead.captured_at).getTime()) / 60000);
                if (mins < 60) return `${mins} min ago`;
                if (mins < 24 * 60) return `${Math.round(mins / 60)} hr ago`;
                return `${Math.round(mins / (24 * 60))} days ago`;
              })();

              type FUStep = { title: string; lines: string[]; objections?: { trigger: string; response: string }[] };

              // One neutral surface for every follow-up script — no per-script rainbow.
              const scripts: Record<string, { label: string; color: string; headerBg: string; borderColor: string; steps: FUStep[] }> = {
                inbound: {
                  label: `Inbound Enquiry — They Came To You${capturedAgo ? ` (via ${channel}, ${capturedAgo})` : ` (via ${channel})`}`,
                  color: "text-slate-900",
                  headerBg: "bg-slate-50",
                  borderColor: "border-line",
                  steps: [
                    {
                      title: "Respond Fast — Warm Open",
                      lines: [
                        `"Hi ${name}! This is Afifa from FortuneMarq. You reached out to us through ${channel} about growing ${biz} online — so I'm calling you right back. Is this a good time?"`,
                        `"Thanks for getting in touch! I just want to understand what you're looking for so we can actually help — this will take 2 minutes."`,
                      ],
                      objections: [
                        { trigger: "I didn't enquire / don't remember", response: `"No problem! We received an enquiry from this number for ${biz}${niche !== "your industry" ? ` regarding ${niche} marketing` : ""}. Maybe someone from your team sent it. Either way — happy to share in 30 seconds what we do for ${niche} businesses in ${city}."` },
                        { trigger: "I'm busy right now", response: `"Totally understand. When should I call back today — evening or tomorrow morning? I don't want you to miss what you enquired about."` },
                      ],
                    },
                    {
                      title: "Understand Their Need",
                      lines: [
                        `"Tell me a bit about ${biz} — what made you reach out today?"`,
                        `"What's the bigger challenge right now: getting NEW customers to find you, or converting the enquiries you already get?"`,
                        `(LISTEN. Note their exact words — they go in the lead notes and Jabeer uses them in the meeting.)`,
                      ],
                      objections: [
                        { trigger: "Just tell me the price", response: `"Fair question! It genuinely depends on what ${biz} needs — could be ₹3,500, could be more. That's exactly why the free 15-minute call exists: you'll know the exact plan and price before spending anything."` },
                      ],
                    },
                    {
                      title: "Book the Meeting",
                      lines: [
                        `"Here's the best next step: our founder Jabeer does a free 15-minute Zoom call where he shows you exactly what the opportunity looks like for ${biz} in ${city} — real search numbers, what competitors are doing, and what it would take. No commitment."`,
                        `"Does tomorrow morning or evening work better for you?"`,
                      ],
                      objections: [
                        { trigger: "Just send details on WhatsApp", response: `"Absolutely, I'll send our portfolio right after this call. But the call is where Jabeer shows the specific opportunity for ${biz} — 15 minutes, and you'll know exactly where you stand. Shall I block a slot?"` },
                        { trigger: "I need to think about it", response: `"Of course! The call doesn't commit you to anything though — it's literally free analysis of ${biz}'s online presence. Most owners say it was worth it even when they didn't sign up. What's a low-pressure time for you?"` },
                      ],
                    },
                  ],
                },
                follow_up_due: {
                  label: "Interested — Follow-Up Call",
                  color: "text-slate-900",
                  headerBg: "bg-slate-50",
                  borderColor: "border-line",
                  steps: [
                    {
                      title: "Reconnect",
                      lines: [
                        `"Hi ${name}, this is Afifa calling from FortuneMarq. We had spoken earlier and you'd asked me to follow up today — is this still a good time?"`,
                        `"Just to quickly remind you — we were discussing how ${biz} could get more customers online through Google."`,
                      ],
                      objections: [
                        { trigger: "I don't remember speaking to you", response: `"No problem! We had a brief chat about how ${niche} businesses in ${city} are missing out on Google leads. I just wanted to share what we found specifically about ${biz}."` },
                        { trigger: "I'm busy right now", response: `"Totally understand — when's a better time? I just need 5 minutes, I have something specific to share about ${biz}."` },
                      ],
                    },
                    {
                      title: "Re-Pitch",
                      lines: [
                        `"Since we last spoke, we've helped a few ${niche} businesses in ${city} increase their Google enquiries by 30–40%. The opportunity is very real for ${biz} as well."`,
                        `"When someone in ${city} searches for ${niche} near me, we want ${biz} to be one of the first names they see."`,
                      ],
                      objections: [
                        { trigger: "We already get enough customers", response: `"That's great! But imagine if 20-30% more people found you before they found your competitors. Our clients say the ROI pays for itself within the first month."` },
                        { trigger: "We tried digital marketing before", response: `"I understand the frustration. What we do is very different — it's not ads. It's getting you ranked organically on Google so customers come to you without spending on clicks every month."` },
                      ],
                    },
                    {
                      title: "Book the Meeting",
                      lines: [
                        `"I'd love to do a quick 20-minute demo specifically for ${biz} — I'll show you exactly what's happening on Google right now and what we can do."`,
                        `"Are you free this week — maybe Tuesday or Wednesday afternoon?"`,
                      ],
                      objections: [
                        { trigger: "Send me something on WhatsApp first", response: `"Absolutely, I'll send you our overview PDF right now. But I'd love to walk you through it personally — the demo is where it really clicks. Can we schedule a quick call after you've seen the PDF?"` },
                        { trigger: "I need to discuss with my partner", response: `"Of course! Could we set up a call with both of you? Even 15 minutes — I can answer all your questions together."` },
                      ],
                    },
                  ],
                },
                no_answer: {
                  label: "No Answer — Callback Script",
                  color: "text-slate-900",
                  headerBg: "bg-slate-50",
                  borderColor: "border-line",
                  steps: [
                    {
                      title: "Opening — First Words",
                      lines: [
                        `"Hi, am I speaking with ${name}? This is Afifa calling from FortuneMarq."`,
                        `"I've been trying to reach you a couple of times regarding ${biz}'s online presence. Do you have just 2 minutes?"`,
                      ],
                      objections: [
                        { trigger: "Who are you / what is this about?", response: `"We're a digital marketing agency based in India. We looked at ${biz}'s Google presence and found a specific opportunity for you in ${city}. It'll just take 2 minutes to explain."` },
                        { trigger: "I'm not interested", response: `"I completely understand. Before you go — can I just share one thing we noticed about ${biz} on Google? It's something that could be costing you customers right now. 30 seconds?"` },
                      ],
                    },
                    {
                      title: "Hook",
                      lines: [
                        `"We help ${niche} businesses in ${city} show up on the first page of Google when customers are actively searching for them."`,
                        `"We actually checked ${biz}'s current online visibility — and there's a clear gap we can help you fill. Your competitors are taking those customers right now."`,
                      ],
                      objections: [
                        { trigger: "We don't need this", response: `"Fair enough! Just one quick question — when someone in ${city} searches '${niche} near me' on Google, does ${biz} show up? If not, those are real customers going to someone else every day."` },
                      ],
                    },
                    {
                      title: "Close",
                      lines: [
                        `"Can we set up a free 15-minute call where I can show you exactly what we found and what the opportunity looks like for ${biz}?"`,
                        `"Even if you decide it's not for you, you'll walk away knowing exactly where ${biz} stands online. No pressure."`,
                      ],
                      objections: [
                        { trigger: "Call me later", response: `"Of course — when's the best time? Morning or afternoon? I'll call you exactly then."` },
                        { trigger: "Send on WhatsApp", response: `"I'll send it right now! And once you've seen it, can I follow up with a quick call to walk you through it?"` },
                      ],
                    },
                  ],
                },
                follow_back: {
                  label: "Follow Back — They Requested Callback",
                  color: "text-slate-900",
                  headerBg: "bg-slate-50",
                  borderColor: "border-line",
                  steps: [
                    {
                      title: "Acknowledge the Callback",
                      lines: [
                        `"Hi ${name}, this is Afifa from FortuneMarq — you'd asked me to give you a call around this time. Is now still convenient?"`,
                        `"Great! So last time we were talking about how ${biz} could grow its online presence in ${city}. Have you had a chance to think about it?"`,
                      ],
                      objections: [
                        { trigger: "I forgot / what was this about?", response: `"No worries! We had briefly discussed how ${niche} businesses in ${city} are getting more customers through Google. You asked me to call back when you had more time."` },
                        { trigger: "Still not a good time", response: `"Absolutely — when would be the best time? I want to make sure I call you when you can really focus on this, since it's something valuable for ${biz}."` },
                      ],
                    },
                    {
                      title: "Re-engage & Qualify",
                      lines: [
                        `"Since you asked me to call back, I want to make sure I use your time well. Are you currently happy with the number of new customers ${biz} is getting each month?"`,
                        `"And do you feel ${biz} is visible enough on Google when people in ${city} search for ${niche}?"`,
                      ],
                      objections: [
                        { trigger: "We're doing fine", response: `"That's wonderful! Our best clients actually say the same thing — and then they see us double their enquiries. Is there a number that would excite you? What would 20 more customers a month mean for ${biz}?"` },
                      ],
                    },
                    {
                      title: "Lock in the Meeting",
                      lines: [
                        `"Since you've taken the time to speak with me, I'd love to do a proper 20-minute presentation for you — I'll show you the Google data for ${biz} specifically and what our plan would look like."`,
                        `"What works better for you — a call tomorrow, or later this week?"`,
                      ],
                      objections: [
                        { trigger: "Just tell me the price", response: `"Great question — our pricing is tailored to each business based on the scope of work. The 20-minute call is where I can give you an accurate quote. It's free and there's no obligation."` },
                        { trigger: "Need more time to decide", response: `"Totally fine! Let's at least do the demo so you have all the information to make the decision. You're not committing to anything — just getting clarity on what's possible for ${biz}."` },
                      ],
                    },
                  ],
                },
              };

              const scriptKey = isInboundFresh
                ? "inbound"
                : (stage === "follow_up_due" || stage === "no_answer" || stage === "follow_back") ? stage : "follow_up_due";
              const s = scripts[scriptKey];
              const totalSteps = s.steps.length;
              const step = s.steps[currentStep] || s.steps[0];

              return (
                <div className={`bg-surface border ${s.borderColor} rounded-xl overflow-hidden`}>
                  <div className={`px-5 py-3 border-b ${s.borderColor} flex items-center gap-2 ${s.headerBg}`}>
                    <Clock className="h-4 w-4 text-brand-deep" />
                    <p className={`text-sm font-semibold ${s.color}`}>{s.label}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {s.steps.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setCurrentStep(i); setExpandedObjections(new Set()); }}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < currentStep ? "bg-brand" : i === currentStep ? "bg-brand-deep" : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs tabular-nums text-slate-500 shrink-0">{currentStep + 1} / {totalSteps}</span>
                    </div>

                    {/* Step title */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep text-white text-sm font-semibold tabular-nums shrink-0">
                        {currentStep + 1}
                      </span>
                      <h3 className="font-display text-base font-semibold text-slate-900">{step.title}</h3>
                    </div>

                    {/* Script lines */}
                    <div className="space-y-2">
                      {step.lines.map((line, j) => (
                        <div key={j} className="text-sm leading-relaxed p-3.5 rounded-lg bg-slate-50 border-l-2 border-brand text-slate-800">
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Objections */}
                    {step.objections && step.objections.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">If they object...</p>
                        {step.objections.map((obj, k) => (
                          <div key={k} className="rounded-lg border border-line overflow-hidden">
                            <button
                              onClick={() => {
                                setExpandedObjections((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(k + currentStep * 10)) next.delete(k + currentStep * 10); else next.add(k + currentStep * 10);
                                  return next;
                                });
                              }}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                            >
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <MessageCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />&quot;{obj.trigger}&quot;
                              </span>
                              {expandedObjections.has(k + currentStep * 10)
                                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                                : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                              }
                            </button>
                            {expandedObjections.has(k + currentStep * 10) && (
                              <div className="px-3 py-3 bg-slate-50 border-t border-line">
                                <p className="text-[11px] font-semibold text-brand-deep uppercase tracking-wide mb-1.5">Say this:</p>
                                <p className="text-sm text-slate-800 leading-relaxed">{obj.response}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Prev / Next */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => { setCurrentStep((s) => Math.max(0, s - 1)); setExpandedObjections(new Set()); }}
                        disabled={currentStep === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-line text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>
                      {currentStep < totalSteps - 1 ? (
                        <button
                          onClick={() => { setCurrentStep((s) => s + 1); setExpandedObjections(new Set()); }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
                        >
                          Next Step <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowOutcomeLogger(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-deep hover:bg-brand-deeper text-white text-sm font-semibold transition-colors"
                        >
                          Log Outcome <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── SCRIPT (queue tab) ─────────────────── */}
            {activeTab === "queue" && !isInboundFresh && (
              !effectiveScriptType ? (
                <div className="bg-surface border border-warn-line rounded-xl p-5">
                  <p className="text-sm font-semibold text-warn mb-4">
                    No script type detected. Select manually:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {SCRIPT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setScriptTypeOverride(t.value)}
                        className="text-left border border-line rounded-lg p-4 hover:border-brand-line hover:bg-brand-soft transition-colors"
                      >
                        <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-surface border border-line rounded-xl overflow-hidden">
                  {/* Script header */}
                  <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Call Script</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {script?.typeLabel || `Script Type ${effectiveScriptType}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => { setCurrentStep(0); setExpandedObjections(new Set()); }}
                        className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-line rounded-lg px-3 py-2 bg-surface transition-colors shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset
                      </button>
                      <Select
                        value={scriptTypeOverride || effectiveScriptType}
                        onChange={(e) => { setScriptTypeOverride(e.target.value as ScriptType); setCurrentStep(0); setExpandedObjections(new Set()); }}
                        className="h-auto py-2 text-xs flex-1 min-w-0"
                      >
                        {SCRIPT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                        ))}
                      </Select>
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
                                  i < currentStep ? "bg-brand" : i === currentStep ? "bg-brand-deep" : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs tabular-nums text-slate-500 shrink-0">
                            {currentStep + 1} / {totalSteps}
                          </span>
                        </div>

                        {/* Step header */}
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep text-white text-sm font-semibold tabular-nums shrink-0">
                            {step.stepId}
                          </span>
                          <h3 className="font-display text-base font-semibold text-slate-900">{step.stepName}</h3>
                          {selectedLang && step.stepName !== "Language Preference" && (
                            <Badge tone="neutral" size="sm" className="ml-auto uppercase tracking-wide">
                              {LANG_LABEL[selectedLang]}
                            </Badge>
                          )}
                        </div>

                        {/* Script lines */}
                        <div className="space-y-2">
                          {step.lines.map((line, j) => (
                            <div key={j}>
                              <div
                                className={`text-sm leading-relaxed p-3.5 rounded-lg ${
                                  line.type === "branch"
                                    ? "bg-warn-soft border border-warn-line text-slate-800"
                                    : "bg-slate-50 border-l-2 border-brand text-slate-800"
                                }`}
                              >
                                {line.type === "branch" && line.condition && (
                                  <p className="text-[11px] font-semibold text-warn uppercase tracking-wide mb-1">
                                    {line.condition}
                                  </p>
                                )}
                                {line.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Language selector — only shown on Language Preference step */}
                        {step.stepName === "Language Preference" && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Select language — script will switch
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {(["kannada", "hindi", "english"] as const).map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => {
                                    setSelectedLang(lang);
                                    setCurrentStep((s) => s + 1);
                                    setExpandedObjections(new Set());
                                  }}
                                  className={cn(
                                    "py-3 rounded-lg text-sm font-semibold border transition-colors",
                                    selectedLang === lang
                                      ? "border-brand-line bg-brand-soft text-brand-deep"
                                      : "border-line bg-surface text-slate-700 hover:border-brand-line hover:bg-brand-soft"
                                  )}
                                >
                                  {LANG_LABEL[lang]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Objections */}
                        {step.objections.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              If they object...
                            </p>
                            {step.objections.map((obj, k) => (
                              <div key={k} className="rounded-lg border border-line overflow-hidden">
                                <button
                                  onClick={() => {
                                    setExpandedObjections((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(k)) next.delete(k); else next.add(k);
                                      return next;
                                    });
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                                >
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <MessageCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />&quot;{obj.trigger}&quot;
                                  </span>
                                  {expandedObjections.has(k)
                                    ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                                  }
                                </button>
                                {expandedObjections.has(k) && (
                                  <div className="px-3 py-3 bg-slate-50 border-t border-line">
                                    <p className="text-[11px] font-semibold text-brand-deep uppercase tracking-wide mb-1.5">Say this:</p>
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
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-line text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" /> Previous
                          </button>
                          {currentStep < totalSteps - 1 ? (
                            <button
                              onClick={() => { setCurrentStep((s) => s + 1); setExpandedObjections(new Set()); }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowOutcomeLogger(true)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-deep hover:bg-brand-deeper text-white text-sm font-semibold transition-colors"
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
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-semibold text-sm transition-colors"
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
          <div className="w-full max-w-lg bg-surface rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-slate-50">
              <div>
                <p className="font-display font-semibold text-slate-900 text-base">Log Outcome</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{currentLead.company_name}</p>
              </div>
              <button
                onClick={() => { setShowOutcomeLogger(false); setSelectedOutcome(null); setOutcomeReason(""); setDateTime(""); setFollowUpPreset(null); setFollowUpCustomTime(""); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Outcome buttons — five tones only, no per-outcome rainbow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OUTCOMES.map((outcome) => {
                  const Icon = outcome.icon;
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => setSelectedOutcome(outcome.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors",
                        OUTCOME_TONE_CLASSES[outcome.tone],
                        selectedOutcome === outcome.id ? "ring-2 ring-brand-ring ring-offset-1" : ""
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {outcome.label}
                    </button>
                  );
                })}
              </div>

              {selectedOutcome === "INTERESTED_BOOK" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Meeting Date & Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["today", "1hour", "tomorrow"] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setFollowUpPreset(preset);
                          if (preset === "1hour") {
                            setDateTime(buildFollowUpDateTime("1hour", ""));
                          } else {
                            setFollowUpCustomTime("10:00");
                            setDateTime(buildFollowUpDateTime(preset, "10:00"));
                          }
                        }}
                        className={cn(
                          "py-2.5 rounded-lg text-sm font-semibold border transition-colors",
                          followUpPreset === preset
                            ? "border-brand-line bg-brand-soft text-brand-deep"
                            : "border-line bg-surface text-slate-600 hover:border-brand-line"
                        )}
                      >
                        {preset === "today" ? "Today" : preset === "1hour" ? "In 1 hr" : "Tomorrow"}
                      </button>
                    ))}
                  </div>
                  {followUpPreset && followUpPreset !== "1hour" && (
                    <div>
                      <label className="text-xs text-slate-500">Pick a time:</label>
                      <input
                        type="time"
                        value={followUpCustomTime}
                        onChange={(e) => {
                          setFollowUpCustomTime(e.target.value);
                          setDateTime(buildFollowUpDateTime(followUpPreset!, e.target.value));
                        }}
                        className={cn(inputClasses, "mt-1")}
                      />
                    </div>
                  )}
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => { setDateTime(e.target.value); setFollowUpPreset(null); }}
                    className={inputClasses}
                  />
                  {dateTime && (
                    <p className="text-xs text-brand-deep font-semibold">
                      Meeting: {new Date(dateTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              )}

              {(selectedOutcome === "INTERESTED_FOLLOW_UP" || selectedOutcome === "FOLLOW_BACK") && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">When to follow up?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["today", "1hour", "tomorrow"] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setFollowUpPreset(preset);
                          if (preset === "1hour") {
                            setDateTime(buildFollowUpDateTime("1hour", ""));
                          } else {
                            setFollowUpCustomTime("10:00");
                            setDateTime(buildFollowUpDateTime(preset, "10:00"));
                          }
                        }}
                        className={cn(
                          "py-2.5 rounded-lg text-sm font-semibold border transition-colors",
                          followUpPreset === preset
                            ? "border-brand-line bg-brand-soft text-brand-deep"
                            : "border-line bg-surface text-slate-600 hover:border-brand-line"
                        )}
                      >
                        {preset === "today" ? "Today" : preset === "1hour" ? "In 1 hr" : "Tomorrow"}
                      </button>
                    ))}
                  </div>
                  {followUpPreset && followUpPreset !== "1hour" && (
                    <div>
                      <label className="text-xs text-slate-500">Pick a time:</label>
                      <input
                        type="time"
                        value={followUpCustomTime}
                        onChange={(e) => {
                          setFollowUpCustomTime(e.target.value);
                          setDateTime(buildFollowUpDateTime(followUpPreset, e.target.value));
                        }}
                        className={cn(inputClasses, "mt-1")}
                      />
                    </div>
                  )}
                  {dateTime && (
                    <p className="text-xs text-brand-deep font-semibold">
                      Scheduled: {new Date(dateTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              )}

              {selectedOutcome === "INTERESTED_SEND_INFO" && currentLead && (
                <div className="space-y-3">
                  <div className="p-3 bg-info-soft rounded-lg border border-info-line">
                    <p className="text-sm font-medium text-info mb-2">Select PDF to send:</p>
                    <div className="flex flex-col gap-1">
                      {getPdfOptions(currentLead.industry, currentLead.city).map(pdf => (
                        <button
                          key={pdf}
                          onClick={() => setSelectedPdfName(pdf)}
                          className={cn(
                            "text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                            selectedPdfName === pdf
                              ? "bg-info text-white border-info"
                              : "bg-surface border-line hover:border-info-line"
                          )}
                        >
                          {pdf}
                        </button>
                      ))}
                    </div>
                    {selectedPdfName && (
                      <p className="text-xs text-info mt-2">Will log: {selectedPdfName}</p>
                    )}
                  </div>

                  <div className="p-3 bg-brand-soft rounded-lg border border-brand-line flex flex-col items-start gap-2">
                    <p className="text-sm font-medium text-brand-deep">Send via WhatsApp?</p>
                    <Button onClick={() => setShowWhatsApp(true)} size="sm">
                      <MessageCircle className="h-4 w-4" /> Open WhatsApp Templates
                    </Button>
                    {showWhatsApp && (
                      <WhatsAppTemplatePicker
                        lead={currentLead}
                        actorId={userId!}
                        onSent={() => setShowWhatsApp(false)}
                        onClose={() => setShowWhatsApp(false)}
                      />
                    )}
                  </div>
                </div>
              )}

              {selectedOutcome === "NOT_INTERESTED" && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
                  <Select
                    value={outcomeReason}
                    onChange={(e) => setOutcomeReason(e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select reason...</option>
                    {["Already has an agency", "No budget right now", "Not the decision maker", "Bad timing / not now", "Service not relevant", "Rude / hung up", "Other"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
              )}

              {selectedOutcome && (
                <Button
                  onClick={logOutcome}
                  disabled={
                    isPending ||
                    (selectedOutcome === "NOT_INTERESTED" && !outcomeReason) ||
                    (selectedOutcome === "INTERESTED_SEND_INFO" && !selectedPdfName) ||
                    (selectedOutcome === "INTERESTED_BOOK" && !dateTime) ||
                    ((selectedOutcome === "INTERESTED_FOLLOW_UP" || selectedOutcome === "FOLLOW_BACK") && !dateTime)
                  }
                  size="lg"
                  className="w-full"
                >
                  {isPending ? "Saving..." : "Save & Next Lead"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD LEAD MODAL ─────────────────────────────────────────── */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-slate-50">
              <p className="font-display font-semibold text-slate-900 text-base">Add Lead Manually</p>
              <button onClick={() => setShowAddLead(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Name *</label>
                <input
                  value={newLead.company_name}
                  onChange={(e) => setNewLead((p) => ({ ...p, company_name: e.target.value }))}
                  className={cn(inputClasses, "mt-1")}
                  placeholder="e.g. Planet Health Dental"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone *</label>
                <input
                  value={newLead.phone}
                  onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))}
                  className={cn(inputClasses, "mt-1")}
                  placeholder="e.g. 9876543210"
                  type="tel"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niche</label>
                  <input
                    value={newLead.industry}
                    onChange={(e) => setNewLead((p) => ({ ...p, industry: e.target.value }))}
                    className={cn(inputClasses, "mt-1")}
                    placeholder="e.g. Dental Clinics"
                    list="niche-options"
                  />
                  <datalist id="niche-options">
                    {allNiches?.map((n) => <option key={n} value={n} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">City</label>
                  <input
                    value={newLead.city}
                    onChange={(e) => setNewLead((p) => ({ ...p, city: e.target.value }))}
                    className={cn(inputClasses, "mt-1")}
                    placeholder="e.g. Hubli"
                    list="city-options"
                  />
                  <datalist id="city-options">
                    {allCities?.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Person</label>
                <input
                  value={newLead.contact_person}
                  onChange={(e) => setNewLead((p) => ({ ...p, contact_person: e.target.value }))}
                  className={cn(inputClasses, "mt-1")}
                  placeholder="e.g. Dr. Sharma"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Where did this lead come from?</label>
                <Select
                  value={newLead.source}
                  onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))}
                  className="mt-1"
                >
                  <option value="manual">Cold list / manual entry</option>
                  <option value="call">They called us</option>
                  <option value="gbp">Google Business Profile</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-in</option>
                </Select>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="has_website"
                  checked={newLead.has_website}
                  onChange={(e) => setNewLead((p) => ({ ...p, has_website: e.target.checked }))}
                  className="h-4 w-4 rounded border-line accent-brand-deep"
                />
                <label htmlFor="has_website" className="text-sm font-medium text-slate-700">Has a website</label>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead((p) => ({ ...p, notes: e.target.value }))}
                  className={cn(inputClasses, "mt-1 resize-none")}
                  placeholder="Any notes..."
                  rows={2}
                />
              </div>
              {addLeadError && <p className="text-xs text-danger font-medium">{addLeadError}</p>}
              <Button
                onClick={saveNewLead}
                disabled={addLeadLoading}
                size="lg"
                className="w-full"
              >
                {addLeadLoading ? "Saving..." : "Add Lead"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
