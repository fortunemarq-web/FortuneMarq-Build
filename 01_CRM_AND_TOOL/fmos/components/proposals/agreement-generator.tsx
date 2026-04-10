"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, FileText, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Proposal {
  id: string;
  proposal_number: string;
  services: Array<{ id: string; label: string; setupFee: number; monthlyRetainer: number }>;
  total_setup: number;
  total_monthly: number;
  start_date: string | null;
  status: string;
}

interface Lead {
  id: string;
  company_name: string;
  contact_person: string | null;
  city: string | null;
  industry: string | null;
}

interface AgreementGeneratorProps {
  proposal: Proposal;
  lead: Lead;
  agreementNumber: string;
  userId: string | null;
}

export default function AgreementGenerator({ proposal, lead, agreementNumber, userId }: AgreementGeneratorProps) {
  const router = useRouter();
  const [step, setStep] = useState<"confirm" | "review" | "done">("confirm");
  const [confirmed, setConfirmed] = useState(false);
  const [startDate, setStartDate] = useState(proposal.start_date?.split("T")[0] || "");
  const [isPending, startTransition] = useTransition();
  const [savedAgreementId, setSavedAgreementId] = useState<string | null>(null);
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const supabase = createClient();

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  async function generateAgreement() {
    if (!confirmed) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from("agreements" as any)
        .insert({
          lead_id: lead.id,
          proposal_id: proposal.id,
          agreement_number: agreementNumber,
          proposal_ref: proposal.proposal_number,
          services: proposal.services,
          total_setup: proposal.total_setup,
          total_monthly: proposal.total_monthly,
          start_date: startDate || null,
          status: "pending",
          created_by: userId,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!error && data) {
        setSavedAgreementId((data as any).id);
        // Update proposal status to confirmed
        await supabase.from("proposals").update({ status: "confirmed" } as any).eq("id", proposal.id);
        setStep("review");
      }
    });
  }

  async function confirmClientAgreement() {
    if (!savedAgreementId) return;
    startTransition(async () => {
      // 1. Mark agreement as confirmed
      await supabase
        .from("agreements" as any)
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", savedAgreementId);

      // 2. Update lead to won
      await supabase
        .from("leads")
        .update({ outreach_stage: "won", status: "closed_won" } as any)
        .eq("id", lead.id);

      // 3. Create or link client record
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("business_name", lead.company_name)
        .single();

      let clientId = existingClient?.id;

      if (!clientId) {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            business_name: lead.company_name,
            city: lead.city,
            status: "onboarding",
            onboarding_completed: false,
            created_at: new Date().toISOString(),
          } as any)
          .select("id")
          .single();
        clientId = (newClient as any)?.id;
      }

      setClientConfirmed(true);
      setStep("done");
      if (clientId) router.push(`/admin/clients/${clientId}`);
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Generate Agreement</h1>
        <p className="text-sm text-slate-500 mt-1">{lead.company_name} · Ref: {proposal.proposal_number}</p>
      </div>

      {/* STEP 1: Log Confirmation */}
      {step === "confirm" && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-amber-800 mb-2">Before generating the agreement</h2>
            <p className="text-sm text-amber-700">Log that the client has verbally or by WhatsApp confirmed the proposal. This is a manual record — you are confirming that the client already replied.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer bg-white border-2 rounded-2xl p-5 transition-all hover:border-[#42CA80] group" style={{ borderColor: confirmed ? "#42CA80" : "#e2e8f0" }}>
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${confirmed ? "bg-[#42CA80] border-[#42CA80]" : "border-slate-300"}`}>
              {confirmed && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="sr-only" />
            <div>
              <p className="font-semibold text-sm text-slate-900">{lead.company_name} has confirmed the proposal verbally or via WhatsApp message.</p>
              <p className="text-xs text-slate-500 mt-1">Check this to confirm client has replied and agreed to move forward.</p>
            </div>
          </label>

          {/* Proposed start date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-2">Confirm Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]" />
          </div>

          <button
            onClick={generateAgreement}
            disabled={!confirmed || isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate Agreement Document
          </button>
        </div>
      )}

      {/* STEP 2: Agreement Review */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Agreement PDF Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-8 py-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">FortuneMarq Media & Marketing</p>
                  <h2 className="text-2xl font-bold mt-2">Service Agreement</h2>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{agreementNumber}</p>
                  <p>Ref: {proposal.proposal_number}</p>
                  <p>{today}</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="px-8 py-6 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Service Provider</p>
                  <p className="text-sm font-semibold text-slate-900">FortuneMarq Media & Marketing</p>
                  <p className="text-xs text-slate-500">Hubli, Karnataka</p>
                  <p className="text-xs text-slate-500">fortunemarq.com</p>
                  <p className="text-xs text-slate-500">+91 93530 82656</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Client</p>
                  <p className="text-sm font-semibold text-slate-900">{lead.company_name}</p>
                  {lead.contact_person && <p className="text-xs text-slate-500">{lead.contact_person}</p>}
                  {lead.city && <p className="text-xs text-slate-500">{lead.city}</p>}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Services Agreed</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs font-bold text-slate-500">Service</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Setup Fee</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.services.map((svc: any) => (
                    <tr key={svc.id} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">{svc.label}</td>
                      <td className="py-2.5 text-right font-mono text-slate-800">₹{svc.setupFee?.toLocaleString("en-IN") || 0}</td>
                      <td className="py-2.5 text-right font-mono text-slate-800">₹{svc.monthlyRetainer?.toLocaleString("en-IN") || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900">
                    <td className="py-3 font-bold text-slate-900">Total</td>
                    <td className="py-3 text-right font-bold font-mono">{formatINR(proposal.total_setup)}</td>
                    <td className="py-3 text-right font-bold font-mono text-[#42CA80]">{formatINR(proposal.total_monthly)}/mo</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Terms */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Payment Terms</p>
              {["Setup fee is due before work begins", "Monthly retainer invoice raised on the 1st of every month", "Payment due by the 5th of every month", "Ads paused if payment is overdue by 7 days — resumed same day payment is received"].map((pt, i) => (
                <p key={i} className="text-xs text-slate-600 mb-1.5 flex items-start gap-2"><span className="text-slate-300 shrink-0">·</span>{pt}</p>
              ))}
            </div>

            {/* Start Date + Confirmation */}
            <div className="px-8 py-6">
              {startDate && <p className="text-sm text-slate-700 mb-4"><strong>Start Date:</strong> {new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800 mb-1">Confirmation</p>
                <p className="text-xs text-slate-600">Please reply with <strong>'Yes, confirmed'</strong> to this agreement to get started.</p>
              </div>
            </div>
          </div>

          {/* WhatsApp script */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Send via WhatsApp</p>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap text-xs">
              {`Hi ${lead.contact_person || lead.company_name}! 😊

Great to know you'd like to move forward! To confirm, please reply with *"Yes, confirmed"* and we'll get started.

Just to recap:
${proposal.services.map(s => `✅ ${s.label}`).join("\n")}

Once confirmed, I'll send across the invoice.

— Jabeer, FortuneMarq`}
            </div>
          </div>

          <button
            onClick={confirmClientAgreement}
            disabled={isPending}
            className="w-full bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
            Client Confirmed — Create Client & Start Onboarding
          </button>
        </div>
      )}

      {/* STEP 3: Done */}
      {step === "done" && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Deal Closed! 🎉</h2>
          <p className="text-slate-500 mt-2 text-sm">{lead.company_name} is now a client.</p>
          <p className="text-xs text-slate-400 mt-1">Redirecting to client onboarding…</p>
        </div>
      )}
    </div>
  );
}
