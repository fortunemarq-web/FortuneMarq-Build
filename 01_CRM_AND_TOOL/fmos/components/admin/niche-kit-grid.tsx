"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
    FileText,
    Globe,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink,
    FileUp
} from "lucide-react";
import clsx from "clsx";
import { logAudit } from "@/lib/audit";

interface Niche {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

interface NicheKit {
    id: string;
    niche_id: string;
    market_research_url: string;
    case_study_url: string;
    landing_page_url: string;
}

export default function NicheKitGrid({
    initialNiches,
    initialKits
}: {
    initialNiches: Niche[],
    initialKits: NicheKit[]
}) {
    const [niches] = useState(initialNiches);
    const [kits, setKits] = useState(initialKits);
    const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);

    const getKitForNiche = (nicheId: string) => kits.find(k => k.niche_id === nicheId);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {niches.map((niche) => {
                    const kit = getKitForNiche(niche.id);
                    const isComplete = kit && kit.market_research_url && kit.case_study_url && kit.landing_page_url;

                    return (
                        <button
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche)}
                            className={clsx(
                                "relative flex flex-col items-center p-6 rounded-2xl bg-white border-2 text-center transition-all hover:shadow-xl group",
                                isComplete ? "border-emerald-500/10 hover:border-emerald-500/30" : "border-slate-100 hover:border-slate-300"
                            )}
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                {niche.icon || "📁"}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">{niche.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className={clsx(
                                    "w-2 h-2 rounded-full",
                                    isComplete ? "bg-emerald-500" : "bg-slate-300"
                                )} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {isComplete ? "Kit Ready" : "Incomplete"}
                                </span>
                            </div>
                            {isComplete && (
                                <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-emerald-500 opacity-60" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Modal */}
            {selectedNiche && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{selectedNiche.icon}</div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedNiche.name} Kit</h2>
                                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Configure Assets</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNiche(null)}
                                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8">
                            <NicheKitEditor
                                niche={selectedNiche}
                                kit={getKitForNiche(selectedNiche.id)}
                                onSave={(newKit) => {
                                    setKits(prev => {
                                        const idx = prev.findIndex(k => k.niche_id === newKit.niche_id);
                                        if (idx >= 0) {
                                            const next = [...prev];
                                            next[idx] = newKit;
                                            return next;
                                        }
                                        return [...prev, newKit];
                                    });
                                    setSelectedNiche(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NicheKitEditor({ niche, kit, onSave }: { niche: Niche, kit?: NicheKit, onSave: (kit: NicheKit) => void }) {
    const [landingPageUrl, setLandingPageUrl] = useState(kit?.landing_page_url || "");
    const [marketResearchUrl, setMarketResearchUrl] = useState(kit?.market_research_url || "");
    const [caseStudyUrl, setCaseStudyUrl] = useState(kit?.case_study_url || "");
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const supabase = createClient();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'market' | 'case') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(field);

        try {
            const fileName = `${niche.slug}/${field}_${Date.now()}.pdf`;
            const { data, error } = await supabase.storage
                .from('niche-kits')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('niche-kits')
                .getPublicUrl(fileName);

            if (field === 'market') setMarketResearchUrl(publicUrl);
            else setCaseStudyUrl(publicUrl);

        } catch (err) {
            console.error(err);
            alert("File upload failed. Make sure the 'niche-kits' bucket exists in your Supabase Storage.");
        } finally {
            setUploadingField(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                niche_id: niche.id,
                market_research_url: marketResearchUrl,
                case_study_url: caseStudyUrl,
                landing_page_url: landingPageUrl
            };

            const { data, error } = await supabase.from("niche_kits" as any)
                .upsert(payload)
                .select()
                .single();

            const kitData = data as any;
            if (error) throw error;

            await logAudit({
                action: 'update',
                resourceType: 'niche_kit',
                resourceId: kitData.id,
                resourceLabel: `Updated ${niche.name} Niche Kit`,
                newValue: payload
            });

            onSave(kitData);
        } catch (err) {
            console.error(err);
            alert("Failed to save kit data.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Landing Page URL */}
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Landing Page URL</label>
                <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#42CA80] transition-colors" />
                    <input
                        type="url"
                        placeholder="https://example.com/lp/real-estate"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-[#42CA80] outline-none transition-all"
                        value={landingPageUrl}
                        onChange={e => setLandingPageUrl(e.target.value)}
                    />
                </div>
            </div>

            {/* Asset Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Market Research */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#42CA80]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Market Research</span>
                        </div>
                        {marketResearchUrl && (
                            <a href={marketResearchUrl} target="_blank" className="text-slate-400 hover:text-slate-900 transition-colors">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#42CA80] hover:bg-white transition-all cursor-pointer group">
                        {uploadingField === 'market' ? (
                            <Loader2 className="h-6 w-6 text-[#42CA80] animate-spin" />
                        ) : marketResearchUrl ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                                <span className="text-[10px] font-bold text-slate-500">PDF Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileUp className="h-6 w-6 text-slate-300 group-hover:text-[#42CA80] mb-1 transition-colors" />
                                <span className="text-[10px] font-bold text-slate-500">Upload PDF</span>
                            </div>
                        )}
                        <input type="file" accept=".pdf" hidden onChange={(e) => handleFileUpload(e, 'market')} disabled={!!uploadingField} />
                    </label>
                </div>

                {/* Case Study */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#42CA80]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Case Study</span>
                        </div>
                        {caseStudyUrl && (
                            <a href={caseStudyUrl} target="_blank" className="text-slate-400 hover:text-slate-900 transition-colors">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#42CA80] hover:bg-white transition-all cursor-pointer group">
                        {uploadingField === 'case' ? (
                            <Loader2 className="h-6 w-6 text-[#42CA80] animate-spin" />
                        ) : caseStudyUrl ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                                <span className="text-[10px] font-bold text-slate-500">PDF Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileUp className="h-6 w-6 text-slate-300 group-hover:text-[#42CA80] mb-1 transition-colors" />
                                <span className="text-[10px] font-bold text-slate-500">Upload PDF</span>
                            </div>
                        )}
                        <input type="file" accept=".pdf" hidden onChange={(e) => handleFileUpload(e, 'case')} disabled={!!uploadingField} />
                    </label>
                </div>
            </div>

            <button
                disabled={isSaving || !!uploadingField}
                onClick={handleSave}
                className="w-full bg-[#42CA80] hover:bg-[#3bb572] text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Niche Kit
            </button>
        </div>
    );
}
