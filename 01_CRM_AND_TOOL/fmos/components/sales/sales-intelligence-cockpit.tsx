"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Building2,
  User,
  Flame,
  PhoneOff,
  PhoneMissed,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Target,
  Users,
  Globe,
  Lightbulb,
  Copy,
  Sparkles,
  Search,
  Clock,
  Ban,
  AlertCircle,
  CalendarCheck,
  ListTodo,
  Info,
  ExternalLink,
  Timer,
  Trophy,
  PartyPopper,
  Play,
  Pause,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StrategyBookingModal from "./strategy-booking-modal";
import WhatsAppTemplateButton from "./whatsapp-template-button";
import ScheduleFollowUpModal from "./schedule-follow-up-modal";
import FollowUpList from "./follow-up-list";
import { createClient } from "@/lib/supabase";
import {
  generateSmartPitch,
  type Lead as PitchLead,
  type MarketData,
  type PitchResult,
} from "@/lib/pitch-engine";
import { useLeadType } from "./sales-lead-type-switcher";
import clsx from "clsx";
import ActivityTimeline from "@/components/ActivityTimeline";
import SalesOutcomeModal, { OutcomeData } from "./SalesOutcomeModal";
import ScriptObjectionPanel from "./ScriptObjectionPanel";
import { logAudit } from "@/lib/audit";
import { calculateLeadScore, getScoreVisuals } from "@/lib/lead-scoring";
import { updateTelecallerStats } from "@/lib/performance";

export interface Lead {
  id: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  city: string | null;
  status: string | null;
  notes: string | null;
  next_action_date: string | null;
  created_at: string;
  lead_type?: string | null;
  source?: string | null;
  last_contacted_at?: string | null;
  stale_flag?: boolean;
  has_website?: boolean | null;
  website_link?: string | null;
  attempts?: number | null;
  tags?: string[] | null;
  serp_ranked?: boolean | null;
  serp_source?: string | null;
  gmb_link?: string | null;
  last_outcome?: string | null;
}

export interface MarketInsight {
  id: string;
  industry: string;
  city: string;
  search_volume: string | null;
  market_difficulty: string | null;
  top_competitors: string[] | null;
  pitch_angle: string | null;
}

interface SalesIntelligenceCockpitProps {
  initialLeads: Lead[];
  initialMarketInsights: MarketInsight[];
  userId: string | null;
}

