"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Minus, Check, X, ChevronRight, FileText,
  DollarSign, ArrowRight, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import servicesData from "@/lib/data/services_data.json";

// ─── Types ───────────────────────────────────────────────────
interface Lead {
  id: string;
  company_name: string;
  contact_person: string | null;
  city: string | null;
  industry: string | null;
  lead_type: string | null;
}

interface SelectedService {
  id: string;
  label: string;
  setupFee: number;
  monthlyRetainer: number;
}

interface ProposalCreatorProps {
  lead: Lead;
  proposalNumber: string;
  userId: string | null;
}

const SERVICES = (servicesData as any).services as Array<{ id: string; label: string; layer: string }>;

const LEAD_TYPE_COPY: Record<string, { intro: string; finding: string; opportunity: string }> = {
  A: {
    intro: "Your business is already showing up in Google's top results — that's a strong position most of your competitors haven't reached.",
    finding: "We analysed how much of that monthly search traffic is reaching you directly versus going to competitors. There's a clear gap — and a real opportunity to capture more of it.",
    opportunity: "The businesses that protect and grow their online position now will own their market for years to come.",
  },
  B: {
    intro: "Your business has a website — which puts you ahead of many competitors. But right now your website isn't showing up when people search.",
    finding: "Every month, people are actively looking for exactly what you offer — and they're finding other businesses instead. Your website exists but it isn't working for you yet.",
    opportunity: "This is fixable — and right now is the best time to fix it. Once your website starts ranking, that monthly search demand starts coming to you.",
  },
  C: {
    intro: "Most people look for a website before deciding who to call — it's how they judge whether a business is trustworthy and professional.",
    finding: "Without a website, a significant portion of that monthly demand is going directly to competitors who have an online presence.",
    opportunity: "Most businesses in your niche and city haven't built a proper online presence yet. Moving now gives you the first-mover advantage.",
  },
  D: {
    intro: "Direct search volume for your niche is limited — but the local demand for your service is very real.",
    finding: "Most businesses in your niche and city haven't set up any digital channels properly. The demand exists but it's going to whoever is most visible.",
    opportunity: "The businesses that build their online presence first in a local market lock in that position. Once trust is established, late movers find it very hard to compete.",
  },
};

