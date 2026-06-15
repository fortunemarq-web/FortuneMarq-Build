"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Copy, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Lead {
  id: string;
  company_name: string;
  city: string | null;
  industry: string | null;
  lead_type: string | null;
  outreach_stage: string | null;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  lead_type: string | null;
  variables: string[];
  sent_by: string | null;
}

interface WhatsAppTemplatePickerProps {
  lead: Lead;
  actorId: string;
  onSent?: () => void;
  onClose: () => void;
}

// Stage → relevant categories
const STAGE_CATEGORIES: Record<string, string[]> = {
  touch1_pending: ["CURIOSITY"],
  curiosity_sent: ["BOT_REPLY"],
  pdf_sent: ["FOLLOWBACK_REMINDER", "OUTCOME_TRIGGERED"],
  follow_up_due: ["FOLLOWBACK_REMINDER", "OUTCOME_TRIGGERED"],
  meeting_booked: ["POST_MEETING"],
  proposal_sent: ["POST_MEETING"],
};

function substituteVariables(template: string, lead: Lead): string {
  return template
    .replace(/{{businessName}}/g, lead.company_name || "your business")
    .replace(/{{city}}/g, lead.city || "your city")
    .replace(/{{niche}}/g, lead.industry || "your niche")
    .replace(/{{searchVolume}}/g, "2,400")
    .replace(/{{landingPageLink}}/g, "https://fortunemarq.com")
    .replace(/{{name}}/g, lead.company_name || "there");
}

export default function WhatsAppTemplatePicker({ lead, actorId, onSent, onClose }: WhatsAppTemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await (supabase
        .from("whatsapp_templates")
        .select("id, name, content, category, lead_type, variables, sent_by")
        .order("category") as any);
      if (error) console.error("Failed to load WhatsApp templates:", error);
      setTemplates((data || []) as Template[]);
      setLoading(false);
    }
    load();
  }, []);

  const leadType = (lead.lead_type || "").toUpperCase();
  const stage = lead.outreach_stage || "touch1_pending";
  const relevantCategories = STAGE_CATEGORIES[stage] || [];

  // If lead has no type assigned, show all templates (don't filter by lead_type).
  // If lead has a type, show type-specific templates + universal (null lead_type) templates.
  const typeMatches = (t: Template) =>
    !leadType || !t.lead_type || t.lead_type.toUpperCase() === leadType;

  // Filter: stage-relevant first, then rest
  const stageTemplates = templates.filter(t =>
    relevantCategories.includes(t.category) && typeMatches(t)
  );
  const otherTemplates = templates.filter(t =>
    !relevantCategories.includes(t.category) && typeMatches(t)
  );

  const selected = templates.find(t => t.id === selectedId);
  const previewText = selected ? substituteVariables(selected.content, lead) : null;

  function copyToClipboard() {
    if (!previewText) return;
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const markAsSent = async () => {
    if (!selected || !lead.id || !actorId) return;

    const { error } = await supabase.from("outreach_logs").insert({
      lead_id: lead.id,
      touch_type: "whatsapp_sent",
      outcome: selected.name,
      pdf_name: null,
      notes: `Template: ${selected.name}`,
      actor_id: actorId,
    });

    if (!error) {
      setJustSent(true);
      onSent?.();
      setTimeout(() => setJustSent(false), 3000);
    }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    CURIOSITY: "Curiosity Message",
    BOT_REPLY: "Bot Reply",
    OUTCOME_TRIGGERED: "Outcome Triggered",
    FOLLOWBACK_REMINDER: "Follow-Back Reminder",
    POST_MEETING: "Post Meeting",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900">WhatsApp Template Picker</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{lead.company_name} · Stage: <span className="font-medium text-slate-600">{stage.replace(/_/g, " ")}</span></span>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Template List */}
          <div className="w-64 shrink-0 border-r border-slate-100 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
                <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">No templates found.</p>
                <p className="text-[10px] mt-1 text-slate-300">Check Supabase — templates may not be seeded.</p>
              </div>
            ) : (
              <div className="p-2">
                {stageTemplates.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-[#42CA80] uppercase tracking-wider px-2 py-2">Recommended for this stage</p>
                    {stageTemplates.map(t => (
                      <button key={t.id} onClick={() => setSelectedId(t.id)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-all ${selectedId === t.id ? "bg-emerald-50 border border-[#42CA80]" : "hover:bg-slate-50 border border-transparent"}`}>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{CATEGORY_LABELS[t.category] || t.category}</p>
                      </button>
                    ))}
                  </>
                )}
                {otherTemplates.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-2 mt-2">Other Templates</p>
                    {otherTemplates.map(t => (
                      <button key={t.id} onClick={() => setSelectedId(t.id)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-all ${selectedId === t.id ? "bg-slate-100 border border-slate-300" : "hover:bg-slate-50 border border-transparent"}`}>
                        <p className="text-xs font-semibold text-slate-700 leading-snug">{t.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{CATEGORY_LABELS[t.category] || t.category}</p>
                      </button>
                    ))}
                  </>
                )}
                {stageTemplates.length === 0 && otherTemplates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-400">
                    <p className="text-xs">No templates match this lead type.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Select a template to preview</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{selected.name}</p>
                <div className="bg-[#e9f5d5] rounded-2xl rounded-tl-none px-4 py-3.5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans border border-[#d4efa8]">
                  {previewText}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">Variables substituted from lead data.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selected && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={copyToClipboard}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-sm transition-all border border-slate-300 hover:bg-slate-50 text-slate-700`}
            >
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Message</>}
            </button>
            <button
              onClick={markAsSent}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-sm transition-colors ${
                justSent
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {justSent ? "✓ Logged!" : "Mark as Sent"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
