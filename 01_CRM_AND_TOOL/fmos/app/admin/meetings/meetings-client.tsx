"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Phone, MapPin, Building, Clock, CheckCircle2,
  XCircle, RotateCcw, User, CalendarX, Flame,
  Link2, Copy, MessageCircle, ChevronDown, ChevronUp,
  Globe, Search, FileText, Bell, BellOff, Target,
  BarChart2, ChevronRight, Pencil, Check, X, Minus,
  Lightbulb, AlertTriangle, HelpCircle, ThumbsDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { leadStageUpdate, stageToStatus } from "@/lib/pipeline";
import { rescheduleMeeting, handleNoShow } from "@/actions/book-meeting";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

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

// Script type is categorical, not status — keep it neutral (the letter carries meaning).
const SCRIPT_TYPE_INFO: Record<string, { label: string; desc: string; tip: string }> = {
  A: { label: "Type A", desc: "Already ranking on Google", tip: "They already trust Google presence. Lead with ROI improvement and getting to position 1." },
  B: { label: "Type B", desc: "Has website, not ranking", tip: "They have invested in a website but it's not working. Lead with 'your website isn't generating leads yet — we can fix that.'" },
  C: { label: "Type C", desc: "No website, not ranking", tip: "Start from scratch. Lead with competitor comparison — 'your competitors with websites get 3x more inquiries.'" },
  D: { label: "Type D", desc: "Low-volume niche", tip: "Search volume is low — focus on social proof, local dominance, and WhatsApp-first strategy." },
};

