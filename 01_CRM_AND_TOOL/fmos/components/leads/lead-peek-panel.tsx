"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X, Phone, MessageCircle, ExternalLink, MapPin, Building,
  Globe, Star, Calendar, ArrowUpRight, Loader2,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase";
import { leadStageUpdate, PIPELINE_STAGES, STAGE_LABELS, getStage } from "@/lib/pipeline";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";

interface LeadPeekPanelProps {
  lead: any;
  onClose: () => void;
  /** Called with the patched lead after a successful mutation. */
  onUpdated?: (patch: Partial<any> & { id: string }) => void;
}

/**
 * ClickUp-style slide-over preview for a lead. Quick context + stage
 * change without leaving the list. "Open profile" goes to the full page.
 */
export default function LeadPeekPanel({ lead, onClose, onUpdated }: LeadPeekPanelProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [team, setTeam] = useState<Array<{ id: string; full_name: string | null }>>([]);

  // Load assignable team members once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "telecaller", "strategist"])
        .order("full_name");
      if (!cancelled && data) setTeam(data as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeAssignee(userId: string) {
    setAssigning(true);
    const { error } = await supabase
      .from("leads")
      .update({ assigned_sales_exec: userId || null } as any)
      .eq("id", lead.id);
    setAssigning(false);
    if (error) {
      toast.error("Could not assign lead", error.message);
      return;
    }
    const name = team.find(t => t.id === userId)?.full_name;
    toast.success(userId ? `Assigned to ${name || "team member"}` : "Unassigned");
    logAudit({ action: "update", resourceType: "lead", resourceId: lead.id, resourceLabel: lead.company_name, newValue: { assigned_sales_exec: userId || null }, summary: `Lead ${userId ? `assigned to ${name}` : "unassigned"}` });
    onUpdated?.({ id: lead.id, assigned_sales_exec: userId || null });
  }

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!lead) return null;

  const stage = getStage(lead.outreach_stage);

  async function changeStage(newStage: string) {
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update(leadStageUpdate(newStage) as any)
      .eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast.error("Stage change failed", error.message);
      return;
    }
    toast.success("Stage updated", STAGE_LABELS[newStage] || newStage);
    logAudit({ action: "stage_change", resourceType: "lead", resourceId: lead.id, resourceLabel: lead.company_name, oldValue: { stage: lead.outreach_stage }, newValue: { stage: newStage }, summary: `Stage changed from peek panel: ${lead.outreach_stage} → ${newStage}` });
    onUpdated?.({ id: lead.id, outreach_stage: newStage });
  }

  const infoRows: Array<{ icon: React.ElementType; label: string; value: React.ReactNode }> = [
    { icon: Building, label: "Industry", value: lead.industry || "—" },
    { icon: MapPin, label: "City", value: lead.city || "—" },
    {
      icon: Globe,
      label: "Website",
      value: lead.website_link ? (
        <a href={lead.website_link} target="_blank" rel="noreferrer" className="text-brand-deep hover:underline inline-flex items-center gap-1">
          Visit <ExternalLink className="h-3 w-3" />
        </a>
      ) : (lead.has_website ? "Yes" : "No"),
    },
    {
      icon: Star,
      label: "GMB",
      value: lead.gmb_link ? (
        <a href={lead.gmb_link} target="_blank" rel="noreferrer" className="text-brand-deep hover:underline inline-flex items-center gap-1">
          Open <ExternalLink className="h-3 w-3" />
        </a>
      ) : "—",
    },
    {
      icon: Calendar,
      label: "Follow-up",
      value: lead.follow_up_date
        ? new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "—",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-surface border-l border-slate-200 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lead</p>
            <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{lead.company_name}</h2>
            {lead.contact_person && (
              <p className="text-xs text-slate-500 mt-0.5">{lead.contact_person}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Stage */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Pipeline Stage
            </label>
            <div className="flex items-center gap-2">
              <select
                value={lead.outreach_stage || "touch1_pending"}
                onChange={(e) => changeStage(e.target.value)}
                disabled={saving}
                className={clsx(
                  "flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer",
                  stage ? stage.badge : "bg-slate-100 text-slate-700 border-slate-200"
                )}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Assigned To
            </label>
            <div className="flex items-center gap-2">
              <select
                value={lead.assigned_sales_exec || ""}
                onChange={(e) => changeAssignee(e.target.value)}
                disabled={assigning}
                className="flex-1 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {team.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name || "Unnamed"}</option>
                ))}
              </select>
              {assigning && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            {lead.phone ? (
              <>
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-deep px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/91${String(lead.phone).replace(/\D/g, "").slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </>
            ) : (
              <p className="col-span-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
                No phone number on this lead
              </p>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl border border-slate-100 divide-y divide-slate-50">
            {lead.phone && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Phone className="h-3.5 w-3.5" /> Phone</span>
                <span className="text-[13px] font-medium text-slate-800 font-mono">{lead.phone}</span>
              </div>
            )}
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5" /> {label}</span>
                <span className="text-[13px] font-medium text-slate-800 text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Notes</label>
              <p className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#141613] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.06]"
          >
            Open full profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
