"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
    MessageCircle,
    PhoneMissed,
    UserMinus,
    Target,
    MoreHorizontal,
    Loader2,
    Check
} from "lucide-react";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";

interface Lead {
    id: string;
    phone: string | null;
    company_name: string;
    contact_person: string | null;
    industry: string | null;
    city: string | null;
}

interface WhatsAppTemplateButtonProps {
    lead: Lead;
    onOutcomeLogged?: (outcome: string) => void;
}

export default function WhatsAppTemplateButton({ lead, onOutcomeLogged }: WhatsAppTemplateButtonProps) {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sentOutcome, setSentOutcome] = useState<string | null>(null);

    const handleSend = async (outcome: 'no_answer' | 'not_interested' | 'interested') => {
        if (!lead.phone) {
            toast.error("No phone number available for this lead.");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Find correct template based on text match for niche and city
            // Defaults to 'Hubli' if lead city is not specified as per task
            const leadCity = lead.city || "Hubli";

            const { data: niche } = await (supabase.from("niches" as any)
                .select("id")
                .ilike("name", lead.industry || "")
                .single() as any);

            const { data: city } = await (supabase.from("cities" as any)
                .select("id")
                .ilike("name", leadCity)
                .single() as any);

            if (!niche || !city) {
                console.warn("Could not find matching niche or city for template matching.", { industry: lead.industry, city: leadCity });
                // Fallback or alert? The task implies templates should exist.
            }

            let templateQuery = supabase.from("whatsapp_message_templates" as any)
                .select("*, niches(name), cities(name)")
                .eq("outcome", outcome)
                .eq("is_active", true);

            if (niche) templateQuery = templateQuery.eq("niche_id", niche.id);
            if (city) templateQuery = templateQuery.eq("city_id", city.id);

            const { data: template } = await (templateQuery.limit(1).single() as any);

            if (!template) {
                toast.error("No active template found", `${outcome} in this niche/city`);
                setIsLoading(false);
                return;
            }

            // 1.5 Fetch Niche Kit for assets
            const { data: kit } = await (supabase.from("niche_kits" as any)
                .select("*")
                .eq("niche_id", niche?.id)
                .maybeSingle() as any);

            // 2. Resolve Variables
            let message = template.message_body;
            const vars = {
                "{lead_name}": lead.contact_person || "there",
                "{business_name}": lead.company_name || "your business",
                "{niche}": lead.industry || "your industry",
                "{city}": lead.city || "Hubli",
                "{market_pdf_url}": kit?.market_research_url || "[Link Coming Soon]",
                "{landing_page_url}": kit?.landing_page_url || "[Link Coming Soon]",
                "{case_study_url}": kit?.case_study_url || "[Link Coming Soon]",
            };

            Object.entries(vars).forEach(([key, val]) => {
                message = message.replaceAll(key, val);
            });

            // 3. Log the action
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("whatsapp_logs" as any).insert({
                lead_id: lead.id,
                template_id: template.id,
                outcome: outcome,
                message_sent: message,
                sent_by: user?.id
            });

            // 4. Open WhatsApp
            const cleanPhone = lead.phone.replace(/\D/g, "");
            const encodedMsg = encodeURIComponent(message);
            window.open(`https://wa.me/91${cleanPhone}?text=${encodedMsg}`, "_blank");

            setSentOutcome(outcome);
            setIsOpen(false);

            // 5. Prompt to update CRM status (simulated by calling callback)
            if (onOutcomeLogged && confirm(`Message sent! Would you like to mark this lead as ${outcome.replace('_', ' ')} in the CRM?`)) {
                onOutcomeLogged(outcome);
            }

        } catch (error) {
            console.error("WhatsApp Send Error:", error);
            toast.error("Error sending WhatsApp message.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg",
                    isOpen ? "bg-emerald-600 text-white" : "bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50"
                )}
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                WhatsApp
                <MoreHorizontal className="h-3 w-3 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[70] animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Outcome</p>
                    </div>

                    <button
                        onClick={() => handleSend('no_answer')}
                        className="w-full flex items-center gap-3 p-3 text-sm text-slate-700 hover:bg-amber-50 rounded-xl transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <PhoneMissed className="h-4 w-4" />
                        </div>
                        <span className="font-medium">No Answer</span>
                        {sentOutcome === 'no_answer' && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                    </button>

                    <button
                        onClick={() => handleSend('not_interested')}
                        className="w-full flex items-center gap-3 p-3 text-sm text-slate-700 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <UserMinus className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Not Interested</span>
                        {sentOutcome === 'not_interested' && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                    </button>

                    <button
                        onClick={() => handleSend('interested')}
                        className="w-full flex items-center gap-3 p-3 text-sm text-slate-700 hover:bg-emerald-50 rounded-xl transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Target className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Interested</span>
                        {sentOutcome === 'interested' && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                    </button>
                </div>
            )}
        </div>
    );
}
