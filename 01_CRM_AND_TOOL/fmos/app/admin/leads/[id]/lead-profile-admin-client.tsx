"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageCircle, FileText, Calendar,
  Clock, User, MapPin, Building, Globe, Edit3,
  CheckCircle, XCircle, AlertOctagon, RefreshCw,
  ChevronDown, ChevronUp, Plus, Send, Copy, Loader2,
  Rocket, ClipboardCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────
interface Lead { [key: string]: any; }
interface OutreachLog { id: string; created_at: string; touch_type: string; outcome: string | null; note: string | null; pdf_name: string | null; actor?: { full_name: string } | null; }
interface Proposal { id: string; sent_at: string | null; amount: number | null; status: string | null; services?: any; }
interface Agreement { id: string; created_at: string; status: string | null; start_date: string | null; }

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

const STAGE_LABELS: Record<string, string> = {
  touch1_pending: "Touch 1 Pending",
  curiosity_sent: "Curiosity Sent",
  pdf_sent: "PDF Sent",
  follow_up_due: "Follow-up Due",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  dead: "Dead",
  revival: "Revival",
};

const STAGE_COLORS: Record<string, string> = {
  touch1_pending: "bg-slate-100 text-slate-600",
  curiosity_sent: "bg-blue-100 text-blue-700",
  pdf_sent: "bg-indigo-100 text-indigo-700",
  follow_up_due: "bg-amber-100 text-amber-700",
  meeting_booked: "bg-green-100 text-green-700",
  proposal_sent: "bg-purple-100 text-purple-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  dead: "bg-slate-100 text-slate-400",
  revival: "bg-orange-100 text-orange-700",
};

