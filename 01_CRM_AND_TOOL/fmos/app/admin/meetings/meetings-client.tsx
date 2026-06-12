"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Phone, MapPin, Building, Clock, CheckCircle2,
  XCircle, RotateCcw, User, CalendarX, Flame, Filter,
  Link2, Copy, MessageCircle, ChevronDown, ChevronUp,
  Globe, Search, FileText, Bell, BellOff, Target,
  TrendingUp, BarChart2, ChevronRight, Pencil, Check, X,
  Lightbulb, AlertTriangle, HelpCircle, TrendingDown, ThumbsDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { leadStageUpdate, stageToStatus } from "@/lib/pipeline";

// ─── Types ────────────────────────────────────────────────────
interface Meeting {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  industry: string | null;
  city: string | null;
  follow_up_date: string | null;
  outreach_stage: string | null;
  last_outcome: string | null;
  notes: string | null;
  has_website: boolean | null;
  lead_type: string | null;
  website_link: string | null;
  gmb_link: string | null;
  serp_ranked: boolean | null;
  meeting_link: string | null;
  meeting_notes: string | null;
}

type MeetingStatus = "overdue" | "today" | "upcoming";

// ─── Helpers ──────────────────────────────────────────────────
function getMeetingStatus(dateStr: string | null): MeetingStatus {
  if (!dateStr) return "upcoming";
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  if (d < now && d < todayStart) return "overdue";
  if (d >= todayStart && d <= todayEnd) return "today";
  return "upcoming";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "No date set";
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getCountdown(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const suffix = diff < 0 ? "overdue" : "";
  const prefix = diff < 0 ? "" : "in ";
  if (days > 0) return `${prefix}${days}d ${suffix}`.trim();
  if (hours > 0) return `${prefix}${hours}h ${suffix}`.trim();
  return `${prefix}${mins}m ${suffix}`.trim();
}

function getScriptType(m: Meeting): string {
  const lt = m.lead_type?.toUpperCase();
  if (lt === "A" || lt === "B" || lt === "C" || lt === "D") return lt;
  if (m.serp_ranked) return "A";
  if (!m.serp_ranked && m.has_website) return "B";
  return "C";
}

const SCRIPT_TYPE_INFO: Record<string, { label: string; desc: string; color: string; tip: string }> = {
  A: { label: "Type A", desc: "Already ranking on Google", color: "bg-green-100 text-green-700", tip: "They already trust Google presence. Lead with ROI improvement and getting to position 1." },
  B: { label: "Type B", desc: "Has website, not ranking", color: "bg-blue-100 text-blue-700", tip: "They have invested in a website but it's not working. Lead with 'your website isn't generating leads yet — we can fix that.'" },
  C: { label: "Type C", desc: "No website, not ranking", color: "bg-purple-100 text-purple-700", tip: "Start from scratch. Lead with competitor comparison — 'your competitors with websites get 3x more inquiries.'" },
  D: { label: "Type D", desc: "Low-volume niche", color: "bg-amber-100 text-amber-700", tip: "Search volume is low — focus on social proof, local dominance, and WhatsApp-first strategy." },
};

const STATUS_CONFIG = {
  overdue:  { label: "Overdue",  bg: "bg-red-50",   border: "border-red-200",   badge: "bg-red-100 text-red-700",     dot: "bg-red-500"   },
  today:    { label: "Today",    bg: "bg-green-50",  border: "border-green-200", badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  upcoming: { label: "Upcoming", bg: "bg-white",     border: "border-slate-200", badge: "bg-slate-100 text-slate-600", dot: "bg-blue-400"  },
};

// ─── Main Component ───────────────────────────────────────────
export default function MeetingsClient({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [filter, setFilter] = useState<"all" | MeetingStatus>("all");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Per-card UI state
  const [expandedIntel, setExpandedIntel] = useState<Set<string>>(new Set());
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [editingNotes, setEditingNotes] = useState<Set<string>>(new Set());
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [postMeetingId, setPostMeetingId] = useState<string | null>(null);
  const [postMeetingOutcome, setPostMeetingOutcome] = useState<"interested" | "thinking" | "not_interested" | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<{ id: string; type: "confirmation" | "reminder_15" | "reminder_1h" } | null>(null);

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const notifTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const supabase = createClient();
  const router = useRouter();

  // ── Browser Notifications ─────────────────────────────────
  useEffect(() => {
    if (!("Notification" in window)) return;
    setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (notifPermission !== "granted") return;
    // Clear old timers
    Object.values(notifTimers.current).forEach(clearTimeout);
    notifTimers.current = {};

    meetings.forEach((m) => {
      if (!m.follow_up_date) return;
      const meetingTime = new Date(m.follow_up_date).getTime();
      const notify15 = meetingTime - 15 * 60 * 1000;
      const notify1h  = meetingTime - 60 * 60 * 1000;
      const now = Date.now();

      if (notify15 > now && notify15 - now < 2 * 60 * 60 * 1000) {
        notifTimers.current[`${m.id}_15`] = setTimeout(() => {
          new Notification("Meeting in 15 minutes", {
            body: `Call with ${m.company_name} at ${formatTime(m.follow_up_date)}`,
            icon: "/favicon.ico",
          });
        }, notify15 - now);
      }

      if (notify1h > now && notify1h - now < 2 * 60 * 60 * 1000) {
        notifTimers.current[`${m.id}_1h`] = setTimeout(() => {
          new Notification("Meeting in 1 hour", {
            body: `${m.company_name} — ${formatDate(m.follow_up_date)} at ${formatTime(m.follow_up_date)}`,
            icon: "/favicon.ico",
          });
        }, notify1h - now);
      }
    });

    return () => Object.values(notifTimers.current).forEach(clearTimeout);
  }, [meetings, notifPermission]);

  async function requestNotifPermission() {
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }

  // ── Filtering ─────────────────────────────────────────────
  const filtered = meetings.filter((m) => filter === "all" || getMeetingStatus(m.follow_up_date) === filter);
  const counts = {
    overdue:  meetings.filter(m => getMeetingStatus(m.follow_up_date) === "overdue").length,
    today:    meetings.filter(m => getMeetingStatus(m.follow_up_date) === "today").length,
    upcoming: meetings.filter(m => getMeetingStatus(m.follow_up_date) === "upcoming").length,
  };
  const showRate = meetings.length > 0
    ? Math.round((initialMeetings.length / (initialMeetings.length + 1)) * 100)
    : 0;

  // ── Actions ───────────────────────────────────────────────
  async function handleAction(id: string, action: "attended" | "no_show" | "cancelled") {
    if (action === "attended") {
      setPostMeetingId(id);
      setPostMeetingOutcome(null);
      setFollowUpDate("");
      return;
    }
    startTransition(async () => {
      const stageMap = { attended: "proposal_sent", no_show: "follow_up_due", cancelled: "follow_back" };
      const { error } = await supabase.from("leads").update(leadStageUpdate(stageMap[action], { last_outcome: action }) as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (action === "no_show") {
        setSuccessToast("Marked as No Show — lead moved to Follow-up Due");
        setTimeout(() => setSuccessToast(null), 4000);
        const m = meetings.find(mt => mt.id === id);
        logAudit({ action: "meeting_outcome", resourceType: "meeting", resourceId: id, resourceLabel: m?.company_name, newValue: { outcome: "no_show" }, summary: `No show — moved to Follow-up Due` });
      }
    });
  }

  async function confirmPostMeeting(id: string) {
    const notes = notesDraft[id] || meetings.find(m => m.id === id)?.meeting_notes || "";
    if (!postMeetingOutcome) return;

    const updates: Record<string, any> = { meeting_notes: notes, last_outcome: postMeetingOutcome };

    if (postMeetingOutcome === "interested") {
      updates.outreach_stage = "proposal_sent";
    } else if (postMeetingOutcome === "thinking") {
      updates.outreach_stage = "follow_up_due";
      if (followUpDate) updates.follow_up_date = followUpDate;
    } else if (postMeetingOutcome === "not_interested") {
      updates.outreach_stage = "lost";
    }
    if (updates.outreach_stage) {
      updates.status = stageToStatus(updates.outreach_stage);
    }

    startTransition(async () => {
      const { error } = await supabase.from("leads").update(updates as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      const m = meetings.find(mt => mt.id === id);
      logAudit({ action: "meeting_outcome", resourceType: "meeting", resourceId: id, resourceLabel: m?.company_name, newValue: { outcome: postMeetingOutcome, follow_up_date: followUpDate || undefined }, summary: `Meeting outcome: ${postMeetingOutcome?.replace(/_/g, " ")}` });
      setMeetings(prev => prev.filter(mt => mt.id !== id));
      setPostMeetingId(null);
      setPostMeetingOutcome(null);

      if (postMeetingOutcome === "interested") {
        router.push(`/admin/leads/${id}/proposal/new`);
      } else if (postMeetingOutcome === "thinking") {
        const dateLabel = followUpDate
          ? new Date(followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          : "a later date";
        setSuccessToast(`Follow-up scheduled for ${dateLabel}`);
        setTimeout(() => setSuccessToast(null), 4000);
      }
      // not_interested: card disappears, nothing more needed
    });
  }

  async function handleReschedule(id: string) {
    if (!rescheduleDate) return;
    startTransition(async () => {
      const { error } = await supabase.from("leads").update(leadStageUpdate("meeting_booked", { follow_up_date: rescheduleDate }) as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      const m = meetings.find(mt => mt.id === id);
      logAudit({ action: "update", resourceType: "meeting", resourceId: id, resourceLabel: m?.company_name, oldValue: { follow_up_date: m?.follow_up_date }, newValue: { follow_up_date: rescheduleDate }, summary: `Meeting rescheduled to ${new Date(rescheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` });
      setMeetings(prev => prev.map(mt => mt.id === id ? { ...mt, follow_up_date: rescheduleDate } : mt));
      setRescheduleId(null); setRescheduleDate("");
      const dateLabel = new Date(rescheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      setSuccessToast(`Meeting rescheduled to ${dateLabel}`);
      setTimeout(() => setSuccessToast(null), 4000);
    });
  }

  async function saveMeetingLink(id: string) {
    startTransition(async () => {
      const { error } = await supabase.from("leads").update({ meeting_link: linkDraft } as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, meeting_link: linkDraft } : m));
      setEditingLink(null); setLinkDraft("");
    });
  }

  async function saveMeetingNotes(id: string) {
    const notes = notesDraft[id] ?? "";
    startTransition(async () => {
      const { error } = await supabase.from("leads").update({ meeting_notes: notes } as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, meeting_notes: notes } : m));
      setEditingNotes(prev => { const n = new Set(prev); n.delete(id); return n; });
    });
  }

  function copyLink(id: string, link: string) {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function buildMsg(m: Meeting, type: "confirmation" | "reminder_15" | "reminder_1h"): string {
    const time = formatTime(m.follow_up_date);
    const date = formatDate(m.follow_up_date);
    const name = m.contact_person || "there";
    const linkLine = m.meeting_link ? `\n\n🔗 Join here: ${m.meeting_link}` : "\n\n⚠️ Meeting link not added yet — please add a link before sharing.";
    if (type === "confirmation") {
      return `Hi ${name}! 👋\n\nYour call with *FortuneMarq* is confirmed.\n\n📅 Date: ${date}\n⏰ Time: ${time}${linkLine}\n\nLooking forward to speaking with you!\n— FortuneMarq Team`;
    }
    if (type === "reminder_1h") {
      return `Hi ${name}! ⏰\n\nJust a reminder — your call with FortuneMarq is *in 1 hour*.\n\n📅 ${date} at ${time}${linkLine}\n\nSee you soon!\n— FortuneMarq Team`;
    }
    return `Hi ${name}! 🔔\n\nYour call with FortuneMarq starts *in 15 minutes*!\n\n⏰ ${time}${linkLine}\n\nTalk soon!\n— FortuneMarq Team`;
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Success Toast ── */}
        {successToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
            {successToast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Booked Meetings</h1>
            <p className="text-sm text-slate-500 mt-0.5">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} scheduled</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification toggle */}
            {"Notification" in window && (
              <button
                onClick={requestNotifPermission}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                  notifPermission === "granted"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
                title="Enable meeting reminders"
              >
                {notifPermission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {notifPermission === "granted" ? "Reminders On" : "Enable Reminders"}
              </button>
            )}
            <Link href="/admin/outreach" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-2 rounded-xl transition-colors">
              Outreach <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Analytics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["overdue",  Flame,     "text-red-500",   counts.overdue,  "Overdue"],
            ["today",    Calendar,  "text-green-600", counts.today,    "Today"],
            ["upcoming", Clock,     "text-blue-500",  counts.upcoming, "Upcoming"],
            ["all",      BarChart2, "text-indigo-500",meetings.length, "Total"],
          ] as const).map(([key, Icon, color, count, label]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key as any)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                filter === key
                  ? "bg-slate-900 border-slate-900 text-white shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className={`h-4 w-4 mb-2 ${filter === key ? "text-white" : color}`} />
              <p className={`text-2xl font-bold tabular-nums ${filter === key ? "text-white" : "text-slate-900"}`}>{count}</p>
              <p className={`text-[11px] font-semibold uppercase tracking-wide mt-0.5 ${filter === key ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* Notification banner */}
        {notifPermission === "default" && "Notification" in window && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">Enable browser notifications to get 15-min & 1-hour reminders before each meeting.</p>
            </div>
            <button onClick={requestNotifPermission} className="shrink-0 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
              Enable
            </button>
          </div>
        )}

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {actionError}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
            <CalendarX className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No {filter === "all" ? "" : filter} meetings</p>
          </div>
        )}

        {/* ── Meeting Cards ──────────────────────────────── */}
        <div className="space-y-4">
          {filtered.map((m) => {
            const status = getMeetingStatus(m.follow_up_date);
            const cfg = STATUS_CONFIG[status];
            const scriptType = getScriptType(m);
            const scriptInfo = SCRIPT_TYPE_INFO[scriptType];
            const isIntelOpen = expandedIntel.has(m.id);
            const isRescheduling = rescheduleId === m.id;
            const isEditingLink = editingLink === m.id;
            const isEditingNotes = editingNotes.has(m.id);
            const currentNotes = notesDraft[m.id] ?? m.meeting_notes ?? "";
            const isPostMeeting = postMeetingId === m.id;

            return (
              <div key={m.id} className={`rounded-2xl border ${cfg.border} ${cfg.bg} shadow-sm overflow-hidden`}>

                {/* ── Card Header ── */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label} · {getCountdown(m.follow_up_date)}
                      </span>
                      {status === "today" && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">LIVE TODAY</span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{m.company_name}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                      {m.contact_person && <span className="flex items-center gap-1"><User className="h-3 w-3" />{m.contact_person}</span>}
                      {m.industry && <span className="flex items-center gap-1"><Building className="h-3 w-3" />{m.industry}</span>}
                      {m.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.city}</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${scriptInfo.color}`}>
                    Script {scriptType}
                  </span>
                </div>

                {/* ── Date/Time + Call button ── */}
                <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">{formatDate(m.follow_up_date)}</span>
                    <span className="text-sm text-slate-400">{formatTime(m.follow_up_date)}</span>
                  </div>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center gap-2 bg-brand-deep hover:bg-brand-hover text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors">
                      <Phone className="h-4 w-4" />{m.phone}
                    </a>
                  )}
                </div>

                {/* ── Meeting Link ── */}
                <div className="px-5 pb-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Meeting Link
                    </p>
                    {isEditingLink ? (
                      <div className="flex gap-2">
                        <input
                          value={linkDraft}
                          onChange={(e) => setLinkDraft(e.target.value)}
                          placeholder="https://meet.google.com/... or https://zoom.us/..."
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                        />
                        <button onClick={() => saveMeetingLink(m.id)} className="bg-brand-deep hover:bg-brand-hover text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setEditingLink(null); setLinkDraft(""); }} className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : m.meeting_link ? (
                      <div className="flex items-center gap-2">
                        <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex-1 text-sm text-blue-600 hover:underline truncate font-mono">
                          {m.meeting_link}
                        </a>
                        <button onClick={() => copyLink(m.id, m.meeting_link!)} className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${copiedId === m.id ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-slate-200 text-slate-500 hover:text-slate-700"}`} title="Copy link">
                          {copiedId === m.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                        </button>
                        <button onClick={() => { setEditingLink(m.id); setLinkDraft(m.meeting_link!); }} className="shrink-0 p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingLink(m.id); setLinkDraft("https://meet.google.com/"); }}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-deep border border-dashed border-slate-300 hover:border-brand rounded-lg px-3 py-2 w-full transition-colors"
                        >
                          <Link2 className="h-4 w-4" /> Add Google Meet / Zoom link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── WhatsApp Templates ── */}
                {m.phone && (
                  <div className="px-5 pb-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> Send via WhatsApp
                      </p>
                      {!m.meeting_link && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <p className="text-xs text-amber-700">Add a meeting link above — it will be included in all messages.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {(["confirmation", "reminder_1h", "reminder_15"] as const).map((type) => {
                          const labels = { confirmation: "Confirmation", reminder_1h: "1h Reminder", reminder_15: "15-min Reminder" };
                          const icons = { confirmation: Calendar, reminder_1h: Clock, reminder_15: Bell };
                          const colors = { confirmation: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", reminder_1h: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", reminder_15: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" };
                          const Icon = icons[type];
                          const isOpen = previewMsg?.id === m.id && previewMsg?.type === type;
                          return (
                            <button
                              key={type}
                              onClick={() => setPreviewMsg(isOpen ? null : { id: m.id, type })}
                              className={`flex flex-col items-center gap-1 text-[11px] font-semibold border px-2 py-2 rounded-lg transition-colors ${colors[type]} ${isOpen ? "ring-2 ring-offset-1 ring-current" : ""}`}
                            >
                              <Icon className="h-4 w-4" />
                              {labels[type]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Message preview */}
                      {previewMsg?.id === m.id && (
                        <div className="bg-slate-900 rounded-xl p-3 space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Message Preview</p>
                          <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-3">
                            <pre className="text-xs text-emerald-200 whitespace-pre-wrap leading-relaxed font-sans">
                              {buildMsg(m, previewMsg.type)}
                            </pre>
                          </div>
                          <a
                            href={`https://wa.me/${m.phone!.replace(/\D/g,"")}?text=${encodeURIComponent(buildMsg(m, previewMsg.type))}`}
                            target="_blank" rel="noreferrer"
                            onClick={() => setPreviewMsg(null)}
                            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" /> Open in WhatsApp & Send
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Pre-meeting Intel (expandable) ── */}
                <div className="px-5 pb-3">
                  <button
                    onClick={() => setExpandedIntel(prev => { const n = new Set(prev); isIntelOpen ? n.delete(m.id) : n.add(m.id); return n; })}
                    className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Pre-Meeting Intel & Talking Points</span>
                    {isIntelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isIntelOpen && (
                    <div className="mt-2 bg-white border border-indigo-100 rounded-xl p-4 space-y-3">
                      {/* Script type */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Script Type</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${scriptInfo.color}`}>{scriptInfo.label} — {scriptInfo.desc}</span>
                      </div>

                      {/* Online presence */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-lg p-2.5 border ${m.has_website ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Website</p>
                          {m.has_website && m.website_link ? (
                            <a href={m.website_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Globe className="h-3 w-3" /> View Website
                            </a>
                          ) : m.has_website ? (
                            <span className="text-xs text-blue-700 font-semibold flex items-center gap-1"><Globe className="h-3 w-3" /> Has Website</span>
                          ) : (
                            <span className="text-xs text-slate-500">No website</span>
                          )}
                        </div>
                        <div className={`rounded-lg p-2.5 border ${m.gmb_link ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">GMB / Maps</p>
                          {m.gmb_link ? (
                            <a href={m.gmb_link} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                              <Search className="h-3 w-3" /> View on Maps
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">No GMB</span>
                          )}
                        </div>
                        <div className={`rounded-lg p-2.5 border ${m.serp_ranked ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Google Ranking</p>
                          <span className={`text-xs font-semibold ${m.serp_ranked ? "text-green-700" : "text-red-600"}`}>
                            {m.serp_ranked ? "✓ Ranking" : "✗ Not Ranking"}
                          </span>
                        </div>
                        <div className="rounded-lg p-2.5 border bg-amber-50 border-amber-200">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Last Outcome</p>
                          <span className="text-xs font-semibold text-amber-700">{m.last_outcome?.replace(/_/g, " ") || "First contact"}</span>
                        </div>
                      </div>

                      {/* Talking point */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" /> Opening Strategy
                        </p>
                        <p className="text-sm text-indigo-900 leading-relaxed">{scriptInfo.tip}</p>
                      </div>

                      {/* Prep checklist */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pre-call Checklist</p>
                        {[
                          ["Review their Google listing", m.gmb_link ? "done" : "pending"],
                          ["Check their website", m.has_website ? "done" : "skip"],
                          ["Know their niche + city combo", m.industry && m.city ? "done" : "pending"],
                          ["Meeting link sent on WhatsApp", m.meeting_link ? "done" : "pending"],
                          ["Confirmation message sent", "pending"],
                        ].map(([item, state]) => (
                          <div key={item} className="flex items-center gap-2 text-xs">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white shrink-0 text-[9px] font-bold ${state === "done" ? "bg-emerald-500" : state === "skip" ? "bg-slate-300" : "bg-amber-400"}`}>
                              {state === "done" ? "✓" : state === "skip" ? "–" : "!"}
                            </span>
                            <span className={state === "done" ? "text-slate-400 line-through" : "text-slate-700"}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Meeting Notes ── */}
                <div className="px-5 pb-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Meeting Notes
                      </p>
                      {!isEditingNotes ? (
                        <button
                          onClick={() => {
                            setNotesDraft(prev => ({ ...prev, [m.id]: m.meeting_notes || "" }));
                            setEditingNotes(prev => new Set(prev).add(m.id));
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Pencil className="h-3 w-3" /> {m.meeting_notes ? "Edit" : "Add notes"}
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => saveMeetingNotes(m.id)} className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={() => setEditingNotes(prev => { const n = new Set(prev); n.delete(m.id); return n; })}
                            className="text-[11px] text-slate-400 hover:text-slate-600 ml-2"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingNotes ? (
                      <textarea
                        value={currentNotes}
                        onChange={(e) => setNotesDraft(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="Key discussion points, objections raised, next steps agreed..."
                        rows={3}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                      />
                    ) : m.meeting_notes ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.meeting_notes}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No notes yet — add key points during or after the call</p>
                    )}
                  </div>
                </div>

                {/* ── Post-meeting outcome panel ── */}
                {isPostMeeting && (
                  <div className="px-5 pb-3">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                      <p className="text-sm font-bold text-slate-800">What was the outcome?</p>

                      {/* Outcome selector */}
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "interested",    label: "Interested",        sub: "Ready for proposal", icon: CheckCircle2, active: "bg-emerald-600 border-emerald-600 text-white", inactive: "border-slate-200 text-slate-600 hover:border-emerald-400" },
                          { key: "thinking",      label: "Thinking About It", sub: "Needs more time",     icon: HelpCircle,   active: "bg-amber-500 border-amber-500 text-white",   inactive: "border-slate-200 text-slate-600 hover:border-amber-400" },
                          { key: "not_interested",label: "Not Interested",    sub: "Doesn't want it",    icon: ThumbsDown,   active: "bg-red-600 border-red-600 text-white",       inactive: "border-slate-200 text-slate-600 hover:border-red-400" },
                        ] as const).map(({ key, label, sub, icon: Icon, active, inactive }) => (
                          <button
                            key={key}
                            onClick={() => setPostMeetingOutcome(key)}
                            className={`flex flex-col items-center gap-1.5 border-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors ${postMeetingOutcome === key ? active : inactive}`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-center leading-tight">{label}</span>
                            <span className={`text-[10px] font-normal ${postMeetingOutcome === key ? "opacity-80" : "text-slate-400"}`}>{sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* Follow-up date for "thinking" */}
                      {postMeetingOutcome === "thinking" && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Follow-up Date</label>
                          <input
                            type="datetime-local"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                          />
                        </div>
                      )}

                      {/* Notes */}
                      <textarea
                        value={notesDraft[m.id] ?? m.meeting_notes ?? ""}
                        onChange={(e) => setNotesDraft(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="What was discussed? Objections? Key points?"
                        rows={3}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                      />

                      {/* Confirm actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmPostMeeting(m.id)}
                          disabled={!postMeetingOutcome || isPending}
                          className={`flex-1 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors ${
                            postMeetingOutcome === "not_interested" ? "bg-red-600 hover:bg-red-700" :
                            postMeetingOutcome === "thinking"       ? "bg-amber-500 hover:bg-amber-600" :
                            "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isPending ? "Saving…" :
                            postMeetingOutcome === "interested"     ? "Confirm & Move to Proposals" :
                            postMeetingOutcome === "thinking"       ? "Save & Schedule Follow-up" :
                            postMeetingOutcome === "not_interested" ? "Mark as Not Interested" :
                            "Select an outcome above"
                          }
                        </button>
                        {postMeetingOutcome === "interested" && (
                          <Link
                            href={`/admin/leads/${m.id}/proposal/new`}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
                          >
                            <FileText className="h-4 w-4" /> Create Proposal
                          </Link>
                        )}
                      </div>
                      <button onClick={() => { setPostMeetingId(null); setPostMeetingOutcome(null); }} className="text-xs text-slate-400 hover:text-slate-600 w-full text-center">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Reschedule ── */}
                {isRescheduling && (
                  <div className="px-5 pb-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-600">New date & time:</p>
                      <input
                        type="datetime-local"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReschedule(m.id)} disabled={!rescheduleDate || isPending} className="flex-1 bg-brand-deep hover:bg-brand-hover disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                          Confirm Reschedule
                        </button>
                        <button onClick={() => { setRescheduleId(null); setRescheduleDate(""); }} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                {!isPostMeeting && (
                  <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                    <button onClick={() => handleAction(m.id, "attended")} disabled={isPending} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors">
                      <CheckCircle2 className="h-4 w-4" /> Attended
                    </button>
                    <button onClick={() => { setRescheduleId(isRescheduling ? null : m.id); setRescheduleDate(""); }} disabled={isPending} className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors">
                      <RotateCcw className="h-4 w-4" /> Reschedule
                    </button>
                    <button onClick={() => handleAction(m.id, "no_show")} disabled={isPending} className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors">
                      <XCircle className="h-4 w-4" /> No Show
                    </button>
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="border-t border-slate-100 px-5 py-2 flex justify-end">
                  <Link href={`/admin/leads/${m.id}`} className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
                    View Lead Profile <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
