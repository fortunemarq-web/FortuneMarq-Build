"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Search, Bot, User, AlertTriangle, PauseCircle,
  BellOff, CircleDot, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";

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

const STATUS_META: Record<Conversation["status"], { label: string; cls: string; icon: typeof CircleDot }> = {
  escalated: { label: "Escalated", cls: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CircleDot },
  paused:    { label: "Paused",    cls: "bg-amber-50 text-amber-700 border-amber-200", icon: PauseCircle },
  opted_out: { label: "Opted out", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: BellOff },
  idle:      { label: "Idle",      cls: "bg-slate-50 text-slate-500 border-slate-200", icon: CircleDot },
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

function DirIcon({ dir }: { dir: Conversation["lastDir"] }) {
  if (dir === "in") return <ArrowDownLeft className="h-3 w-3 text-blue-500" />;
  if (dir === "bot") return <Bot className="h-3 w-3 text-[#1E7A4F]" />;
  return <ArrowUpRight className="h-3 w-3 text-slate-400" />;
}

export default function InboxClient({ conversations }: { conversations: Conversation[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    all: conversations.length,
    attention: conversations.filter((c) => c.needsAttention).length,
    active: conversations.filter((c) => c.status === "active").length,
    bot: conversations.filter((c) => c.hasBot && !c.botPaused).length,
    paused: conversations.filter((c) => c.botPaused).length,
  }), [conversations]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "attention" && !c.needsAttention) return false;
      if (filter === "active" && c.status !== "active") return false;
      if (filter === "bot" && !(c.hasBot && !c.botPaused)) return false;
      if (filter === "paused" && !c.botPaused) return false;
      if (q && !(`${c.businessName} ${c.contactName ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [conversations, filter, query]);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare className="h-6 w-6 text-[#1E7A4F]" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">WhatsApp Inbox</h1>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Every conversation across the bot and your team — escalations and active threads first.
        </p>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  filter === f.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f.label}
                <span className={`ml-1.5 ${filter === f.key ? "text-slate-300" : "text-slate-400"}`}>
                  {counts[f.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
          <div className="sm:ml-auto relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search business, contact, phone"
              className="text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
            />
          </div>
        </div>

        {/* List */}
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No conversations</p>
            <p className="text-xs text-slate-400 mt-1">
              {conversations.length === 0
                ? "WhatsApp conversations will appear here as messages come in."
                : "Nothing matches this filter."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {rows.map((c) => {
              const st = STATUS_META[c.status];
              const StIcon = st.icon;
              return (
                <div
                  key={c.leadId}
                  className={`flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50/70 transition-colors ${
                    c.needsAttention ? "bg-amber-50/30" : ""
                  }`}
                >
                  {/* Bot vs human avatar */}
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      c.botPaused || !c.hasBot ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-[#1E7A4F]"
                    }`}
                    title={c.botPaused ? "Human (bot paused)" : c.hasBot ? "Bot-handled" : "Human"}
                  >
                    {c.botPaused || !c.hasBot ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Name + last message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{c.businessName}</span>
                      {c.contactName && <span className="text-xs text-slate-400 truncate">· {c.contactName}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 min-w-0">
                      <DirIcon dir={c.lastDir} />
                      <span className="truncate">{c.lastText || "—"}</span>
                    </div>
                  </div>

                  {/* Status + time */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded-full border px-2 py-0.5 ${st.cls}`}>
                      <StIcon className="h-3 w-3" />
                      {st.label}
                    </span>
                    <span className="text-[11px] text-slate-400">{timeAgo(c.lastAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