export default function SalesIntelligenceCockpit({
  initialLeads,
  initialMarketInsights,
  userId,
}: SalesIntelligenceCockpitProps) {
  const { activeLeadType } = useLeadType();
  const [queue, setQueue] = useState<Lead[]>(initialLeads);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState({ calls: 0, qualified: 0, contacted: 0 });
  const [copiedScript, setCopiedScript] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // States
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<string | null>(null);
  const [queueTab, setQueueTab] = useState<"calls" | "followups">("calls");
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [outcomeCategory, setOutcomeCategory] = useState<"connected" | "not_connected" | null>(null);

  const [turboMode, setTurboMode] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  const [selectedRebuttal, setSelectedRebuttal] = useState<string | null>(null);
  
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [currentCallSeconds, setCurrentCallSeconds] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const DAILY_GOAL = 100;

  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
      setCurrentCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused]);



  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Filters
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [websiteFilter, setWebsiteFilter] = useState<"all" | "has_website" | "no_website">("all");
  const [showIndustryMenu, setShowIndustryMenu] = useState(false);
  const [showWebsiteMenu, setShowWebsiteMenu] = useState(false);

  const uniqueIndustries = useMemo(() => {
    const industries = new Set<string>();
    initialLeads.forEach((lead) => {
      if (lead.industry) industries.add(lead.industry);
    });
    return Array.from(industries).sort();
  }, [initialLeads]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    initialLeads.forEach((lead) => {
      if (lead.city) cities.add(lead.city);
    });
    return Array.from(cities).sort();
  }, [initialLeads]);

  const getFilteredQueue = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const endOfToday = new Date(todayStr);
    endOfToday.setHours(23, 59, 59, 999);

    let baseList = initialLeads.filter(l => (l.lead_type || "outbound") === activeLeadType);

    if (queueTab === "followups") {
      baseList = baseList.filter(l => {
        if (!l.next_action_date) return false;
        const due = new Date(l.next_action_date);
        return due <= endOfToday;
      });
      baseList.sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime());
    } else {
      baseList = baseList.filter(l => !["qualified", "closed_won", "closed_lost", "disqualified", "strategy_booked"].includes(l.status || ""));
      baseList.sort((a, b) => {
        const aDue = a.next_action_date ? new Date(a.next_action_date) <= new Date() : false;
        const bDue = b.next_action_date ? new Date(b.next_action_date) <= new Date() : false;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;

        const aIsNewInbound = a.lead_type === 'inbound' && (a.status === 'new' || !a.status);
        const bIsNewInbound = b.lead_type === 'inbound' && (b.status === 'new' || !b.status);
        if (aIsNewInbound && !bIsNewInbound) return -1;
        if (!aIsNewInbound && bIsNewInbound) return 1;

        const aAttempts = a.attempts || 0;
        const bAttempts = b.attempts || 0;
        if (aAttempts !== bAttempts) return bAttempts - aAttempts;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return baseList.filter(lead => {
      const filtersMatch = (industryFilter === "all" || lead.industry === industryFilter) &&
        (cityFilter === "all" || lead.city === cityFilter);

      let websiteMatch = true;
      if (websiteFilter === "has_website") {
        websiteMatch = (lead.has_website === true || (!!lead.website_link && lead.website_link !== ""));
      } else if (websiteFilter === "no_website") {
        websiteMatch = (!lead.has_website && (!lead.website_link || lead.website_link === ""));
      }

      const staleMatch = !showStaleOnly || lead.stale_flag;

      if (queueTab === "calls" && lead.next_action_date) {
        if (new Date(lead.next_action_date) > new Date()) return false;
      }

      return filtersMatch && staleMatch && websiteMatch;
    });
  }, [initialLeads, activeLeadType, queueTab, industryFilter, cityFilter, websiteFilter, showStaleOnly]);

  useEffect(() => {
    const filtered = getFilteredQueue();
    setQueue(filtered);
    setCurrentIndex(0);
  }, [getFilteredQueue]);

  const currentLead = queue[currentIndex] || null;

  useEffect(() => {
    // Reset individual call timer when currentLead changes
    setCurrentCallSeconds(0);
  }, [currentLead?.id]);

  const currentMarketInsight = currentLead
    ? initialMarketInsights.find(
      (mi) =>
        mi.industry?.toLowerCase() === currentLead.industry?.toLowerCase() &&
        mi.city?.toLowerCase() === currentLead.city?.toLowerCase()
    )
    : null;

  const pitchLead: PitchLead | null = currentLead
    ? {
      company_name: currentLead.company_name,
      industry: currentLead.industry,
      city: currentLead.city,
      has_website: !!(currentLead.website_link || currentLead.has_website),
    }
    : null;

  const marketData: MarketData | null = currentMarketInsight
    ? {
      search_volume: currentMarketInsight.search_volume
        ? parseInt(currentMarketInsight.search_volume.replace(/[^0-9]/g, "")) || null
        : null,
      ad_density: (currentMarketInsight.market_difficulty as "low" | "medium" | "high") || null,
      competitor_names: currentMarketInsight.top_competitors || [],
    }
    : null;

  const pitch: PitchResult | null =
    pitchLead && marketData ? generateSmartPitch(pitchLead, marketData) : null;

  const highlightVariables = (script: string) => {
    if (!script) return "";
    return script.replace(/\[(.*?)\]/g, '<span class="text-[#42CA80] font-bold">[$1]</span>');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const initiateOutcome = (outcome: string) => {
    if (turboMode && (outcome === "no_answer" || outcome === "busy")) {
      void handleSaveOutcome({
        outcome,
        next_action_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: "Quick Logged via Turbo Mode"
      });
      return;
    }
    if (outcome === "interested") {
      setShowBookingModal(true);
      return;
    }
    setPendingOutcome(outcome);
    setShowOutcomeModal(true);
  };

  const handleSaveOutcome = async (data: OutcomeData) => {
    if (!currentLead || isProcessing) return;
    setIsProcessing(true);

    try {
      const supabase = createClient();
      const now = new Date();

      let newStatus = data.outcome;
      if (data.outcome === "follow_up" || data.outcome === "no_answer" || data.outcome === "busy") newStatus = "calling";
      if (data.outcome === "not_interested" || data.outcome === "wrong_number" || data.outcome === "invalid_number") newStatus = "disqualified";
      if (data.outcome === "interested" || data.outcome === "strategy_booked") newStatus = "qualified";

      const updates: any = {
        status: newStatus,
        last_contacted_at: now.toISOString(),
        last_outcome: data.outcome,
        next_action_date: data.next_action_date || null,
        stale_flag: false,
        attempts: (currentLead.attempts || 0) + 1,
      };

      if (data.interest_level) {
        updates.lead_quality_score = data.interest_level;
      }

      const { error: outcomesError } = await supabase.from("lead_outcomes" as any).insert({
        lead_id: currentLead.id,
        actor_id: userId,
        outcome: data.outcome,
        reason_code: data.reason_code,
        reason_note: data.notes,
        next_action_date: data.next_action_date,
        interest_level: data.interest_level,
      });
      if (outcomesError) throw outcomesError;

      // Log to call_logs for Task 5 Performance Dashboard
      await supabase.from("call_logs" as any).insert({
        lead_id: currentLead.id,
        telecaller_id: userId,
        outcome: data.outcome,
        duration_seconds: currentCallSeconds,
        niche: currentLead.industry,
        city: currentLead.city
      });

      // Update Telecaller Stats (Task 5)
      if (userId) {
        await updateTelecallerStats(userId, data.outcome);
      }

      const { error: leadError } = await supabase.from("leads" as any).update(updates).eq("id", currentLead.id);
      if (leadError) throw leadError;

      setStats((prev) => ({
        calls: prev.calls + 1,
        qualified: newStatus === "qualified" ? prev.qualified + 1 : prev.qualified,
        contacted: prev.contacted + 1,
      }));
      showToast("Outcome Saved!");

      try {
        await logAudit({
          entity_type: "lead", entity_id: currentLead.id, event_type: "call_outcome", title: `Call Outcome: ${data.outcome}`, body: `Reason: ${data.reason_code || 'N/A'}. Notes: ${data.notes || ''}`, metadata: { outcome: data.outcome, reason: data.reason_code, next_action: data.next_action_date, action: "UPDATE" }
        } as any);
      } catch (auditError) {
        console.error("Audit log failed:", auditError);
      }

      if (data.outcome === "no_answer" || data.outcome === "busy") {
        setShowWhatsAppPrompt(true);
      }

      if (data.outcome === "strategy_booked" || data.outcome === "interested") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      if (turboMode && (data.outcome === "no_answer" || data.outcome === "busy")) {
        let timeLeft = 3;
        setAutoAdvanceTimer(timeLeft);
        const timer = setInterval(() => {
          timeLeft -= 1;
          setAutoAdvanceTimer(timeLeft);
          if (timeLeft <= 0) {
            clearInterval(timer);
            setAutoAdvanceTimer(null);
            setShowWhatsAppPrompt(false);
            advanceQueue();
          }
        }, 1000);
      } else {
        removeLeadFromQueue(currentLead.id);
      }

    } catch (e) {
      console.error("Save Outcome Error:", e);
      showToast("Error saving outcome");
    } finally {
      setIsProcessing(false);
      setShowOutcomeModal(false);
    }
  };

  const removeLeadFromQueue = (leadId: string) => {
    const newQueue = queue.filter(l => l.id !== leadId);
    setQueue(newQueue);
    if (currentIndex >= newQueue.length) {
      setCurrentIndex(Math.max(0, newQueue.length - 1));
    }
  };

  const advanceQueue = () => {
    if (currentLead) {
      removeLeadFromQueue(currentLead.id);
    }
  };

  const sendMissedCallWhatsApp = () => {
    if (!currentLead?.phone) return;
    const phone = currentLead.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hi ${currentLead.contact_person || "there"}, just tried calling you from FortuneMarq. I'll try again later, or let me know a better time!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    setShowWhatsAppPrompt(false);
    showToast("WhatsApp Opened");
  }

  const addManualTag = async () => {
    if (!newTag.trim() || !currentLead) return;
    const tag = newTag.trim();
    const updatedTags = [...(currentLead.tags || []), tag];
    
    // Optimistic update
    setQueue(prev => prev.map(l => l.id === currentLead.id ? { ...l, tags: updatedTags } : l));
    setShowTagInput(false);
    setNewTag("");

    const supabase = createClient();
    await supabase.from("leads" as any).update({ tags: updatedTags }).eq("id", currentLead.id);
  };

  const removeManualTag = async (tagToRemove: string) => {
    if (!currentLead?.tags) return;
    const updatedTags = currentLead.tags.filter(t => t !== tagToRemove);
    
    // Optimistic update
    setQueue(prev => prev.map(l => l.id === currentLead.id ? { ...l, tags: updatedTags } : l));

    const supabase = createClient();
    await supabase.from("leads" as any).update({ tags: updatedTags }).eq("id", currentLead.id);
  };

  const copyScript = () => {
    if (pitch?.script) {
      navigator.clipboard.writeText(pitch.script);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const OBJECTION_REBUTTALS: Record<string, string> = {
    "too_expensive": "I totally hear you. We're not the cheapest, but we focus entirely on ROI. If I could show you how [Competitor] got a 3x return in 2 months, would you be open to a 10-minute chat?",
    "already_have_provider": "That's great! It means you value marketing. Most of our best clients have providers but use us to fill the gaps they miss. Are you 100% happy with their current reporting?",
    "no_time": "I promise to be brief. I'm not asking for a meeting today, just permission to send you a 2-minute video audit of your site. If you like it, we talk. If not, no hard feelings. Fair?",
    "just_researching": "Perfect stage to be in. Instead of a sales pitch, how about I send you a market report on exactly what [Competitor] is doing right now? It might help your research.",
    "send_email": "I'd be happy to. To make sure I send relevant info and not just spam, can I ask just one quick question about your current focus?"
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        setShowOutcomeModal(false);
        setShowBookingModal(false);
        return;
      }
      if (showOutcomeModal || showBookingModal) return;
      if (!currentLead) return;

      switch (e.key) {
        case "1": initiateOutcome("interested"); break;
        case "2": initiateOutcome("follow_up"); break;
        case "3": initiateOutcome("no_answer"); break;
        case "4": initiateOutcome("not_reachable"); break;
        case "5": initiateOutcome("not_interested"); break;
        case "s": case "S": setShowBookingModal(true); break;
        case "ArrowRight": if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1); break;
        case "ArrowLeft": if (currentIndex > 0) setCurrentIndex(currentIndex - 1); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentLead, showOutcomeModal, showBookingModal, currentIndex, queue.length, turboMode]);

  async function handleStrategyBooking(dateTime: string, topic: string) {
    if (!currentLead) return;
    const supabase = createClient();

    const updateData = {
      status: "strategy_booked",
      next_action_date: dateTime.split("T")[0],
      notes: `Strategy Session booked: ${dateTime}. Topic: ${topic}`
    };

    await supabase.from("leads" as any).update(updateData).eq("id", currentLead!.id);

    await logAudit({
      entity_type: "lead", entity_id: currentLead!.id, event_type: "strategy_booked", title: "Strategy Booked", body: `Scheduled for ${dateTime}`, metadata: { scheduled_at: dateTime, topic, action: "UPDATE" }
    } as any);

    await supabase.from("lead_outcomes" as any).insert({
      lead_id: currentLead!.id, actor_id: userId, outcome: "strategy_booked", next_action_date: dateTime
    });

    setStats(prev => ({ ...prev, qualified: prev.qualified + 1 }));
    showToast("Strategy Session Booked!");

    removeLeadFromQueue(currentLead.id);
  }

  if (!currentLead) {
    return (
      <div className="flex h-screen items-center justify-center flex-col text-center p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all caught up!</h2>
        <p className="text-slate-600">No more leads matching your filters.</p>
        <div className="mt-6 flex gap-8">
          <div><p className="text-4xl font-mono tabular-nums font-bold text-slate-900">{stats.calls}</p><p className="text-xs text-slate-600">Calls Today</p></div>
          <div><p className="text-4xl font-mono tabular-nums font-bold text-[#42CA80]">{stats.qualified}</p><p className="text-xs text-slate-600">Qualified</p></div>
        </div>
        <button onClick={() => { setIndustryFilter("all"); setWebsiteFilter("all"); setShowStaleOnly(false); }} className="mt-8 text-[#42CA80] hover:underline">Clear Filters</button>
      </div>
    );
  }

  const tzInfo = currentLead.city ? { label: "IST", offset: 5.5 } : null;
  const getLocalTime = (offset: number) => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * offset));
    return nd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const isOutOfHours = (offset: number) => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * offset));
    const hours = nd.getHours();
    return hours < 9 || hours >= 19;
  };
  const outOfHours = tzInfo ? isOutOfHours(tzInfo.offset) : false;

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col relative">
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex justify-center">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -10, x: 0, opacity: 1, rotate: 0 }}
                animate={{ y: 800, x: (Math.random() - 0.5) * 600, rotate: 720, opacity: 0 }}
                transition={{ duration: 2 + Math.random() * 2, ease: "easeOut" }}
                className="absolute top-0 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#FFC107', '#FF3D00', '#4CAF50', '#2196F3', '#9C27B0'][Math.floor(Math.random() * 5)],
                  left: `${50 + (Math.random() - 0.5) * 20}%`
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {turboMode && autoAdvanceTimer !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white border border-slate-300 p-8 rounded-2xl flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full"
            >
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#333" strokeWidth="8" fill="none" />
                  <motion.circle
                    cx="48" cy="48" r="40"
                    stroke="#42CA80" strokeWidth="8" fill="none"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 251.2 * (1 - (autoAdvanceTimer / 3)) }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-900">
                  {autoAdvanceTimer}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Next Lead Loading...</h3>
              <button onClick={() => { setAutoAdvanceTimer(null); }} className="text-sm text-slate-500 hover:text-slate-900 underline">Cancel Auto-Advance</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SalesOutcomeModal
        isOpen={showOutcomeModal}
        onClose={() => setShowOutcomeModal(false)}
        onSave={handleSaveOutcome}
        outcome={pendingOutcome || "follow_up"}
        leadName={currentLead.company_name || "Unknown"}
      />

      {showWhatsAppPrompt && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-md bg-white border border-slate-300 p-4 rounded-xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex flex-col flex-1 min-w-0 text-center sm:text-left">
            <span className="text-slate-900 font-bold text-sm">Send missed call WhatsApp?</span>
            <span className="text-slate-600 text-xs truncate">"Hi {currentLead.contact_person}, just tried calling..."</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <button onClick={sendMissedCallWhatsApp} className="flex-1 sm:flex-none px-3 py-1.5 bg-[#25D366] text-black font-bold text-xs rounded-lg hover:bg-[#1ebc57] whitespace-nowrap">Send</button>
            <button onClick={() => setShowWhatsAppPrompt(false)} className="px-3 py-1.5 bg-slate-200 text-slate-900 text-xs rounded-lg hover:bg-slate-300">Dismiss</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-[#42CA80] text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between sm:px-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {queueTab === "followups" && (
            <button 
              onClick={() => setQueueTab("calls")} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm md:hidden hover:bg-slate-50 transition-colors"
              title="Back to Priority Calls"
            >
              <ArrowLeft className="h-4 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Back</span>
            </button>
          )}
          <div className="flex bg-white p-1 rounded-lg shadow-sm">
            <button onClick={() => setQueueTab("calls")} className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", queueTab === "calls" ? "bg-slate-100 text-slate-900" : "text-slate-600")}>Priority Calls</button>
            {(() => {
              const now = new Date();
              const todayStr = now.toISOString().split("T")[0];
              const endOfToday = new Date(todayStr);
              endOfToday.setHours(23, 59, 59, 999);
              const fuCount = initialLeads.filter(l =>
                (l.lead_type || "outbound") === activeLeadType &&
                l.next_action_date &&
                new Date(l.next_action_date) <= endOfToday
              ).length;
              return (
                <button onClick={() => setQueueTab("followups")} className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2", queueTab === "followups" ? "bg-slate-100 text-slate-900" : "text-slate-600")}>
                  Follow-ups {fuCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white leading-none">{fuCount}</span>}
                </button>
              );
            })()}
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="all">All Niches</option>
            {uniqueIndustries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
            <button
              onClick={() => setWebsiteFilter("all")}
              className={clsx("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", websiteFilter === "all" ? "bg-slate-100 text-slate-900" : "text-slate-500")}
            >All</button>
            <button
              onClick={() => setWebsiteFilter("has_website")}
              className={clsx("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", websiteFilter === "has_website" ? "bg-slate-100 text-slate-900" : "text-slate-500")}
            >Has Website</button>
            <button
              onClick={() => setWebsiteFilter("no_website")}
              className={clsx("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", websiteFilter === "no_website" ? "bg-slate-100 text-slate-900" : "text-slate-500")}
            >No Website</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white rounded-xl p-1.5 pr-4 border border-slate-200 shadow-sm">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <svg className="h-10 w-10 -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="3" fill="none" />
                <circle cx="20" cy="20" r="16" stroke="#42CA80" strokeWidth="3" fill="none" strokeDasharray="100.5" strokeDashoffset={100.5 * (1 - Math.min(stats.calls / DAILY_GOAL, 1))} />
              </svg>
              <span className="absolute text-[10px] font-bold">{Math.round((stats.calls / DAILY_GOAL) * 100)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">{stats.calls} / {DAILY_GOAL}</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                {isTimerPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {formatTime(secondsElapsed)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="p-1.5 rounded hover:bg-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-center min-w-[60px]">
              <div className="text-sm font-bold">{currentIndex + 1} / {queue.length}</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">In Queue</div>
            </div>
            <button onClick={() => setCurrentIndex(prev => Math.min(queue.length - 1, prev + 1))} disabled={currentIndex >= queue.length - 1} className="p-1.5 rounded hover:bg-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <FollowUpList
          onSelectLead={(id) => {
            const idx = queue.findIndex(l => l.id === id);
            if (idx !== -1) setCurrentIndex(idx);
            else showToast("Lead not in filtered queue");
          }}
        />

        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
          {/* Lead Header */}
          <div className="border-b border-slate-200 p-6 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0 flex-1 pr-3">
                <h1 className="text-2xl font-bold text-slate-900 break-words leading-tight">{currentLead.company_name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-900 text-[10px] font-bold uppercase">{currentLead.status || "New"}</span>
                  {(() => {
                    const score = calculateLeadScore({
                      hasPhone: !!currentLead.phone,
                      hasBusinessName: !!currentLead.company_name,
                      isNicheKitComplete: true,
                      hasFollowUpScheduled: false,
                      isInterestedOnce: currentLead.status === 'qualified' || currentLead.status === 'interested',
                      isNotInterested: currentLead.status === 'disqualified',
                      noContactIn7Days: false
                    });
                    const visuals = getScoreVisuals(score);
                    return (
                      <div className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-white flex items-center gap-1.5", visuals.color)}>
                        {visuals.icon} {visuals.label} {score}/10
                      </div>
                    );
                  })()}
                  {queueTab === "followups" && currentLead.last_contacted_at && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase border border-blue-100">
                      <Clock className="h-3 w-3" />
                      Last called {Math.floor((Date.now() - new Date(currentLead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))}d ago
                    </span>
                  )}
                  {queueTab === "followups" && currentLead.last_outcome && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-100">
                      {currentLead.last_outcome.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                
                {/* Custom Tags Section */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 max-w-full overflow-hidden">
                  {/* Auto-tags */}
                  {(currentLead.has_website === true || currentLead.website_link) && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Has Website</span>
                  )}
                  {currentLead.gmb_link && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">GMB Present</span>
                  )}
                  {(!currentLead.has_website && !currentLead.website_link && !currentLead.gmb_link) && (
                    <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full">No Digital Presence</span>
                  )}

                  {/* Stored Tags */}
                  {currentLead.tags?.map((tag) => {
                    let pillColor = "bg-slate-100 text-slate-700";
                    if (tag === "SERP Ranked") pillColor = "bg-violet-100 text-violet-700";
                    if (tag === "Not SERP Ranked") pillColor = "bg-slate-100 text-slate-500";
                    if (tag !== "SERP Ranked" && tag !== "Not SERP Ranked") pillColor = "bg-amber-100 text-amber-700";

                    return (
                      <span key={tag} className={clsx(pillColor, "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 group")}>
                        {tag}
                        <button onClick={() => removeManualTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity">
                          <XCircle className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Add Tag Inline */}
                  {showTagInput ? (
                    <div className="flex items-center gap-1 ml-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 h-[22px]">
                      <input 
                        className="text-xs outline-none w-20 text-slate-700" 
                        placeholder="Tag..." 
                        autoFocus 
                        value={newTag} 
                        onChange={(e) => setNewTag(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === "Enter") addManualTag(); else if (e.key === "Escape") setShowTagInput(false) }}
                        onBlur={() => setShowTagInput(false)}
                      />
                    </div>
                  ) : (
                    <button onClick={() => setShowTagInput(true)} className="ml-1 flex items-center justify-center p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
                      <span className="text-sm leading-none font-bold">+</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                  <User className="h-4 w-4" /> <span>{currentLead.contact_person || "Unknown Contact"}</span>
                  <div className="flex gap-1 ml-4">
                    {Array.from({ length: Math.min(currentLead.attempts || 0, 5) }).map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {currentLead.website_link && (
                  <a href={currentLead.website_link} target="_blank" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-all whitespace-nowrap">
                    <Globe className="h-3.5 w-3.5" /> Visit Site
                  </a>
                )}
                <a
                  href={currentLead.gmb_link
                    ? currentLead.gmb_link
                    : `https://www.google.com/search?q=${encodeURIComponent((currentLead.company_name || "") + " " + (currentLead.city || ""))}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all whitespace-nowrap"
                  title={currentLead.gmb_link ? "Open GMB Profile" : "Search on Google"}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {currentLead.gmb_link ? "GMB Profile" : "Search"}
                </a>
              </div>
            </div>

            {queueTab === "followups" && currentLead.notes && (
              <div className="mt-4 mx-auto max-w-sm w-full bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Notes from last call
                </p>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">{currentLead.notes}</p>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 mt-6">
              <a href={`tel:${currentLead.phone}`} className={clsx("w-full max-w-sm flex items-center justify-center gap-3 p-4 rounded-2xl shadow-lg font-bold text-xl transition-all active:scale-95", outOfHours ? "bg-orange-50 text-orange-600 border border-orange-200" : "bg-emerald-500 text-white")}>
                <Phone className="h-5 w-5" /> {currentLead.phone}
                {outOfHours && <span className="text-[10px] bg-orange-200 px-1.5 rounded ml-2 font-bold text-orange-700">After Hours</span>}
              </a>
              {tzInfo && (
                <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {tzInfo.label} • {getLocalTime(tzInfo.offset)}
                </div>
              )}
            </div>

            {/* Actions Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <button
                onClick={() => setOutcomeCategory(prev => prev === "connected" ? null : "connected")}
                className={clsx("p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all", outcomeCategory === "connected" ? "bg-emerald-500 text-white" : "border-emerald-500 text-emerald-600")}
              >
                <CheckCircle2 className="h-4 w-4" /> Connected
              </button>
              <button onClick={() => initiateOutcome("no_answer")} className="p-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-2">
                <PhoneMissed className="h-4 w-4" /> No Answer
              </button>
              <button onClick={() => setShowScheduleModal(true)} className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" /> Schedule
              </button>
              <WhatsAppTemplateButton lead={currentLead as any} onOutcomeLogged={initiateOutcome} />
            </div>

            {outcomeCategory === "connected" && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in zoom-in-95 duration-200 max-w-sm mx-auto">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Logistics</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => initiateOutcome("interested")} className="p-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md">Interested / Booked</button>
                  <button onClick={() => initiateOutcome("follow_up")} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">Call Back Later</button>
                  <button onClick={() => initiateOutcome("not_interested")} className="p-2 text-xs text-rose-500 font-medium hover:underline">Not Interested</button>
                </div>
              </div>
            )}
          </div>

          {/* Intelligence Section */}
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {queueTab === "followups" ? (
                  <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-blue-500" />
                        Follow-Up Script
                      </span>
                      <button onClick={copyScript} className="text-emerald-600 flex items-center gap-1 hover:underline text-xs">
                        <Copy className="h-3 w-3" /> {copiedScript ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                      <p>
                        "Hi, is this{" "}
                        <span className="text-emerald-600 font-bold">[{currentLead.contact_person || "the owner"}]</span>?
                        This is [Your Name] from FortuneMarq. We had spoken earlier about{" "}
                        <span className="text-emerald-600 font-bold">[{currentLead.company_name}]</span>'s
                        online presence."
                      </p>
                      <p>
                        "Just wanted to follow up — last time we spoke, you mentioned you'd think about it.
                        Have you had a chance to consider how getting more {currentLead.industry ? (
                          <span className="text-emerald-600 font-bold">{currentLead.industry}</span>
                        ) : "local"} customers online could help your business?"
                      </p>
                      <p>
                        "We've helped several {currentLead.industry || "businesses"} in{" "}
                        <span className="text-emerald-600 font-bold">[{currentLead.city || "your area"}]</span>{" "}
                        get found on Google within the first month. I'd love to show you exactly what we'd do for{" "}
                        <span className="text-emerald-600 font-bold">[{currentLead.company_name}]</span> — it only takes 15 minutes."
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-3 mt-2">
                        If they say they're busy: "No problem, when's a better time this week?"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group">
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <span className="font-bold text-slate-800">Smart Pitch</span>
                      <button onClick={copyScript} className="text-emerald-600 flex items-center gap-1 hover:underline text-xs"><Copy className="h-3 w-3" /> {copiedScript ? "Copied!" : "Copy"}</button>
                    </div>
                    <div className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightVariables(pitch?.script || "Analyzing market context...") }} />
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-4 border-b border-slate-50 font-bold text-xs uppercase tracking-widest text-slate-400">Activity Timeline</div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <ActivityTimeline entityId={currentLead.id} entityType="lead" limit={10} compact />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <StrategyBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBookingConfirm={handleStrategyBooking}
        />
      )}

      {showScheduleModal && (
        <ScheduleFollowUpModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          leadId={currentLead.id}
          leadName={currentLead.company_name || "Prospect"}
          onScheduled={() => showToast("Follow-up set!")}
        />
      )}
    </div>
  );
}
