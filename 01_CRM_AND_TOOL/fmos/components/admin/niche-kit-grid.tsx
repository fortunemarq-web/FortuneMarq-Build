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
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {niches.map((niche) => {
                    const kit = getKitForNiche(niche.id);
                    const isComplete = kit && kit.market_research_url && kit.case_study_url && kit.landing_page_url;

                    return (
                        <button
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche)}
                            className={clsx(
                                "group relative flex flex-col items-center rounded-xl border bg-surface p-6 text-center transition-colors",
                                isComplete ? "border-brand-line hover:border-brand" : "border-line hover:border-line-strong"
                            )}
                        >
                            <div className="mb-3 text-4xl transition-transform group-hover:scale-110">
                                {niche.icon || "📁"}
                            </div>
                            <h3 className="mb-1 text-sm font-semibold text-slate-900">{niche.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className={clsx(
                                    "h-2 w-2 rounded-full",
                                    isComplete ? "bg-brand" : "bg-slate-300"
                                )} />
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {isComplete ? "Kit Ready" : "Incomplete"}
                                </span>
                            </div>
                            {isComplete && (
                                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-brand-deep opacity-60" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Modal */}
            {selectedNiche && (
                <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-slate-900/50 p-4 duration-200">
                    <div className="relative w-full max-w-xl animate-in zoom-in-95 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg duration-200">
                        <div className="flex items-center justify-between border-b border-line bg-slate-50 p-8">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{selectedNiche.icon}</div>
                                <div>
                                    <h2 className="font-display text-xl font-semibold text-slate-900">{selectedNiche.name} Kit</h2>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configure Assets</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNiche(null)}
                                className="rounded-full border border-transparent p-2 transition-colors hover:border-line hover:bg-slate-100"
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
            toast.error("File upload failed", "Make sure the 'niche-kits' bucket exists in your Supabase Storage.");
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

            const { data, error } = await supabase.from("niche_kits")
                .upsert(payload, { onConflict: "niche_id" })
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
            toast.error("Failed to save kit data");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Landing Page URL */}
            <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Landing Page URL</label>
                <div className="group relative">
                    <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-deep" />
                    <input
                        type="url"
                        placeholder="https://example.com/lp/real-estate"
                        className="w-full rounded-lg border border-line bg-surface py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-brand-deep focus:ring-2 focus:ring-brand-ring"
                        value={landingPageUrl}
                        onChange={e => setLandingPageUrl(e.target.value)}
                    />
                </div>
            </div>

            {/* Asset Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Market Research */}
                <div className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Market Research</span>
                        </div>
                        {marketResearchUrl && (
                            <a href={marketResearchUrl} target="_blank" className="text-slate-400 transition-colors hover:text-slate-900">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    <label className="group flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line transition-colors hover:border-brand hover:bg-surface">
                        {uploadingField === 'market' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-brand-deep" />
                        ) : marketResearchUrl ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="mb-1 h-6 w-6 text-brand-deep" />
                                <span className="text-[11px] font-medium text-slate-500">PDF Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileUp className="mb-1 h-6 w-6 text-slate-700 transition-colors group-hover:text-brand-deep" />
                                <span className="text-[11px] font-medium text-slate-500">Upload PDF</span>
                            </div>
                        )}
                        <input type="file" accept=".pdf" hidden onChange={(e) => handleFileUpload(e, 'market')} disabled={!!uploadingField} />
                    </label>
                </div>

                {/* Case Study */}
                <div className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Case Study</span>
                        </div>
                        {caseStudyUrl && (
                            <a href={caseStudyUrl} target="_blank" className="text-slate-400 transition-colors hover:text-slate-900">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    <label className="group flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line transition-colors hover:border-brand hover:bg-surface">
                        {uploadingField === 'case' ? (
                            <Loader2 className="h-6 w-6 animate-spin text-brand-deep" />
                        ) : caseStudyUrl ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="mb-1 h-6 w-6 text-brand-deep" />
                                <span className="text-[11px] font-medium text-slate-500">PDF Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileUp className="mb-1 h-6 w-6 text-slate-700 transition-colors group-hover:text-brand-deep" />
                                <span className="text-[11px] font-medium text-slate-500">Upload PDF</span>
                            </div>
                        )}
                        <input type="file" accept=".pdf" hidden onChange={(e) => handleFileUpload(e, 'case')} disabled={!!uploadingField} />
                    </label>
                </div>
            </div>

            <Button
                disabled={isSaving || !!uploadingField}
                onClick={handleSave}
                size="lg"
                className="mt-4 w-full"
            >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Niche Kit
            </Button>
        </div>
    );
}
