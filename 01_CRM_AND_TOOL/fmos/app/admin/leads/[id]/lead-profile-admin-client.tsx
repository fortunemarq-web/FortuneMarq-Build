"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, MessageCircle, FileText, Calendar,
  Clock, User, MapPin, Building, Globe, Edit3,
  CheckCircle, XCircle, AlertOctagon, RefreshCw,
  ChevronDown, ChevronUp, Plus, Send, Copy, Loader2,
  FileSignature, Trash2
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { generateClientOnboarding } from "@/lib/onboarding/generateClientOnboarding";
import { calculatePackageTier } from "@/lib/performance";
import { logAudit } from "@/lib/audit";
import { toast as notify } from "@/components/ui/toast";
import { leadStageUpdate, STAGE_LABELS, PIPELINE_STAGES } from "@/lib/pipeline";
import { deleteSingleLead } from "@/actions/delete-data";
import { fireTrigger } from "@/actions/automations";
import ActivityTimeline from "@/components/ActivityTimeline";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────
interface Lead { [key: string]: any; }
interface OutreachLog { id: string; created_at: string; touch_type: string; outcome: string | null; note: string | null; pdf_name: string | null; actor?: { full_name: string } | null; }
interface Proposal { id: string; sent_at: string | null; amount: number | null; status: string | null; services?: any; }
interface Agreement { id: string; created_at: string; status: string | null; start_date: string | null; proposal_id?: string | null; }

interface Props {
  lead: Lead;
  outreachLogs: OutreachLog[];
  proposals: Proposal[];
  agreements: Agreement[];
  marketInsight: any;
  whatsappTemplates: any[];
  isAdmin: boolean;
  userId: string | null;
}

// Stage → one of the five tones, sourced from the shared state machine
// (each PIPELINE_STAGES entry already carries a canonical tone).
const STAGE_TONES: Record<string, Tone> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.key, (s.tone as Tone) || "neutral"])
);

// Touch type → label + icon. Icon colour collapses to the five tones.
const TOUCH_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; tone: Tone }> = {
  call: { label: "Call Made", icon: Phone, tone: "info" },
  whatsapp_sent: { label: "WhatsApp Sent", icon: MessageCircle, tone: "brand" },
  whatsapp_curiosity: { label: "WhatsApp Curiosity Sent", icon: MessageCircle, tone: "brand" },
  whatsapp_template: { label: "WhatsApp Template Sent", icon: MessageCircle, tone: "brand" },
  pdf_sent: { label: "PDF Sent", icon: FileText, tone: "info" },
  follow_up: { label: "Follow-up", icon: Clock, tone: "warning" },
  meeting_booked: { label: "Meeting Booked", icon: Calendar, tone: "brand" },
  proposal_sent: { label: "Proposal Sent", icon: FileText, tone: "brand" },
  note: { label: "Note", icon: Edit3, tone: "neutral" },
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-slate-500",
  brand: "text-brand-deep",
  info: "text-info",
  warning: "text-warn",
  danger: "text-danger",
};

