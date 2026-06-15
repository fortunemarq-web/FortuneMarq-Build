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
import ActivityTimeline from "@/components/ActivityTimeline";

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

// Stage labels/colors come from the shared state machine so every
// stage (including parked ones) renders and is selectable here.
const STAGE_COLORS: Record<string, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.key, s.badge])
);

const TOUCH_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  call: { label: "Call Made", icon: Phone, color: "text-blue-600" },
  whatsapp_sent: { label: "WhatsApp Sent", icon: MessageCircle, color: "text-green-600" },
  whatsapp_curiosity: { label: "WhatsApp Curiosity Sent", icon: MessageCircle, color: "text-green-600" },
  whatsapp_template: { label: "WhatsApp Template Sent", icon: MessageCircle, color: "text-green-600" },
  pdf_sent: { label: "PDF Sent", icon: FileText, color: "text-indigo-600" },
  follow_up: { label: "Follow-up", icon: Clock, color: "text-orange-600" },
  meeting_booked: { label: "Meeting Booked", icon: Calendar, color: "text-emerald-600" },
  proposal_sent: { label: "Proposal Sent", icon: FileText, color: "text-purple-600" },
  note: { label: "Note", icon: Edit3, color: "text-slate-500" },
};

const OUTCOME_COLORS: Record<string, string> = {
  INTERESTED_BOOK_NOW: "text-emerald-600",
  INTERESTED_FOLLOW_UP_LATER: "text-teal-600",
  INTERESTED_SEND_INFO: "text-blue-600",
  NOT_INTERESTED: "text-red-500",
  FOLLOW_BACK: "text-amber-600",
  WRONG_NUMBER: "text-slate-400",
  NO_ANSWER: "text-slate-400",
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
    <div className="min-h-full bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="h-4 w-4 text-[#42CA80] flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Back nav */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#42CA80] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Outreach Board
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ── HEADER ──────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STAGE_COLORS[stage] || "bg-slate-100 text-slate-600"}`}>
                  {STAGE_LABELS[stage] || stage}
                </span>
                {typeKey && (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                    Script Type {typeKey}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{currentLead.company_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                {currentLead.industry && <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{currentLead.industry}</span>}
                {currentLead.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{currentLead.city}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {currentLead.phone && (
                <a href={`tel:${currentLead.phone}`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              {currentLead.phone && (
                <a href={`https://wa.me/${currentLead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Activity + Proposals ─────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Full Activity Trail (audit triggers + activity events) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Activity Trail</h2>
                <p className="text-xs text-slate-500 mt-0.5">Every change to this lead — stage moves, edits, proposals</p>
              </div>
              <div className="p-5">
                <ActivityTimeline entityType="lead" entityId={lead.id} compact limit={8} />
              </div>
            </div>

            {/* Outreach History Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Outreach History</h2>
                <p className="text-xs text-slate-500 mt-0.5">{outreachLogs.length} interactions logged</p>
              </div>
              <div className="divide-y divide-slate-50">
                {outreachLogs.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-400 italic">
                    No outreach activity yet.
                  </div>
                )}
                {outreachLogs.map((log) => {
                  const typeInfo = TOUCH_TYPE_LABELS[log.touch_type] || { label: log.touch_type, icon: Clock, color: "text-slate-500" };
                  const Icon = typeInfo.icon;
                  return (
                    <div key={log.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors">
                      <div className={`mt-0.5 shrink-0 ${typeInfo.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-slate-800">{typeInfo.label}</p>
                          {log.outcome && (
                            <span className={`text-[10px] font-bold ${OUTCOME_COLORS[log.outcome] || "text-slate-500"}`}>
                              {log.outcome.replace(/_/g, " ")}
                            </span>
                          )}
                          {log.pdf_name && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <FileText className="h-2.5 w-2.5" /> {log.pdf_name}
                            </span>
                          )}
                        </div>
                        {log.note && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(log.created_at)}
                          {log.actor?.full_name && ` · by ${log.actor.full_name}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proposals */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Proposals</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}</p>
                </div>
                {isAdmin && (
                  <Link href={`/admin/leads/${lead.id}/proposal/new`}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-[#42CA80] hover:bg-[#35A66A] text-white px-3 py-1.5 rounded-lg transition-colors">
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
                return (
                  <div key={proposal.id} className="border-b border-slate-50 last:border-0">
                    {/* Proposal row */}
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Proposal #{i + 1}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Sent {formatDate(proposal.sent_at)}</p>
                        {proposal.amount && (
                          <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                            ₹{proposal.amount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isConfirmed ? "bg-emerald-100 text-emerald-700" :
                          proposal.status === "sent" ? "bg-blue-100 text-blue-700" :
                          proposal.status === "rejected" ? "bg-red-100 text-red-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {proposal.status || "Draft"}
                        </span>
                        {isConfirmed && (() => {
                          const matchedAgreement = agreements.find((a: Agreement) => a.proposal_id === proposal.id) || agreements[0];
                          return matchedAgreement ? (
                            <Link href={`/admin/agreements/${matchedAgreement.id}`} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">
                              <CheckCircle className="h-3 w-3" /> View Agreement
                            </Link>
                          ) : (
                            <Link href="/admin/agreements" className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">
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
                            className="flex items-center gap-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <FileSignature className="h-3 w-3" />
                            {isExpanded ? "Cancel" : "Client Confirmed →"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline confirm panel */}
                    {isExpanded && (
                      <div className="mx-5 mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                        <p className="text-xs font-bold text-slate-700">Log client confirmation</p>

                        <label className="flex items-start gap-3 cursor-pointer bg-white border-2 rounded-xl p-3 transition-all" style={{ borderColor: confirmChecked ? "#42CA80" : "#e2e8f0" }}>
                          <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${confirmChecked ? "bg-[#42CA80] border-[#42CA80]" : "border-slate-300"}`}>
                            {confirmChecked && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} className="sr-only" />
                          <p className="text-xs text-slate-700">{lead.company_name} confirmed verbally or via WhatsApp.</p>
                        </label>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={confirmStartDate}
                            onChange={e => setConfirmStartDate(e.target.value)}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30"
                          />
                        </div>

                        {confirmError && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{confirmError}</p>
                        )}

                        <button
                          onClick={() => confirmProposal(proposal)}
                          disabled={!confirmChecked || confirmLoading}
                          className="w-full bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          {confirmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Confirm & Create Client
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Agreements */}
            {agreements.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Agreements</h2>
                </div>
                {agreements.map((agreement, i) => (
                  <div key={agreement.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Agreement #{i + 1}</p>
                      <p className="text-xs text-slate-500">Created {formatDate(agreement.created_at)}</p>
                      {agreement.start_date && <p className="text-xs text-slate-500">Starting {formatDate(agreement.start_date)}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      agreement.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {agreement.status || "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Lead Details + Quick Actions ─────────── */}
          <div className="space-y-4">
            {/* Lead Details — fully editable */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</h3>
                {isAdmin && <span className="text-[10px] text-slate-400 font-medium">Click any field to edit</span>}
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
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">{label}</span>
                    {isAdmin && editingField === field ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          autoFocus
                          type={type}
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") commitEdit(field); if (e.key === "Escape") cancelEdit(); }}
                          onBlur={() => commitEdit(field)}
                          className="flex-1 text-xs border border-[#42CA80] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#42CA80] bg-white"
                        />
                        <button onMouseDown={() => commitEdit(field)} className="text-[#42CA80] hover:text-[#35A66A]"><CheckCircle className="h-3.5 w-3.5" /></button>
                        <button onMouseDown={cancelEdit} className="text-slate-400 hover:text-slate-600"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => isAdmin && startEdit(field)}
                        className={`flex-1 text-left text-xs font-medium transition-colors ${isAdmin ? "cursor-pointer hover:text-[#42CA80]" : "cursor-default"} ${currentLead[field] ? "text-slate-700" : "text-slate-400 italic"}`}
                      >
                        {currentLead[field] || (isAdmin ? "Click to add" : "—")}
                      </button>
                    )}
                    {isAdmin && editingField !== field && (
                      <Edit3 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                ))}

                <div className="border-t border-slate-100 my-2" />

                {/* Boolean toggles */}
                {([
                  { label: "Has Website", field: "has_website"  },
                  { label: "SERP Ranked", field: "serp_ranked"  },
                ] as { label: string; field: string }[]).map(({ label, field }) => (
                  <div key={field} className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">{label}</span>
                    <button
                      onClick={() => isAdmin && toggleBoolean(field)}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                        currentLead[field]
                          ? "bg-emerald-100 text-emerald-700 " + (isAdmin ? "hover:bg-emerald-200" : "")
                          : "bg-slate-100 text-slate-500 " + (isAdmin ? "hover:bg-slate-200" : "")
                      } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {currentLead[field] ? "Yes" : "No"}
                    </button>
                  </div>
                ))}

                <div className="border-t border-slate-100 my-2" />

                {/* Script Type dropdown */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Script Type</span>
                  {isAdmin ? (
                    <select
                      value={currentLead.lead_type || ""}
                      onChange={e => updateField("lead_type", e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80] font-bold text-indigo-700"
                    >
                      <option value="">Not set</option>
                      {["A", "B", "C", "D"].map(t => <option key={t} value={t}>Type {t}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${currentLead.lead_type ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}>
                      {currentLead.lead_type ? `Type ${currentLead.lead_type}` : "—"}
                    </span>
                  )}
                </div>

                {/* Stage override */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Stage</span>
                  {isAdmin ? (
                    <select
                      value={currentLead.outreach_stage || "touch1_pending"}
                      onChange={e => changeStage(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#42CA80] font-semibold"
                    >
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_COLORS[currentLead.outreach_stage] || "bg-slate-100 text-slate-600"}`}>
                      {STAGE_LABELS[currentLead.outreach_stage] || currentLead.outreach_stage}
                    </span>
                  )}
                </div>

                {/* Follow-up Date */}
                <div className="flex items-center gap-2 py-1.5 px-1 group">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Follow-up</span>
                  {isAdmin && editingField === "follow_up_date" ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        autoFocus
                        type="datetime-local"
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") commitEdit("follow_up_date"); if (e.key === "Escape") cancelEdit(); }}
                        onBlur={() => commitEdit("follow_up_date")}
                        className="flex-1 text-xs border border-[#42CA80] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => isAdmin && startEdit("follow_up_date")}
                      className={`flex-1 text-left text-xs font-medium transition-colors ${isAdmin ? "cursor-pointer hover:text-[#42CA80]" : "cursor-default"} ${currentLead.follow_up_date ? "text-slate-700" : "text-slate-400 italic"}`}
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
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Added</span>
                  <span className="text-xs text-slate-500">{formatDate(currentLead.created_at)}</span>
                </div>
                {marketInsight?.search_volume && (
                  <div className="flex items-center gap-2 py-1.5 px-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0">Search Vol</span>
                    <span className="text-xs text-slate-700 font-medium">{marketInsight.search_volume}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {isAdmin && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {/* Assigned To */}
                  <div className="mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Assigned To</label>
                    <select
                      value={currentLead.assigned_sales_exec || ""}
                      onChange={(e) => changeAssignee(e.target.value)}
                      disabled={assigning}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {team.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name || "Unnamed"}</option>
                      ))}
                    </select>
                  </div>

                  <Link href={`/admin/leads/${lead.id}/proposal/new`}
                    className="flex items-center gap-2 w-full bg-[#42CA80] hover:bg-[#35A66A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    <Plus className="h-4 w-4" /> Create Proposal
                  </Link>

                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="flex items-center gap-2 w-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp Template
                  </button>

                  <button
                    onClick={() => moveToRevival()}
                    className="flex items-center gap-2 w-full border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" /> Move to Revival
                  </button>

                  {!showConfirmDead ? (
                    <button
                      onClick={() => setShowConfirmDead(true)}
                      className="flex items-center gap-2 w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Mark as Dead
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700 font-semibold mb-2">Confirm — mark this lead as dead?</p>
                      <div className="flex gap-2">
                        <button onClick={markAsDead} className="flex-1 bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-700 transition-colors">Yes, mark dead</button>
                        <button onClick={() => setShowConfirmDead(false)} className="flex-1 bg-white text-slate-600 text-xs font-bold py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}

                  {!showConfirmDelete ? (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="flex items-center gap-2 w-full border border-slate-200 bg-white hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Lead
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700 font-semibold mb-2">Permanently delete this lead and its call history? This can't be undone. Prefer "Mark as Dead" if you may revive it.</p>
                      <div className="flex gap-2">
                        <button onClick={deleteLead} disabled={deleteLoading} className="flex-1 bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{deleteLoading ? "Deleting…" : "Yes, delete"}</button>
                        <button onClick={() => setShowConfirmDelete(false)} className="flex-1 bg-white text-slate-600 text-xs font-bold py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" /> WhatsApp Templates
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Template</p>
            {templates.map(t => (
              <button key={t.id} onClick={() => handleSelect(t)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTemplate?.id === t.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-100 hover:border-slate-300"}`}>
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.category} {t.lead_type ? `· Type ${t.lead_type}` : ""}</p>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {selectedTemplate ? (
              <>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fill Variables</p>
                  {(selectedTemplate.variables || []).map((v: string) => (
                    <div key={v}>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">{v}</label>
                      <input value={variables[v] || ""} onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                    {getMessage()}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
          <button onClick={copyAndLog} disabled={!selectedTemplate || isCopying}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md">
            {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copy & Send
          </button>
        </div>
      </div>
    </div>
  );
}