const STATUS_CONFIG = {
  overdue:  { label: "Overdue",  bg: "bg-danger-soft", border: "border-danger-line", tone: "danger" as const,  dot: "bg-danger" },
  today:    { label: "Today",    bg: "bg-brand-soft",  border: "border-brand-line",  tone: "brand" as const,   dot: "bg-brand" },
  upcoming: { label: "Upcoming", bg: "bg-surface",     border: "border-line",        tone: "neutral" as const, dot: "bg-slate-400" },
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
  const [notifSupported, setNotifSupported] = useState(false);
  const notifTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const supabase = createClient();
  const router = useRouter();

  // ── Browser Notifications ─────────────────────────────────
  useEffect(() => {
    if (!("Notification" in window)) return;
    setNotifSupported(true);
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

  // ── Actions ───────────────────────────────────────────────
  async function handleAction(id: string, action: "attended" | "no_show" | "cancelled") {
    if (action === "attended") {
      setPostMeetingId(id);
      setPostMeetingOutcome(null);
      setFollowUpDate("");
      return;
    }
    startTransition(async () => {
      if (action === "no_show") {
        const result = await handleNoShow({ leadId: id });
        if (!result.ok) { setActionError(result.error || "No-show action failed"); return; }
        setMeetings(prev => prev.filter(m => m.id !== id));
        setSuccessToast("Marked as No Show — lead moved to Follow-up Due");
        setTimeout(() => setSuccessToast(null), 4000);
        const m = meetings.find(mt => mt.id === id);
        logAudit({ action: "meeting_outcome", resourceType: "meeting", resourceId: id, resourceLabel: m?.company_name, newValue: { outcome: "no_show" }, summary: `No show — moved to Follow-up Due` });
        return;
      }
      const stageMap = { attended: "proposal_sent", no_show: "follow_up_due", cancelled: "follow_back" };
      const { error } = await supabase.from("leads").update(leadStageUpdate(stageMap[action], { last_outcome: action }) as any).eq("id", id);
      if (error) { setActionError(error.message); return; }
      setMeetings(prev => prev.filter(m => m.id !== id));
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
      const result = await rescheduleMeeting({ leadId: id, newStartIso: rescheduleDate });
      if (!result.ok) { setActionError(result.error || "Reschedule failed"); return; }
      const m = meetings.find(mt => mt.id === id);
      logAudit({ action: "update", resourceType: "meeting", resourceId: id, resourceLabel: m?.company_name, oldValue: { follow_up_date: m?.follow_up_date }, newValue: { follow_up_date: rescheduleDate }, summary: `Meeting rescheduled to ${new Date(rescheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` });
      setMeetings(prev => prev.map(mt => mt.id === id ? { ...mt, follow_up_date: rescheduleDate, meeting_link: result.meetLink || mt.meeting_link } : mt));
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
    <div className="min-h-full bg-canvas p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Success Toast ── */}
        {successToast && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
            {successToast}
          </div>
        )}

        <PageHeader
          title="Booked Meetings"
          subtitle={`${meetings.length} meeting${meetings.length !== 1 ? "s" : ""} scheduled`}
          actions={
            <>
              {notifSupported && (
                <button
                  onClick={requestNotifPermission}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    notifPermission === "granted"
                      ? "border-brand-line bg-brand-soft text-brand-deep"
                      : "border-line-strong bg-surface text-slate-500 hover:bg-slate-50"
                  }`}
                  title="Enable meeting reminders"
                >
                  {notifPermission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  {notifPermission === "granted" ? "Reminders on" : "Enable reminders"}
                </button>
              )}
              <Link href="/admin/outreach" className={buttonVariants({ variant: "secondary" })}>
                Outreach <ChevronRight className="h-4 w-4" />
              </Link>
            </>
          }
        />

        {/* Analytics bar */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {([
            ["overdue",  Flame,     "text-danger",     counts.overdue,  "Overdue"],
            ["today",    Calendar,  "text-brand-deep", counts.today,    "Today"],
            ["upcoming", Clock,     "text-info",       counts.upcoming, "Upcoming"],
            ["all",      BarChart2, "text-slate-500",  meetings.length, "Total"],
          ] as const).map(([key, Icon, color, count, label]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key as any)}
              className={`rounded-xl border p-4 text-left transition-all ${
                filter === key
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              <Icon className={`mb-2 h-4 w-4 ${filter === key ? "text-white" : color}`} />
              <p className={`font-display text-2xl font-semibold tabular-nums ${filter === key ? "text-white" : "text-slate-900"}`}>{count}</p>
              <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${filter === key ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* Notification banner */}
        {notifPermission === "default" && notifSupported && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 shrink-0 text-warn" />
              <p className="text-sm font-medium text-warn">Enable browser notifications to get 15-min &amp; 1-hour reminders before each meeting.</p>
            </div>
            <button onClick={requestNotifPermission} className={buttonVariants({ variant: "primary", size: "sm" })}>
              Enable
            </button>
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {actionError}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface py-20 text-slate-400">
            <CalendarX className="mb-3 h-10 w-10 opacity-40" />
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
              <div key={m.id} className={`overflow-hidden rounded-xl border ${cfg.border} ${cfg.bg}`}>

                {/* ── Card Header ── */}
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                      <Badge tone={cfg.tone} size="sm">{cfg.label} · {getCountdown(m.follow_up_date)}</Badge>
                      {status === "today" && (
                        <Badge tone="brand" size="sm">Live today</Badge>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-tight text-slate-900">{m.company_name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {m.contact_person && <span className="flex items-center gap-1"><User className="h-3 w-3" />{m.contact_person}</span>}
                      {m.industry && <span className="flex items-center gap-1"><Building className="h-3 w-3" />{m.industry}</span>}
                      {m.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.city}</span>}
                    </div>
                  </div>
                  <Badge tone="neutral" variant="outline" size="sm">Script {scriptType}</Badge>
                </div>

                {/* ── Date/Time + Call button ── */}
                <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">{formatDate(m.follow_up_date)}</span>
                    <span className="text-sm text-slate-400">{formatTime(m.follow_up_date)}</span>
                  </div>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className={buttonVariants({ variant: "primary" })}>
                      <Phone className="h-4 w-4" />{m.phone}
                    </a>
                  )}
                </div>

                {/* ── Meeting Link ── */}
                <div className="px-5 pb-3">
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Link2 className="h-3 w-3" /> Meeting link
                    </p>
                    {isEditingLink ? (
                      <div className="flex gap-2">
                        <input
                          value={linkDraft}
                          onChange={(e) => setLinkDraft(e.target.value)}
                          placeholder="https://meet.google.com/... or https://zoom.us/..."
                          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring"
                        />
                        <button onClick={() => saveMeetingLink(m.id)} className={buttonVariants({ variant: "primary", size: "icon" })}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setEditingLink(null); setLinkDraft(""); }} className={buttonVariants({ variant: "secondary", size: "icon" })}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : m.meeting_link ? (
                      <div className="flex items-center gap-2">
                        <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-info hover:underline">
                          {m.meeting_link}
                        </a>
                        <button onClick={() => copyLink(m.id, m.meeting_link!)} className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${copiedId === m.id ? "border-brand-line bg-brand-soft text-brand-deep" : "border-line text-slate-500 hover:text-slate-700"}`} title="Copy link">
                          {copiedId === m.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                        </button>
                        <button onClick={() => { setEditingLink(m.id); setLinkDraft(m.meeting_link!); }} className="shrink-0 rounded-lg border border-line p-1.5 text-slate-400 transition-colors hover:text-slate-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingLink(m.id); setLinkDraft("https://meet.google.com/"); }}
                        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2 text-sm text-slate-400 transition-colors hover:border-brand hover:text-brand-deep"
                      >
                        <Link2 className="h-4 w-4" /> Add Google Meet / Zoom link
                      </button>
                    )}
                  </div>
                </div>

                {/* ── WhatsApp Templates ── */}
                {m.phone && (
                  <div className="px-5 pb-3">
                    <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
                      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <MessageCircle className="h-3 w-3" /> Send via WhatsApp
                      </p>
                      {!m.meeting_link && (
                        <div className="flex items-center gap-2 rounded-lg border border-warn-line bg-warn-soft px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn" />
                          <p className="text-xs text-warn">Add a meeting link above — it will be included in all messages.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {(["confirmation", "reminder_1h", "reminder_15"] as const).map((type) => {
                          const labels = { confirmation: "Confirmation", reminder_1h: "1h Reminder", reminder_15: "15-min Reminder" };
                          const icons = { confirmation: Calendar, reminder_1h: Clock, reminder_15: Bell };
                          const colors = {
                            confirmation: "border-brand-line bg-brand-soft text-brand-deep hover:bg-brand-100",
                            reminder_1h: "border-info-line bg-info-soft text-info hover:bg-blue-100",
                            reminder_15: "border-warn-line bg-warn-soft text-warn hover:bg-amber-100",
                          };
                          const Icon = icons[type];
                          const isOpen = previewMsg?.id === m.id && previewMsg?.type === type;
                          return (
                            <button
                              key={type}
                              onClick={() => setPreviewMsg(isOpen ? null : { id: m.id, type })}
                              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors ${colors[type]} ${isOpen ? "ring-2 ring-current ring-offset-1" : ""}`}
                            >
                              <Icon className="h-4 w-4" />
                              {labels[type]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Message preview — styled like a WhatsApp thread */}
                      {previewMsg?.id === m.id && (
                        <div className="space-y-3 rounded-lg bg-slate-900 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Message preview</p>
                          <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/30 p-3">
                            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-emerald-100">
                              {buildMsg(m, previewMsg.type)}
                            </pre>
                          </div>
                          <a
                            href={`https://wa.me/${m.phone!.replace(/\D/g,"")}?text=${encodeURIComponent(buildMsg(m, previewMsg.type))}`}
                            target="_blank" rel="noreferrer"
                            onClick={() => setPreviewMsg(null)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                          >
                            <MessageCircle className="h-4 w-4" /> Open in WhatsApp &amp; send
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
                    className="flex w-full items-center justify-between rounded-lg border border-brand-line bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-100"
                  >
                    <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Pre-meeting intel &amp; talking points</span>
                    {isIntelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isIntelOpen && (
                    <div className="mt-2 space-y-3 rounded-lg border border-line bg-surface p-4">
                      {/* Script type */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Script type</span>
                        <span className="text-xs font-semibold text-slate-700">{scriptInfo.label} — {scriptInfo.desc}</span>
                      </div>

                      {/* Online presence */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-lg border p-2.5 ${m.has_website ? "border-info-line bg-info-soft" : "border-line bg-slate-50"}`}>
                          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Website</p>
                          {m.has_website && m.website_link ? (
                            <a href={m.website_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-info hover:underline">
                              <Globe className="h-3 w-3" /> View website
                            </a>
                          ) : m.has_website ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-info"><Globe className="h-3 w-3" /> Has website</span>
                          ) : (
                            <span className="text-xs text-slate-500">No website</span>
                          )}
                        </div>
                        <div className={`rounded-lg border p-2.5 ${m.gmb_link ? "border-brand-line bg-brand-soft" : "border-line bg-slate-50"}`}>
                          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">GMB / Maps</p>
                          {m.gmb_link ? (
                            <a href={m.gmb_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand-deep hover:underline">
                              <Search className="h-3 w-3" /> View on Maps
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">No GMB</span>
                          )}
                        </div>
                        <div className={`rounded-lg border p-2.5 ${m.serp_ranked ? "border-brand-line bg-brand-soft" : "border-danger-line bg-danger-soft"}`}>
                          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Google ranking</p>
                          <span className={`text-xs font-semibold ${m.serp_ranked ? "text-brand-deep" : "text-danger"}`}>
                            {m.serp_ranked ? "Ranking" : "Not ranking"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-warn-line bg-warn-soft p-2.5">
                          <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Last outcome</p>
                          <span className="text-xs font-semibold text-warn">{m.last_outcome?.replace(/_/g, " ") || "First contact"}</span>
                        </div>
                      </div>

                      {/* Talking point */}
                      <div className="rounded-lg border border-brand-line bg-brand-soft p-3">
                        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-deep">
                          <Lightbulb className="h-3 w-3" /> Opening strategy
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700">{scriptInfo.tip}</p>
                      </div>

                      {/* Prep checklist */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pre-call checklist</p>
                        {([
                          ["Review their Google listing", m.gmb_link ? "done" : "pending"],
                          ["Check their website", m.has_website ? "done" : "skip"],
                          ["Know their niche + city combo", m.industry && m.city ? "done" : "pending"],
                          ["Meeting link sent on WhatsApp", m.meeting_link ? "done" : "pending"],
                          ["Confirmation message sent", "pending"],
                        ] as const).map(([item, state]) => (
                          <div key={item} className="flex items-center gap-2 text-xs">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${state === "done" ? "bg-brand" : state === "skip" ? "bg-slate-300" : "bg-warn"}`}>
                              {state === "done" ? <Check className="h-2.5 w-2.5" /> : state === "skip" ? <Minus className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
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
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <FileText className="h-3 w-3" /> Meeting notes
                      </p>
                      {!isEditingNotes ? (
                        <button
                          onClick={() => {
                            setNotesDraft(prev => ({ ...prev, [m.id]: m.meeting_notes || "" }));
                            setEditingNotes(prev => new Set(prev).add(m.id));
                          }}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700"
                        >
                          <Pencil className="h-3 w-3" /> {m.meeting_notes ? "Edit" : "Add notes"}
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => saveMeetingNotes(m.id)} className="flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:text-brand-deeper">
                            <Check className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={() => setEditingNotes(prev => { const n = new Set(prev); n.delete(m.id); return n; })}
                            className="ml-2 text-[11px] text-slate-400 hover:text-slate-600"
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
                        className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring"
                      />
                    ) : m.meeting_notes ? (
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{m.meeting_notes}</p>
                    ) : (
                      <p className="text-xs italic text-slate-400">No notes yet — add key points during or after the call</p>
                    )}
                  </div>
                </div>

                {/* ── Post-meeting outcome panel ── */}
                {isPostMeeting && (
                  <div className="px-5 pb-3">
                    <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                      <p className="text-sm font-semibold text-slate-800">What was the outcome?</p>

                      {/* Outcome selector */}
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "interested",    label: "Interested",        sub: "Ready for proposal", icon: CheckCircle2, active: "bg-brand-deep border-brand-deep text-white", inactive: "border-line text-slate-600 hover:border-brand" },
                          { key: "thinking",      label: "Thinking About It", sub: "Needs more time",     icon: HelpCircle,   active: "bg-warn border-warn text-white",            inactive: "border-line text-slate-600 hover:border-warn-line" },
                          { key: "not_interested",label: "Not Interested",    sub: "Doesn't want it",    icon: ThumbsDown,   active: "bg-danger border-danger text-white",        inactive: "border-line text-slate-600 hover:border-danger-line" },
                        ] as const).map(({ key, label, sub, icon: Icon, active, inactive }) => (
                          <button
                            key={key}
                            onClick={() => setPostMeetingOutcome(key)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-colors ${postMeetingOutcome === key ? active : inactive}`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-center leading-tight">{label}</span>
                            <span className={`text-[11px] font-normal ${postMeetingOutcome === key ? "opacity-80" : "text-slate-400"}`}>{sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* Follow-up date for "thinking" */}
                      {postMeetingOutcome === "thinking" && (
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Follow-up date</label>
                          <input
                            type="datetime-local"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-warn focus:outline-none focus:ring-2 focus:ring-warn/20"
                          />
                        </div>
                      )}

                      {/* Notes */}
                      <textarea
                        value={notesDraft[m.id] ?? m.meeting_notes ?? ""}
                        onChange={(e) => setNotesDraft(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="What was discussed? Objections? Key points?"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring"
                      />

                      {/* Confirm actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmPostMeeting(m.id)}
                          disabled={!postMeetingOutcome || isPending}
                          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${
                            postMeetingOutcome === "not_interested" ? "bg-danger hover:bg-red-800" :
                            postMeetingOutcome === "thinking"       ? "bg-warn hover:bg-amber-800" :
                            "bg-brand-deep hover:bg-brand-deeper"
                          }`}
                        >
                          {isPending ? "Saving…" :
                            postMeetingOutcome === "interested"     ? "Confirm & move to proposals" :
                            postMeetingOutcome === "thinking"       ? "Save & schedule follow-up" :
                            postMeetingOutcome === "not_interested" ? "Mark as not interested" :
                            "Select an outcome above"
                          }
                        </button>
                        {postMeetingOutcome === "interested" && (
                          <Link href={`/admin/leads/${m.id}/proposal/new`} className={buttonVariants({ variant: "secondary" })}>
                            <FileText className="h-4 w-4" /> Create proposal
                          </Link>
                        )}
                      </div>
                      <button onClick={() => { setPostMeetingId(null); setPostMeetingOutcome(null); }} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Reschedule ── */}
                {isRescheduling && (
                  <div className="px-5 pb-3">
                    <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
                      <p className="text-xs font-semibold text-slate-600">New date &amp; time:</p>
                      <input
                        type="datetime-local"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReschedule(m.id)} disabled={!rescheduleDate || isPending} className="flex-1 rounded-lg bg-brand-deep py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-deeper disabled:opacity-50">
                          Confirm reschedule
                        </button>
                        <button onClick={() => { setRescheduleId(null); setRescheduleDate(""); }} className="flex-1 rounded-lg border border-line-strong py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                {!isPostMeeting && (
                  <div className="grid grid-cols-3 gap-2 px-5 pb-4">
                    <button onClick={() => handleAction(m.id, "attended")} disabled={isPending} className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-deep py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-deeper disabled:opacity-50">
                      <CheckCircle2 className="h-4 w-4" /> Attended
                    </button>
                    <button onClick={() => { setRescheduleId(isRescheduling ? null : m.id); setRescheduleDate(""); }} disabled={isPending} className="flex items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-surface py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
                      <RotateCcw className="h-4 w-4" /> Reschedule
                    </button>
                    <button onClick={() => handleAction(m.id, "no_show")} disabled={isPending} className="flex items-center justify-center gap-1.5 rounded-lg bg-danger py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> No show
                    </button>
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="flex justify-end border-t border-line px-5 py-2">
                  <Link href={`/admin/leads/${m.id}`} className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700">
                    View lead profile <ChevronRight className="h-3 w-3" />
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
