"use client";

import { useState } from "react";
import { captureInboundLead } from "@/lib/automations/inbound-leads";
import { Loader2, CheckCircle2, ChevronRight, User, Mail, Phone, Building2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";

interface LeadFormProps {
    niche: string;
    city: string;
}

export default function LeadCaptureForm({ niche, city }: LeadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        company_name: "",
        contact_person: "",
        email: "",
        phone: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Attribution: UTMs + click ids from the URL the visitor landed on
        const params = new URLSearchParams(window.location.search);
        const result = await captureInboundLead({
            ...formData,
            industry: niche,
            city: city,
            utm: {
                source: params.get("utm_source") || undefined,
                medium: params.get("utm_medium") || undefined,
                campaign: params.get("utm_campaign") || undefined,
                content: params.get("utm_content") || undefined,
                term: params.get("utm_term") || undefined,
            },
            gclid: params.get("gclid") || undefined,
            fbclid: params.get("fbclid") || undefined,
            landing_page: window.location.pathname + window.location.search,
            referrer_url: document.referrer || undefined,
        });

        if (result.success) {
            setIsSuccess(true);
        } else {
            toast.error(result.message || "Something went wrong. Please try again.");
        }
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-white">Application Received!</h3>
                <p className="text-emerald-100/60 max-w-xs">
                    Our strategist for {niche} in {city} will contact you shortly to confirm your booking.
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 text-emerald-400 text-sm font-bold hover:underline"
                >
                    Submit another response
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden group">
            {/* Gloss Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="space-y-1 mb-6 relative">
                <h3 className="text-xl font-bold text-white">Check Availability</h3>
                <p className="text-[#64748b] text-sm font-medium">We only work with 1 {niche} per city to ensure zero conflict of interest.</p>
            </div>

            <div className="space-y-4 relative">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Business Name</label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            required
                            type="text"
                            placeholder="e.g. Apex Dental Care"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Contact Person</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            required
                            type="text"
                            placeholder="Your name"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                            value={formData.contact_person}
                            onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Direct Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                required
                                type="tel"
                                placeholder="91XXXXXXXXXX"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                required
                                type="email"
                                placeholder="name@business.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                disabled={isSubmitting}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Secure Your Territory"}
                <ChevronRight className="h-5 w-5" />
            </button>

            <p className="text-center text-[10px] text-slate-600 font-medium">
                By submitting, you agree to our exclusivity terms. We only take 1 client per zip code.
            </p>
        </form>
    );
}