const TOUCH_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp_curiosity: { label: "WhatsApp Curiosity Sent", icon: MessageCircle, color: "text-green-600" },
  pdf_sent: { label: "PDF Sent", icon: FileText, color: "text-indigo-600" },
  follow_up_call: { label: "Call Made", icon: Phone, color: "text-blue-600" },
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
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(lead.follow_up_date || "");
  const [editingLeadType, setEditingLeadType] = useState(false);
  const [leadType, setLeadType] = useState(lead.lead_type || "");
  const [isPending, startTransition] = useTransition();
  const [showConfirmDead, setShowConfirmDead] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const supabase = createClient();

  async function updateField(field: string, value: string) {
    setCurrentLead((prev: any) => ({ ...prev, [field]: value }));
    await supabase.from("leads").update({ [field]: value } as any).eq("id", lead.id);
  }

  async function markAsDead() {
    setCurrentLead((prev: any) => ({ ...prev, outreach_stage: "dead" }));
    await supabase.from("leads").update({ outreach_stage: "dead" } as any).eq("id", lead.id);
    setShowConfirmDead(false);
  }

  async function moveToRevival() {
    setCurrentLead((prev: any) => ({ ...prev, outreach_stage: "revival" }));
    await supabase.from("leads").update({ outreach_stage: "revival" } as any).eq("id", lead.id);
  }

  const stage = currentLead.outreach_stage || "touch1_pending";
  const typeKey = (currentLead.lead_type || "").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
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
              {isAdmin && (
                <Link href={`/sales/leads/${lead.id}`} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                  <Edit3 className="h-4 w-4" /> Full Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Activity + Proposals ─────────────────── */}
          <div className="lg:col-span-2 space-y-6">

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
              {proposals.map((proposal, i) => (
                <div key={proposal.id} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Proposal #{i + 1}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Sent {formatDate(proposal.sent_at)}</p>
                    {proposal.amount && (
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">₹{proposal.amount.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      proposal.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                      proposal.status === "sent" ? "bg-blue-100 text-blue-700" :
                      proposal.status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {proposal.status || "Draft"}
                    </span>
                    {proposal.status === "confirmed" && isAdmin && (
                      <button
                        onClick={() => { setSelectedProposal(proposal); setShowAgreementModal(true); }}
                        className="text-[10px] font-bold bg-[#42CA80] text-white px-2 py-1 rounded hover:bg-[#35A66A] transition-colors"
                      >
                        Create Agreement
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
            {/* Lead Details */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Lead Details</h3>
              <div className="space-y-3">
                {[
                  { label: "Business", value: currentLead.company_name },
                  { label: "Owner", value: currentLead.contact_person },
                  { label: "Phone", value: currentLead.phone },
                  { label: "City", value: currentLead.city },
                  { label: "Niche", value: currentLead.industry },
                  { label: "Source", value: currentLead.source },
                  { label: "Has Website", value: currentLead.has_website ? "Yes" : "No" },
                  { label: "SERP Ranked", value: currentLead.serp_ranked ? "Yes" : "No" },
                  { label: "Uploaded", value: formatDate(currentLead.created_at) },
                  marketInsight && { label: "Search Volume", value: marketInsight.search_volume || "—" },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">{item.label}</span>
                    <span className="text-xs text-slate-700 font-medium">{item.value || "—"}</span>
                  </div>
                ))}

                {/* Editable: Lead Type */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24 shrink-0">Script Type</span>
                  {isAdmin && editingLeadType ? (
                    <select value={leadType} onChange={e => { setLeadType(e.target.value); updateField("lead_type", e.target.value); setEditingLeadType(false); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#42CA80]">
                      {["A", "B", "C", "D"].map(t => <option key={t} value={t}>Type {t}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => isAdmin && setEditingLeadType(true)}
                      className={`text-xs font-bold px-2 py-0.5 rounded ${isAdmin ? "cursor-pointer hover:ring-1 hover:ring-[#42CA80]" : ""} ${leadType ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}>
                      {leadType ? `Type ${leadType}` : "Not set"}
                    </button>
                  )}
                </div>

                {/* Editable: Follow-up Date */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24 shrink-0">Follow-up</span>
                  {isAdmin && editingFollowUp ? (
                    <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                      onBlur={() => { updateField("follow_up_date", followUpDate); setEditingFollowUp(false); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#42CA80]"
                      autoFocus
                    />
                  ) : (
                    <button onClick={() => isAdmin && setEditingFollowUp(true)}
                      className={`text-xs font-medium ${isAdmin ? "cursor-pointer hover:text-[#42CA80]" : ""} ${currentLead.follow_up_date ? "text-slate-700" : "text-slate-400"}`}>
                      {currentLead.follow_up_date ? formatDateTime(currentLead.follow_up_date) : "Set date"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {isAdmin && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-2">
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

                  {(stage === "won" || lead.outreach_stage === "won") && (
                    <button
                      onClick={() => setShowOnboardingModal(true)}
                      className="flex items-center gap-2 w-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Rocket className="h-4 w-4" /> Activate Onboarding
                    </button>
                  )}

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

      {showAgreementModal && selectedProposal && (
        <AgreementModal
          onClose={() => { setShowAgreementModal(false); setSelectedProposal(null); }}
          proposal={selectedProposal}
          lead={currentLead}
          userId={userId}
        />
      )}

      {showOnboardingModal && (
        <OnboardingModal
          onClose={() => setShowOnboardingModal(false)}
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
    await supabase.from("outreach_logs" as any).insert({
      lead_id: lead.id,
      touch_type: "whatsapp_template",
      note: `Sent WhatsApp: ${selectedTemplate.name}`,
      outcome: "SENT",
      created_by: userId,
    });
    if (selectedTemplate.category === "CURIOSITY") {
      await supabase.from("leads").update({ outreach_stage: "curiosity_sent" } as any).eq("id", lead.id);
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

function AgreementModal({ onClose, proposal, lead, userId }: { onClose: () => void; proposal: any; lead: any; userId: string | null }) {
  const [startDate, setStartDate] = useState(proposal.start_date || new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleCreate = async () => {
    setIsSaving(true);
    await supabase.from("agreements" as any).insert({
      lead_id: lead.id,
      proposal_id: proposal.id,
      services: proposal.services,
      total_setup: proposal.total_setup,
      total_monthly: proposal.total_monthly,
      start_date: startDate,
      status: "pending",
      created_by: userId,
    });
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Confirm Agreement</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Creating agreement based on proposal <strong>{proposal.proposal_number}</strong> for <strong>{lead.company_name}</strong>.</p>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Proposed Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-xl">Cancel</button>
          <button onClick={handleCreate} disabled={isSaving}
            className="bg-[#42CA80] hover:bg-[#35A66A] text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm & Create
          </button>
        </div>
      </div>
    </div>
  );
}

function OnboardingModal({ onClose, lead, userId }: { onClose: () => void; lead: any; userId: string | null }) {
  const [isActivating, setIsActivating] = useState(false);
  const supabase = createClient();

  const handleActivate = async () => {
    setIsActivating(true);
    // 1. Get latest agreement for services (look for pending or confirmed)
    const { data: agreement } = await supabase
      .from("agreements" as any)
      .select("*")
      .eq("lead_id", lead.id)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const services = (agreement as any)?.services || [];
    
    if (services.length > 0) {
      const onboardingTasks = services.flatMap((svc: any) => [
        { 
          client_id: lead.client_id || lead.id, 
          service_id: svc.id, 
          task_id: `${svc.id}_INIT`, 
          task: `Initialize ${svc.label} setup`, 
          owner: "PM", 
          status: "PENDING" 
        },
        { 
          client_id: lead.client_id || lead.id, 
          service_id: svc.id, 
          task_id: `${svc.id}_ASSETS`, 
          task: `Collect assets for ${svc.label}`, 
          owner: "ADMIN", 
          status: "PENDING" 
        }
      ]);
      await supabase.from("client_onboarding_tasks").insert(onboardingTasks);
    }
    await supabase.from("leads").update({ outreach_stage: "won" } as any).eq("id", lead.id);
    setIsActivating(false);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-indigo-500" /> Activate Onboarding
          </h3>
        </div>
        <div className="p-6 space-y-4 text-center">
          <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Ready to start for {lead.company_name}?</p>
            <p className="text-xs text-slate-500 mt-2">This will generate onboarding checklists and initialize the asset vault.</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-xl">Hold on</button>
          <button onClick={handleActivate} disabled={isActivating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            {isActivating && <Loader2 className="h-4 w-4 animate-spin" />} Activate Now
          </button>
        </div>
      </div>
    </div>
  );
}