export default function ProposalCreator({ lead, proposalNumber, userId }: ProposalCreatorProps) {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [startDate, setStartDate] = useState("");
  const [step, setStep] = useState<"services" | "preview" | "done">("services");
  const [isPending, startTransition] = useTransition();
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const supabase = createClient();

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const totalSetup = selectedServices.reduce((s, svc) => s + svc.setupFee, 0);
  const totalMonthly = selectedServices.reduce((s, svc) => s + svc.monthlyRetainer, 0);

  function toggleService(svc: { id: string; label: string }) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === svc.id);
      if (exists) return prev.filter(s => s.id !== svc.id);
      return [...prev, { id: svc.id, label: svc.label, setupFee: 0, monthlyRetainer: 0 }];
    });
  }

  function updateFee(id: string, field: "setupFee" | "monthlyRetainer", value: number) {
    setSelectedServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`;
  }

  async function saveProposal() {
    if (selectedServices.length === 0) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from("proposals")
        .insert({
          lead_id: lead.id,
          proposal_number: proposalNumber,
          services: selectedServices,
          total_setup: totalSetup,
          total_monthly: totalMonthly,
          start_date: startDate || null,
          status: "draft",
          created_by: userId,
          created_at: new Date().toISOString(),
          sent_at: null,
        } as any)
        .select("id")
        .single();

      if (!error && data) {
        setSavedProposalId((data as any).id);
        setStep("done");
      }
    });
  }

  async function sendProposal() {
    if (!savedProposalId) return;
    startTransition(async () => {
      await supabase
        .from("proposals")
        .update({ status: "sent", sent_at: new Date().toISOString() } as any)
        .eq("id", savedProposalId);

      // Update lead outreach stage
      await supabase
        .from("leads")
        .update({ outreach_stage: "proposal_sent" } as any)
        .eq("id", lead.id);

      router.push(`/admin/leads/${lead.id}`);
    });
  }

  const typeKey = (lead.lead_type || "A").toUpperCase() as keyof typeof LEAD_TYPE_COPY;
  const typeContent = LEAD_TYPE_COPY[typeKey] || LEAD_TYPE_COPY.A;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create Proposal</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{lead.company_name}</span>
          {lead.city && <><span>·</span><span>{lead.city}</span></>}
          {lead.industry && <><span>·</span><span>{lead.industry}</span></>}
          <span className="ml-auto text-xs text-slate-400">{proposalNumber} · {today}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {["services", "preview", "done"].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${i < 2 ? "flex-1" : ""}`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s ? "bg-[#42CA80] text-white" :
              ["services", "preview", "done"].indexOf(step) > i ? "bg-emerald-100 text-emerald-700" :
              "bg-slate-100 text-slate-400"
            }`}>
              {["services", "preview", "done"].indexOf(step) > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium capitalize ${step === s ? "text-slate-900" : "text-slate-400"}`}>
              {s === "services" ? "Select Services" : s === "preview" ? "Preview" : "Done"}
            </span>
            {i < 2 && <div className={`flex-1 h-px ${["services", "preview", "done"].indexOf(step) > i ? "bg-emerald-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Service Selection */}
      {step === "services" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Select Services</h2>
            <p className="text-sm text-slate-500">Toggle services on, then enter setup fee and monthly retainer for each.</p>
          </div>

          <div className="space-y-3">
            {SERVICES.map(svc => {
              const isSelected = selectedServices.some(s => s.id === svc.id);
              const selected = selectedServices.find(s => s.id === svc.id);
              return (
                <div key={svc.id} className={`rounded-2xl border transition-all ${isSelected ? "border-[#42CA80] bg-emerald-50/40 shadow-sm" : "border-slate-200 bg-white"}`}>
                  <button
                    onClick={() => toggleService(svc)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`h-5 w-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${isSelected ? "bg-[#42CA80] border-[#42CA80]" : "border-slate-300 bg-white"}`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{svc.label}</p>
                      <p className="text-xs text-slate-400">{svc.layer}</p>
                    </div>
                  </button>
                  {isSelected && selected && (
                    <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-emerald-100">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5 mt-3">Setup Fee (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={selected.setupFee || ""}
                            onChange={e => updateFee(svc.id, "setupFee", Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5 mt-3">Monthly Retainer (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={selected.monthlyRetainer || ""}
                            onChange={e => updateFee(svc.id, "monthlyRetainer", Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          {selectedServices.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-5 text-white">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Proposal Total</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Setup Fee</span>
                <span className="text-lg font-bold font-mono">{formatINR(totalSetup)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                <span className="text-sm text-slate-300">Total Monthly Retainer</span>
                <span className="text-lg font-bold font-mono text-[#42CA80]">{formatINR(totalMonthly)}/mo</span>
              </div>
            </div>
          )}

          {/* Start date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-2">Proposed Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]"
            />
          </div>

          <button
            onClick={() => setStep("preview")}
            disabled={selectedServices.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            Preview Proposal <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === "preview" && (
        <div className="space-y-6">
          {/* Proposal Preview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Cover */}
            <div className="bg-slate-900 px-8 py-10 text-white">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">FortuneMarq Media & Marketing</p>
              <h2 className="text-2xl font-bold mt-2">Online Growth Proposal</h2>
              <p className="text-slate-300 mt-2 text-sm">Prepared for: <strong className="text-white">{lead.company_name}</strong>, {lead.city}</p>
              <p className="text-slate-300 text-sm">Prepared by: Jabeer — FortuneMarq</p>
              <div className="flex gap-6 mt-4 text-xs text-slate-400">
                <span>{today}</span>
                <span>{proposalNumber}</span>
              </div>
            </div>

            {/* Market Opportunity */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Market Opportunity</p>
              <p className="text-sm text-slate-700 leading-relaxed mb-2">{typeContent.intro}</p>
              <p className="text-sm text-slate-700 leading-relaxed mb-2">{typeContent.finding}</p>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{typeContent.opportunity}</p>
            </div>

            {/* Services */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">What We're Building For You</p>
              <div className="space-y-3">
                {selectedServices.map(svc => (
                  <div key={svc.id} className="flex items-center gap-3 py-2">
                    <Check className="h-4 w-4 text-[#42CA80] shrink-0" />
                    <span className="text-sm font-semibold text-slate-800">{svc.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Table */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Your Investment</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Service</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Setup Fee</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedServices.map(svc => (
                    <tr key={svc.id} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">{svc.label}</td>
                      <td className="py-2.5 text-right font-mono text-slate-800">{formatINR(svc.setupFee)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-800">{formatINR(svc.monthlyRetainer)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900">
                    <td className="py-3 font-bold text-slate-900">Total</td>
                    <td className="py-3 text-right font-bold font-mono text-slate-900">{formatINR(totalSetup)}</td>
                    <td className="py-3 text-right font-bold font-mono text-[#42CA80]">{formatINR(totalMonthly)}/mo</td>
                  </tr>
                </tfoot>
              </table>
              {selectedServices.some(s => s.id === "GOOGLE_ADS" || s.id === "META_ADS") && (
                <p className="text-xs text-slate-400 mt-3 italic">
                  * Ad spend for Google Ads and Meta Ads is your own budget, billed directly by Google/Meta. FortuneMarq charges a management fee only.
                </p>
              )}
            </div>

            {/* Next Steps */}
            <div className="px-8 py-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">What Happens Next</p>
              {[
                "Reply 'Yes, confirmed' to this proposal",
                "We send the service agreement for your records",
                "Invoice raised for setup fee",
                "Payment received → Onboarding begins within 24 hours",
                "We collect what we need and get started",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-2.5">
                  <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-slate-700">{step}</p>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                Jabeer · +91 93530 82656 · fortunemarq@gmail.com · fortunemarq.com
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("services")} className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl transition-colors">
              Back
            </button>
            <button
              onClick={saveProposal}
              disabled={isPending}
              className="flex-1 bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Save as Draft
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Done */}
      {step === "done" && savedProposalId && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Proposal Saved</h2>
          <p className="text-slate-500 mt-2 text-sm">{proposalNumber} · {lead.company_name}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-8 text-left">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Send via WhatsApp</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Copy and paste this message after attaching the proposal PDF:
            </p>
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
              {`Hi ${lead.contact_person || lead.company_name}! 😊

Really good speaking with you. As discussed, here's the proposal for ${lead.company_name} —

📄 [Attach PDF]

Everything we covered is in there — services, pricing, timelines. Have a look and let me know if you have any questions.

— Jabeer, FortuneMarq`}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={sendProposal}
              disabled={isPending}
              className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mark as Sent → Update Stage
            </button>
            <button
              onClick={() => router.push(`/admin/leads/${lead.id}`)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold px-6 py-3 rounded-2xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