// Outcome → tone (positive=brand · negative=danger · neutral=slate · waiting=warning)
const OUTCOME_TONES: Record<string, Tone> = {
  INTERESTED_BOOK_NOW: "brand",
  INTERESTED_FOLLOW_UP_LATER: "brand",
  INTERESTED_SEND_INFO: "info",
  NOT_INTERESTED: "danger",
  FOLLOW_BACK: "warning",
  WRONG_NUMBER: "neutral",
  NO_ANSWER: "neutral",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function LeadProfileAdminClient({ lead, outreachLogs, proposals, agreements, marketInsight, whatsappTemplates, isAdmin, userId }: Props) {
  const [currentLead, setCurrentLead] = useState(lead);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showConfirmDead, setShowConfirmDead] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [team, setTeam] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [assigning, setAssigning] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [confirmingProposalId, setConfirmingProposalId] = useState<string | null>(null);
  const [confirmStartDate, setConfirmStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const supabase = createClient();

  const router = useRouter();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function updateField(field: string, value: string) {
    const oldValue = currentLead[field];
    setCurrentLead((prev: any) => ({ ...prev, [field]: value }));
    const { error } = await supabase.from("leads").update({ [field]: value } as any).eq("id", lead.id);
    if (error) {
      setCurrentLead((prev: any) => ({ ...prev, [field]: oldValue }));
      showToast(`Save failed: ${error.message}`);
      return;
    }
    logAudit({ action: "update", resourceType: "lead", resourceId: lead.id, resourceLabel: currentLead.company_name, oldValue: { [field]: oldValue }, newValue: { [field]: value }, summary: `Updated ${field}: "${oldValue}" → "${value}"` });
  }

  function startEdit(field: string) {
    setEditingField(field);
    setEditDraft(String(currentLead[field] ?? ""));
  }

  async function commitEdit(field: string) {
    const current = String(currentLead[field] ?? "");
    if (editDraft !== current) await updateField(field, editDraft);
    setEditingField(null);
  }

  function cancelEdit() { setEditingField(null); setEditDraft(""); }

  async function toggleBoolean(field: string) {
    const oldVal = currentLead[field];
    const newVal = !oldVal;
    setCurrentLead((prev: any) => ({ ...prev, [field]: newVal }));
    const { error } = await supabase.from("leads").update({ [field]: newVal } as any).eq("id", lead.id);
    if (error) {
      setCurrentLead((prev: any) => ({ ...prev, [field]: oldVal }));
      showToast(`Save failed: ${error.message}`);
      return;
    }
    logAudit({ action: "update", resourceType: "lead", resourceId: lead.id, resourceLabel: currentLead.company_name, oldValue: { [field]: oldVal }, newValue: { [field]: newVal }, summary: `Toggled ${field}: ${oldVal} → ${newVal}` });
  }

  async function changeStage(newStage: string) {
    const oldStage = currentLead.outreach_stage;
    setCurrentLead((prev: any) => ({ ...prev, outreach_stage: newStage }));
    const { error } = await supabase.from("leads").update(leadStageUpdate(newStage) as any).eq("id", lead.id);
    if (error) {
      setCurrentLead((prev: any) => ({ ...prev, outreach_stage: oldStage }));
      showToast(`Stage change failed: ${error.message}`);
      return;
    }
    logAudit({ action: "stage_change", resourceType: "lead", resourceId: lead.id, resourceLabel: currentLead.company_name, oldValue: { stage: oldStage }, newValue: { stage: newStage }, summary: `Stage manually changed: ${oldStage} → ${newStage}` });
    showToast(`Stage updated to ${STAGE_LABELS[newStage] || newStage}`);
  }

  async function markAsDead() {
    const oldStage = currentLead.outreach_stage;
    setCurrentLead((prev: any) => ({ ...prev, outreach_stage: "dead" }));
    const { error } = await supabase.from("leads").update(leadStageUpdate("dead") as any).eq("id", lead.id);
    if (error) {
      setCurrentLead((prev: any) => ({ ...prev, outreach_stage: oldStage }));
      showToast(`Could not mark as dead: ${error.message}`);
      return;
    }
    setShowConfirmDead(false);
    showToast("Lead marked as dead. You can move it to Revival anytime.");
    logAudit({ action: "stage_change", resourceType: "lead", resourceId: lead.id, resourceLabel: lead.company_name, oldValue: { stage: oldStage }, newValue: { stage: "dead" }, summary: `Lead marked as dead` });
  }

  async function moveToRevival() {
    const oldStage = currentLead.outreach_stage;
    setCurrentLead((prev: any) => ({ ...prev, outreach_stage: "revival" }));
    const { error } = await supabase.from("leads").update(leadStageUpdate("revival") as any).eq("id", lead.id);
    if (error) {
      setCurrentLead((prev: any) => ({ ...prev, outreach_stage: oldStage }));
      showToast(`Could not move to revival: ${error.message}`);
      return;
    }
    showToast("Lead moved to Revival — pick up the outreach again.");
    logAudit({ action: "stage_change", resourceType: "lead", resourceId: lead.id, resourceLabel: lead.company_name, oldValue: { stage: oldStage }, newValue: { stage: "revival" }, summary: `Moved to Revival` });
  }

  // Assignable team members (for the Assigned To dropdown)
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

  async function changeAssignee(newAssignee: string) {
    setAssigning(true);
    const { error } = await supabase
      .from("leads")
      .update({ assigned_sales_exec: newAssignee || null } as any)
      .eq("id", lead.id);
    setAssigning(false);
    if (error) {
      showToast(`Could not assign: ${error.message}`);
      return;
    }
    setCurrentLead((prev: any) => ({ ...prev, assigned_sales_exec: newAssignee || null }));
    const name = team.find(t => t.id === newAssignee)?.full_name;
    showToast(newAssignee ? `Assigned to ${name || "team member"}` : "Lead unassigned");
    logAudit({ action: "update", resourceType: "lead", resourceId: lead.id, resourceLabel: currentLead.company_name, newValue: { assigned_sales_exec: newAssignee || null }, summary: `Lead ${newAssignee ? `assigned to ${name}` : "unassigned"}` });
  }

  async function deleteLead() {
    setDeleteLoading(true);
    const res = await deleteSingleLead(lead.id);
    setDeleteLoading(false);
    if (!res.success) {
      showToast(`Delete failed: ${res.message}`);
      return;
    }
    notify.success("Lead deleted", currentLead.company_name);
    router.push("/admin/sales/leads");
  }

  async function confirmProposal(proposal: any) {
    if (!confirmChecked) return;
    setConfirmError(null);
    setConfirmLoading(true);
    try {
      // 1. Generate agreement number
      const { count } = await supabase
        .from("agreements")
        .select("id", { count: "exact", head: true });
      const agreementNumber = `AGR-2026-${String((count || 0) + 1).padStart(3, "0")}`;

      // 2. Save agreement record
      const { data: agr, error: agrErr } = await supabase
        .from("agreements")
        .insert({
          lead_id: lead.id,
          proposal_id: proposal.id,
          agreement_number: agreementNumber,
          proposal_ref: proposal.proposal_number,
          services: proposal.services,
          total_setup: proposal.total_setup,
          total_monthly: proposal.total_monthly,
          start_date: confirmStartDate || null,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          created_by: userId,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (agrErr) { setConfirmError(agrErr.message); setConfirmLoading(false); return; }

      // 3. Mark proposal confirmed
      const { error: propErr } = await supabase.from("proposals").update({ status: "confirmed" } as any).eq("id", proposal.id);
      if (propErr) { setConfirmError(`Agreement saved, but proposal update failed: ${propErr.message}`); setConfirmLoading(false); return; }

      // 4. Mark lead won
      const { error: wonErr } = await supabase.from("leads").update(leadStageUpdate("won") as any).eq("id", lead.id);
      if (wonErr) { setConfirmError(`Proposal confirmed, but lead stage update failed: ${wonErr.message}`); setConfirmLoading(false); return; }
      void fireTrigger("lead_won", "lead", lead.id);

      // 5. Create or find client
      const { data: existing } = await supabase
        .from("clients").select("id").eq("business_name", lead.company_name).maybeSingle();
      let clientId = existing?.id;

      if (!clientId) {
        const serviceIds = (proposal.services || []).map((s: any) => s.id);
        const monthlyVal = proposal.total_monthly ?? 0;
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({
            business_name: lead.company_name,
            owner_name: lead.contact_person,
            city: lead.city,
            niche: lead.industry,
            status: "onboarding",
            onboarding_completed: false,
            package_tier: calculatePackageTier(monthlyVal),
            services_active: serviceIds as any,
            monthly_value: monthlyVal,
            start_date: confirmStartDate || new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (clientErr || !newClient?.id) {
          setConfirmError(`Deal won, but client creation failed: ${clientErr?.message ?? "no row returned"}. Create the client manually from /admin/clients.`);
          setConfirmLoading(false);
          return;
        }
        clientId = newClient.id;
        await generateClientOnboarding(supabase, clientId, serviceIds);
      }

      logAudit({ action: "proposal_confirmed", resourceType: "proposal", resourceId: proposal.id, resourceLabel: `${proposal.proposal_number} — ${lead.company_name}`, newValue: { agreement_number: agreementNumber, client_id: clientId }, summary: `Proposal confirmed → agreement ${agreementNumber} created, client onboarding started` });
      if (clientId) router.push(`/admin/clients/${clientId}?tab=onboarding`);
    } catch (e: any) {
      setConfirmError(e.message || "Something went wrong");
    } finally {
      setConfirmLoading(false);
    }
  }

  const stage = currentLead.outreach_stage || "touch1_pending";
  const typeKey = (currentLead.lead_type || "").toUpperCase();

  return (
    <div className="min-h-full bg-canvas">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="h-4 w-4 text-brand flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Back nav */}
      <div className="px-4 py-3 bg-surface border-b border-line">
        <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-deep transition-colors">
          <ArrowLeft className="h-4 w-4" /> Outreach Board
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ── HEADER ──────────────────────────────────────── */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge tone={STAGE_TONES[stage] || "neutral"} size="sm">
                  {STAGE_LABELS[stage] || stage}
                </Badge>
                {typeKey && (
                  <Badge tone="neutral" size="sm">
                    Script Type {typeKey}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">{currentLead.company_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                {currentLead.industry && <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{currentLead.industry}</span>}
                {currentLead.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{currentLead.city}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {currentLead.phone && (
                <a href={`tel:${currentLead.phone}`} className={buttonVariants({ variant: "primary" })}>
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              {currentLead.phone && (
                <a href={`https://wa.me/${currentLead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className={buttonVariants({ variant: "secondary" })}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Activity + Proposals ─────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Full Activity Trail (audit triggers + activity events) */}
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h2 className="font-display text-sm font-semibold text-slate-900">Activity Trail</h2>
                <p className="text-xs text-slate-500 mt-0.5">Every change to this lead — stage moves, edits, proposals</p>
              </div>
              <div className="p-5">
                <ActivityTimeline entityType="lead" entityId={lead.id} compact limit={8} />
              </div>
            </Card>

            {/* Outreach History Timeline */}
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h2 className="font-display text-sm font-semibold text-slate-900">Outreach History</h2>
                <p className="text-xs text-slate-500 mt-0.5">{outreachLogs.length} interactions logged</p>
              </div>
              <div className="divide-y divide-line">
                {outreachLogs.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-400 italic">
                    No outreach activity yet.
                  </div>
                )}
                {outreachLogs.map((log) => {
                  const typeInfo = TOUCH_TYPE_LABELS[log.touch_type] || { label: log.touch_type, icon: Clock, tone: "neutral" as Tone };
                  const Icon = typeInfo.icon;
                  return (
                    <div key={log.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors">
                      <div className={cn("mt-0.5 shrink-0", TONE_TEXT[typeInfo.tone])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-slate-800">{typeInfo.label}</p>
                          {log.outcome && (
                            <span className={cn("text-[11px] font-semibold", TONE_TEXT[OUTCOME_TONES[log.outcome] || "neutral"])}>
                              {log.outcome.replace(/_/g, " ")}
                            </span>
                          )}
                          {log.pdf_name && (
                            <span className="text-[11px] bg-info-soft text-info px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <FileText className="h-2.5 w-2.5" /> {log.pdf_name}
                            </span>
                          )}
                        </div>
                        {log.note && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.note}</p>}
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatDateTime(log.created_at)}
                          {log.actor?.full_name && ` · by ${log.actor.full_name}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Proposals */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <div>
                  <h2 className="font-display text-sm font-semibold text-slate-900">Proposals</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}</p>
                </div>
                {isAdmin && (
                  <Link href={`/admin/leads/${lead.id}/proposal/new`}
                    className={buttonVariants({ variant: "primary", size: "sm" })}>
                    <Plus className="h-3.5 w-3.5" /> Create Proposal
                  </Link>
                )}
              </div>
              {proposals.length === 0 && (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400 italic">No proposals yet.</div>
              )}
              {proposals.map((proposal, i) => {
                const isConfirmed = proposal.status === "confirmed";
                const canConfirm = isAdmin && proposal.status === "sent";
                const isExpanded = confirmingProposalId === proposal.id;
                const proposalTone: Tone =
                  isConfirmed ? "brand" :
                  proposal.status === "sent" ? "info" :
                  proposal.status === "rejected" ? "danger" :
                  "neutral";
                return (
                  <div key={proposal.id} className="border-b border-line last:border-0">
                    {/* Proposal row */}
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Proposal #{i + 1}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Sent {formatDate(proposal.sent_at)}</p>
                        {proposal.amount && (
                          <p className="text-xs font-semibold tabular-nums text-slate-700 mt-0.5">
                            ₹{proposal.amount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={proposalTone} size="sm">
                          {proposal.status || "Draft"}
                        </Badge>
                        {isConfirmed && (() => {
                          const matchedAgreement = agreements.find((a: Agreement) => a.proposal_id === proposal.id) || agreements[0];
                          return matchedAgreement ? (
                            <Link href={`/admin/agreements/${matchedAgreement.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:underline">
                              <CheckCircle className="h-3 w-3" /> View Agreement
                            </Link>
                          ) : (
                            <Link href="/admin/agreements" className="flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:underline">
                              <CheckCircle className="h-3 w-3" /> View Agreement
                            </Link>
                          );
                        })()}
                        {canConfirm && (
                          <button
                            onClick={() => {
                              setConfirmingProposalId(isExpanded ? null : proposal.id);
                              setConfirmChecked(false);
                              setConfirmError(null);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <FileSignature className="h-3 w-3" />
                            {isExpanded ? "Cancel" : "Client Confirmed →"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline confirm panel */}
                    {isExpanded && (
                      <div className="mx-5 mb-4 bg-slate-50 border border-line rounded-xl p-4 space-y-4">
                        <p className="text-xs font-semibold text-slate-700">Log client confirmation</p>

                        <label className={cn("flex items-start gap-3 cursor-pointer bg-surface border-2 rounded-lg p-3 transition-colors", confirmChecked ? "border-brand-line" : "border-line")}>
                          <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors", confirmChecked ? "bg-brand-deep border-brand-deep" : "border-line-strong")}>
                            {confirmChecked && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} className="sr-only" />
                          <p className="text-xs text-slate-700">{lead.company_name} confirmed verbally or via WhatsApp.</p>
                        </label>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={confirmStartDate}
                            onChange={e => setConfirmStartDate(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        {confirmError && (
                          <p className="text-xs text-danger bg-danger-soft border border-danger-line rounded-lg px-3 py-2">{confirmError}</p>
                        )}

                        <Button
                          onClick={() => confirmProposal(proposal)}
                          disabled={!confirmChecked || confirmLoading}
                          className="w-full"
                        >
                          {confirmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Confirm &amp; Create Client
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>

            {/* Agreements */}
            {agreements.length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-line">
                  <h2 className="font-display text-sm font-semibold text-slate-900">Agreements</h2>
                </div>
                {agreements.map((agreement, i) => (
                  <div key={agreement.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Agreement #{i + 1}</p>
                      <p className="text-xs text-slate-500">Created {formatDate(agreement.created_at)}</p>
                      {agreement.start_date && <p className="text-xs text-slate-500">Starting {formatDate(agreement.start_date)}</p>}
                    </div>
                    <Badge tone={agreement.status === "confirmed" ? "brand" : "warning"} size="sm">
                      {agreement.status || "Pending"}
                    </Badge>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* ── RIGHT: Lead Details + Quick Actions ─────────── */}
          <div className="space-y-4">
            {/* Lead Details — fully editable */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Details</h3>
                {isAdmin && <span className="text-[11px] text-slate-400 font-medium">Click any field to edit</span>}
              </div>
              <div className="space-y-1">

                {/* Text fields */}
                {([
                  { label: "Business",  field: "company_name",   type: "text" },
                  { label: "Owner",     field: "contact_person", type: "text" },
                  { label: "Phone",     field: "phone",          type: "tel"  },
                  { label: "City",      field: "city",           type: "text" },
                  { label: "Niche",     field: "industry",       type: "text" },
                  { label: "Source",    field: "source",         type: "text" },
                  { label: "Website",   field: "website_link",   type: "url"  },
                  { label: "GMB Link",  field: "gmb_link",       type: "url"  },
                ] as { label: string; field: string; type: string }[]).map(({ label, field, type }) => (
                  <div key={field} className="group flex items-center gap-2 py-1.5 rounded-lg px-1 hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">{label}</span>
                    {isAdmin && editingField === field ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          autoFocus
                          type={type}
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") commitEdit(field); if (e.key === "Escape") cancelEdit(); }}
                          onBlur={() => commitEdit(field)}
                          className="flex-1 text-xs border border-brand-line rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand bg-surface"
                        />
                        <button onMouseDown={() => commitEdit(field)} className="text-brand-deep hover:text-brand-deeper"><CheckCircle className="h-3.5 w-3.5" /></button>
                        <button onMouseDown={cancelEdit} className="text-slate-400 hover:text-slate-600"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => isAdmin && startEdit(field)}
                        className={cn(
                          "flex-1 text-left text-xs font-medium transition-colors",
                          isAdmin ? "cursor-pointer hover:text-brand-deep" : "cursor-default",
                          currentLead[field] ? "text-slate-700" : "text-slate-400 italic"
                        )}
                      >
                        {currentLead[field] || (isAdmin ? "Click to add" : "—")}
                      </button>
                    )}
                    {isAdmin && editingField !== field && (
                      <Edit3 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                ))}

                <div className="border-t border-line my-2" />

                {/* Boolean toggles */}
                {([
                  { label: "Has Website", field: "has_website"  },
                  { label: "SERP Ranked", field: "serp_ranked"  },
                ] as { label: string; field: string }[]).map(({ label, field }) => (
                  <div key={field} className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">{label}</span>
                    <button
                      onClick={() => isAdmin && toggleBoolean(field)}
                      className={cn(
                        "text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors",
                        currentLead[field]
                          ? cn("bg-brand-soft text-brand-deep", isAdmin && "hover:bg-brand/10")
                          : cn("bg-slate-100 text-slate-500", isAdmin && "hover:bg-slate-200"),
                        isAdmin ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      {currentLead[field] ? "Yes" : "No"}
                    </button>
                  </div>
                ))}

                {/* Bot paused toggle */}
                {currentLead.bot_paused !== undefined && (
                  <div className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Bot</span>
                    <button
                      onClick={() => isAdmin && toggleBoolean("bot_paused")}
                      className={cn(
                        "text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors",
                        currentLead.bot_paused
                          ? cn("bg-warn-soft text-warn", isAdmin && "hover:bg-warn/10")
                          : cn("bg-brand-soft text-brand-deep", isAdmin && "hover:bg-brand/10"),
                        isAdmin ? "cursor-pointer" : "cursor-default"
                      )}
                      title={currentLead.bot_paused ? "Bot paused — click to resume" : "Bot active — click to pause"}
                    >
                      {currentLead.bot_paused ? "Paused" : "Active"}
                    </button>
                  </div>
                )}

                <div className="border-t border-line my-2" />

                {/* Script Type dropdown */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Script Type</span>
                  {isAdmin ? (
                    <Select
                      value={currentLead.lead_type || ""}
                      onChange={e => updateField("lead_type", e.target.value)}
                      className="h-auto py-1 text-xs font-semibold w-auto"
                    >
                      <option value="">Not set</option>
                      {["A", "B", "C", "D"].map(t => <option key={t} value={t}>Type {t}</option>)}
                    </Select>
                  ) : (
                    currentLead.lead_type ? (
                      <Badge tone="neutral" size="sm">Type {currentLead.lead_type}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )
                  )}
                </div>

                {/* Stage override */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Stage</span>
                  {isAdmin ? (
                    <Select
                      value={currentLead.outreach_stage || "touch1_pending"}
                      onChange={e => changeStage(e.target.value)}
                      className="h-auto py-1 text-xs font-semibold w-auto"
                    >
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Select>
                  ) : (
                    <Badge tone={STAGE_TONES[currentLead.outreach_stage] || "neutral"} size="sm">
                      {STAGE_LABELS[currentLead.outreach_stage] || currentLead.outreach_stage}
                    </Badge>
                  )}
                </div>

                {/* Follow-up Date */}
                <div className="flex items-center gap-2 py-1.5 px-1 group">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Follow-up</span>
                  {isAdmin && editingField === "follow_up_date" ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        autoFocus
                        type="datetime-local"
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") commitEdit("follow_up_date"); if (e.key === "Escape") cancelEdit(); }}
                        onBlur={() => commitEdit("follow_up_date")}
                        className="flex-1 text-xs border border-brand-line rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => isAdmin && startEdit("follow_up_date")}
                      className={cn(
                        "flex-1 text-left text-xs font-medium transition-colors",
                        isAdmin ? "cursor-pointer hover:text-brand-deep" : "cursor-default",
                        currentLead.follow_up_date ? "text-slate-700" : "text-slate-400 italic"
                      )}
                    >
                      {currentLead.follow_up_date ? formatDateTime(currentLead.follow_up_date) : (isAdmin ? "Click to set" : "—")}
                    </button>
                  )}
                  {isAdmin && editingField !== "follow_up_date" && (
                    <Edit3 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>

                {/* Read-only */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Added</span>
                  <span className="text-xs text-slate-500">{formatDate(currentLead.created_at)}</span>
                </div>
                {marketInsight?.search_volume && (
                  <div className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Search Vol</span>
                    <span className="text-xs text-slate-700 font-medium">{marketInsight.search_volume}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            {isAdmin && (
              <Card className="p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {/* Assigned To */}
                  <div className="mb-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Assigned To</label>
                    <Select
                      value={currentLead.assigned_sales_exec || ""}
                      onChange={(e) => changeAssignee(e.target.value)}
                      disabled={assigning}
                    >
                      <option value="">Unassigned</option>
                      {team.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name || "Unnamed"}</option>
                      ))}
                    </Select>
                  </div>

                  <Link href={`/admin/leads/${lead.id}/proposal/new`}
                    className={buttonVariants({ variant: "primary", className: "w-full" })}>
                    <Plus className="h-4 w-4" /> Create Proposal
                  </Link>

                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="flex items-center gap-2 w-full border border-brand-line bg-brand-soft hover:bg-brand/10 text-brand-deep px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp Template
                  </button>

                  <button
                    onClick={() => moveToRevival()}
                    className="flex items-center gap-2 w-full border border-warn-line bg-warn-soft hover:bg-warn/10 text-warn px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" /> Move to Revival
                  </button>

                  {!showConfirmDead ? (
                    <button
                      onClick={() => setShowConfirmDead(true)}
                      className="flex items-center gap-2 w-full border border-danger-line bg-danger-soft hover:bg-red-100 text-danger px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Mark as Dead
                    </button>
                  ) : (
                    <div className="rounded-lg border border-danger-line bg-danger-soft p-3">
                      <p className="text-xs text-danger font-semibold mb-2">Confirm — mark this lead as dead?</p>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={markAsDead} className="flex-1">Yes, mark dead</Button>
                        <Button variant="secondary" size="sm" onClick={() => setShowConfirmDead(false)} className="flex-1">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {!showConfirmDelete ? (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="flex items-center gap-2 w-full border border-line bg-surface hover:border-danger-line hover:bg-danger-soft text-slate-500 hover:text-danger px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Lead
                    </button>
                  ) : (
                    <div className="rounded-lg border border-danger-line bg-danger-soft p-3">
                      <p className="text-xs text-danger font-semibold mb-2">Permanently delete this lead and its call history? This can&apos;t be undone. Prefer &quot;Mark as Dead&quot; if you may revive it.</p>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={deleteLead} disabled={deleteLoading} className="flex-1">{deleteLoading ? "Deleting…" : "Yes, delete"}</Button>
                        <Button variant="secondary" size="sm" onClick={() => setShowConfirmDelete(false)} className="flex-1">Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}

      {showWhatsAppModal && (
        <WhatsAppTemplateModal
          onClose={() => setShowWhatsAppModal(false)}
          templates={whatsappTemplates}
          lead={currentLead}
          userId={userId}
        />
      )}

    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ── SUB-COMPONENTS ────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

function WhatsAppTemplateModal({ onClose, templates, lead, userId }: { onClose: () => void; templates: any[]; lead: any; userId: string | null }) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isCopying, setIsCopying] = useState(false);
  const supabase = createClient();

  const handleSelect = (t: any) => {
    setSelectedTemplate(t);
    const vars: Record<string, string> = {};
    (t.variables || []).forEach((v: string) => {
      if (v === "businessName") vars[v] = lead.company_name || "";
      else if (v === "city") vars[v] = lead.city || "";
      else if (v === "niche") vars[v] = lead.industry || "";
      else if (v === "name") vars[v] = lead.contact_person || lead.company_name || "";
      else vars[v] = "";
    });
    setVariables(vars);
  };

  const getMessage = () => {
    if (!selectedTemplate) return "";
    let content = selectedTemplate.content;
    Object.entries(variables).forEach(([key, val]) => {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    });
    return content;
  };

  const copyAndLog = async () => {
    setIsCopying(true);
    await navigator.clipboard.writeText(getMessage());
    const { error: logErr } = await supabase.from("outreach_logs").insert({
      lead_id: lead.id,
      touch_type: "whatsapp_template",
      note: `Sent WhatsApp: ${selectedTemplate.name}`,
      outcome: "SENT",
      created_by: userId,
    });
    if (logErr) notify.error("Could not log WhatsApp send", logErr.message);
    const categoryStageMap: Record<string, string> = {
      CURIOSITY:   "curiosity_sent",
      PDF:         "pdf_sent",
      FOLLOW_UP:   "follow_up_due",
      REVIVAL:     "revival",
    };
    const newStage = categoryStageMap[selectedTemplate.category?.toUpperCase()];
    if (newStage) {
      const { error: stageErr } = await supabase.from("leads").update(leadStageUpdate(newStage) as any).eq("id", lead.id);
      if (stageErr) notify.error("Could not update lead stage", stageErr.message);
    }
    setTimeout(() => {
      setIsCopying(false);
      const waLink = `https://wa.me/${lead.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(getMessage())}`;
      window.open(waLink, "_blank");
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-lg transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-deep" /> WhatsApp Templates
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Template</p>
            {templates.map(t => (
              <button key={t.id} onClick={() => handleSelect(t)}
                className={cn("w-full text-left p-3 rounded-lg border transition-colors", selectedTemplate?.id === t.id ? "border-brand-line bg-brand-soft" : "border-line hover:border-line-strong")}>
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.category} {t.lead_type ? `· Type ${t.lead_type}` : ""}</p>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {selectedTemplate ? (
              <>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fill Variables</p>
                  {(selectedTemplate.variables || []).map((v: string) => (
                    <div key={v}>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">{v}</label>
                      <input value={variables[v] || ""} onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        className={inputClasses} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Preview</p>
                  <div className="bg-slate-50 border border-line rounded-lg p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {getMessage()}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 border-2 border-dashed border-line rounded-xl">
                <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-line flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={copyAndLog} disabled={!selectedTemplate || isCopying}>
            {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copy &amp; Send
          </Button>
        </div>
      </div>
    </div>
  );
}

