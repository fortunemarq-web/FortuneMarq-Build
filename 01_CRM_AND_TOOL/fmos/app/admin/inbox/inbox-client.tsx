"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare, Search, Bot, User, AlertTriangle, PauseCircle,
  BellOff, CircleDot, ArrowDownLeft, ArrowUpRight, Play, Pause,
  ExternalLink, X, ChevronRight, Loader2, Send,
} from "lucide-react";
import { toggleBotPaused, getTranscript, sendInboxReply, type TranscriptEntry } from "@/actions/inbox";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export interface Conversation {
  leadId: string;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  lastText: string;
  lastAt: string | null;
  lastDir: "in" | "out" | "bot";
  hasBot: boolean;
  botPaused: boolean;
  optedOut: boolean;
  escalated: boolean;
  activeInbound: boolean;
  status: "active" | "paused" | "escalated" | "opted_out" | "idle";
  messageCount: number;
  needsAttention: boolean;
}

const STATUS_META: Record<Conversation["status"], { label: string; tone: Tone; icon: typeof CircleDot }> = {
  escalated: { label: "Escalated", tone: "danger",  icon: AlertTriangle },
  active:    { label: "Active",    tone: "brand",   icon: CircleDot },
  paused:    { label: "Paused",    tone: "warning", icon: PauseCircle },
  opted_out: { label: "Opted out", tone: "neutral", icon: BellOff },
  idle:      { label: "Idle",      tone: "neutral", icon: CircleDot },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "active", label: "Active" },
  { key: "bot", label: "Bot-handled" },
  { key: "paused", label: "Human / paused" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - Date.parse(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) +
    " · " + d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function DirIcon({ dir }: { dir: Conversation["lastDir"] }) {
  if (dir === "in") return <ArrowDownLeft className="h-3 w-3 text-info" />;
  if (dir === "bot") return <Bot className="h-3 w-3 text-brand-deep" />;
  return <ArrowUpRight className="h-3 w-3 text-slate-400" />;
}

/* ── Transcript drawer ─────────────────────────────────────── */

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
  const isInbound = entry.dir === "in";
  const isBot = entry.dir === "bot";

  if (isInbound) {
    return (
      <div className="flex flex-col items-start mb-3 max-w-[80%]">
        <div className="bg-surface border border-line rounded-2xl rounded-tl-sm px-3.5 py-2 shadow-sm">
          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{entry.text}</p>
        </div>
        <span className="text-[11px] text-slate-400 mt-1 ml-1">{formatTime(entry.at)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end mb-3 ml-auto max-w-[80%]">
      <div className={`rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm ${
        isBot ? "bg-brand-deep text-white" : "bg-surface text-white"
      }`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          {isBot
            ? <Bot className="h-3 w-3 opacity-70" />
            : <User className="h-3 w-3 opacity-70" />}
          <span className="text-[11px] font-semibold opacity-70">
            {isBot ? "Bot" : "Team"}
            {entry.meta && entry.meta !== "escalated" ? ` · ${entry.meta}` : ""}
          </span>
          {entry.meta === "escalated" && (
            <span className="text-[11px] font-bold bg-danger text-white px-1.5 py-0.5 rounded-full ml-1">
              ESCALATED
            </span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{entry.text}</p>
      </div>
      <span className="text-[11px] text-slate-400 mt-1 mr-1">{formatTime(entry.at)}</span>
    </div>
  );
}

function TranscriptDrawer({
  conv,
  botPaused,
  onClose,
  setPaused,
}: {
  conv: Conversation;
  botPaused: boolean;
  onClose: () => void;
  setPaused: (paused: boolean) => void;
}) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toggling, startToggle] = useTransition();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    getTranscript(conv.leadId).then((res) => {
      if (res.ok) setEntries(res.entries ?? []);
      else setFetchError(res.error ?? "Failed to load transcript");
      setLoading(false);
    });
  }, [conv.leadId]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, entries.length]);

  function handleToggle() {
    startToggle(async () => {
      await toggleBotPaused(conv.leadId, botPaused);
      setPaused(!botPaused);
    });
  }

  async function handleSend() {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    setReplyError(null);
    const res = await sendInboxReply(conv.leadId, body);
    setSending(false);
    if (res.ok) {
      setEntries((e) => [
        ...e,
        { id: `local-${e.length}-${res.at}`, at: res.at || new Date().toISOString(), dir: "out", text: body, source: "log" },
      ]);
      setReply("");
      setPaused(true); // replying = taking over
    } else {
      setReplyError(res.error || "Failed to send.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-md bg-surface flex flex-col shadow-lg border-l border-line">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-4 border-b border-line bg-slate-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{conv.businessName}</span>
              {conv.contactName && (
                <span className="text-xs text-slate-500">· {conv.contactName}</span>
              )}
            </div>
            {conv.phone && (
              <p className="text-xs text-slate-400 mt-0.5">{conv.phone}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">
              {conv.messageCount} messages total
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              onClick={handleToggle}
              disabled={toggling}
              variant={botPaused ? "secondary" : "danger-soft"}
              size="sm"
              title={botPaused ? "Resume bot" : "Pause bot / take over"}
            >
              {toggling
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : botPaused
                  ? <Play className="h-3.5 w-3.5" />
                  : <Pause className="h-3.5 w-3.5" />}
              {botPaused ? "Resume bot" : "Take over"}
            </Button>

            <Link
              href={`/admin/leads/${conv.leadId}`}
              target="_blank"
              title="Open lead profile"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading transcript…</span>
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-danger">{fetchError}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <MessageSquare className="h-6 w-6" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <>
              {entries.map((e) => (
                <TranscriptBubble key={e.id} entry={e} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Composer — type a reply (takes over the chat, pauses the bot) */}
        <div className="border-t border-line p-3 bg-surface">
          {replyError && <p className="text-xs text-danger mb-2">{replyError}</p>}
          <div className="flex items-end gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={conv.optedOut ? "This lead opted out of WhatsApp" : "Type a reply…  (sends as your team, pauses the bot)"}
              disabled={sending || conv.optedOut}
              className="flex-1 resize-none max-h-32"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !reply.trim() || conv.optedOut}
              variant="primary"
              size="icon"
              title="Send reply"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Free-typed replies work within 24h of the customer’s last message; older chats need an approved template.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function InboxClient({ conversations }: { conversations: Conversation[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);

  // Optimistic bot_paused overrides: leadId → paused
  const [pausedOverrides, setPausedOverrides] = useState<Map<string, boolean>>(new Map());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [, startToggle] = useTransition();

  function getEffectivePaused(c: Conversation): boolean {
    return pausedOverrides.has(c.leadId) ? pausedOverrides.get(c.leadId)! : c.botPaused;
  }

  function handleInlineToggle(e: React.MouseEvent, c: Conversation) {
    e.stopPropagation();
    const current = getEffectivePaused(c);
    // Optimistic flip
    setPausedOverrides((m) => new Map(m).set(c.leadId, !current));
    setTogglingIds((s) => new Set(s).add(c.leadId));

    startToggle(async () => {
      const res = await toggleBotPaused(c.leadId, current);
      if (!res.ok) {
        // Revert on failure
        setPausedOverrides((m) => new Map(m).set(c.leadId, current));
      } else {
        setPausedOverrides((m) => new Map(m).set(c.leadId, res.paused));
      }
      setTogglingIds((s) => { const n = new Set(s); n.delete(c.leadId); return n; });
    });
  }

  const counts = useMemo(() => ({
    all: conversations.length,
    attention: conversations.filter((c) => c.needsAttention).length,
    active: conversations.filter((c) => c.status === "active").length,
    bot: conversations.filter((c) => c.hasBot && !getEffectivePaused(c)).length,
    paused: conversations.filter((c) => getEffectivePaused(c)).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [conversations, pausedOverrides]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "attention" && !c.needsAttention) return false;
      if (filter === "active" && c.status !== "active") return false;
      if (filter === "bot" && !(c.hasBot && !getEffectivePaused(c))) return false;
      if (filter === "paused" && !getEffectivePaused(c)) return false;
      if (q && !(`${c.businessName} ${c.contactName ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, filter, query, pausedOverrides]);

  const selectedPaused = selected ? getEffectivePaused(selected) : false;

  return (
    <>
      <div className="min-h-full bg-canvas px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          {/* Header */}
          <PageHeader
            title="WhatsApp Inbox"
            subtitle="Every conversation across the bot and your team — escalations and active threads first."
          />

          {/* Filters + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                    filter === f.key
                      ? "bg-brand-deep text-white border-brand-deep"
                      : "bg-surface text-slate-600 border-line hover:border-line-strong"
                  )}
                >
                  {f.label}
                  <span className={cn("ml-1.5 tabular-nums", filter === f.key ? "text-white/70" : "text-slate-400")}>
                    {counts[f.key as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>
            <div className="sm:ml-auto relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search business, contact, phone"
                className="pl-9 sm:w-64"
              />
            </div>
          </div>

          {/* List */}
          {rows.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations"
              description={
                conversations.length === 0
                  ? "WhatsApp conversations will appear here as messages come in."
                  : "Nothing matches this filter."
              }
            />
          ) : (
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {rows.map((c) => {
                const paused = getEffectivePaused(c);
                const toggling = togglingIds.has(c.leadId);
                const st = STATUS_META[paused && c.status !== "opted_out" ? "paused" : c.status];
                const StIcon = st.icon;
                const isSelected = selected?.leadId === c.leadId;

                return (
                  <div
                    key={c.leadId}
                    onClick={() => setSelected(c)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors",
                      isSelected
                        ? "bg-slate-100"
                        : c.needsAttention
                          ? "bg-warn-soft/40 hover:bg-warn-soft/70"
                          : "hover:bg-slate-50/70"
                    )}
                  >
                    {/* Bot vs human avatar */}
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                        paused || !c.hasBot ? "bg-slate-100 text-slate-500" : "bg-brand-soft text-brand-deep"
                      )}
                      title={paused ? "Human (bot paused)" : c.hasBot ? "Bot-handled" : "Human"}
                    >
                      {paused || !c.hasBot ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Name + last message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{c.businessName}</span>
                        {c.contactName && (
                          <span className="text-xs text-slate-400 truncate">· {c.contactName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 min-w-0">
                        <DirIcon dir={c.lastDir} />
                        <span className="truncate">{c.lastText || "—"}</span>
                      </div>
                    </div>

                    {/* Status + time + actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge tone={st.tone} size="sm">
                        <StIcon className="h-3 w-3" />
                        {st.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{timeAgo(c.lastAt)}</span>

                        {/* Inline toggle */}
                        <button
                          onClick={(e) => handleInlineToggle(e, c)}
                          disabled={toggling || c.optedOut}
                          title={paused ? "Resume bot" : "Take over (pause bot)"}
                          className={cn(
                            "p-1 rounded-md transition-colors disabled:opacity-40",
                            paused
                              ? "text-warn hover:bg-warn-soft"
                              : "text-brand-deep hover:bg-brand-soft"
                          )}
                        >
                          {toggling
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : paused
                              ? <Play className="h-3.5 w-3.5" />
                              : <Pause className="h-3.5 w-3.5" />}
                        </button>

                        {/* Profile link */}
                        <Link
                          href={`/admin/leads/${c.leadId}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Open lead profile"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>

      {/* Transcript drawer */}
      {selected && (
        <TranscriptDrawer
          conv={selected}
          botPaused={selectedPaused}
          onClose={() => setSelected(null)}
          setPaused={(p) => setPausedOverrides((m) => new Map(m).set(selected.leadId, p))}
        />
      )}
    </>
  );
}
