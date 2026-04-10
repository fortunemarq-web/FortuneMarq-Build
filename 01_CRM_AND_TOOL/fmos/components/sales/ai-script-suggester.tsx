"use client";

import { useState, useEffect } from "react";
import { suggestCallOpener } from "@/app/api/ai/actions";
import { Sparkles, RefreshCcw, Copy, Check, Loader2 } from "lucide-react";
import clsx from "clsx";

interface AIScriptSuggesterProps {
    niche: string;
    businessName: string;
    city: string;
}

export default function AIScriptSuggester({ niche, businessName, city }: AIScriptSuggesterProps) {
    const [script, setScript] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchScript = async () => {
        setIsLoading(true);
        try {
            const result = await suggestCallOpener(niche, businessName, city);
            setScript(result);
        } catch (error) {
            setScript("Error generating script. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchScript();
    }, [niche, businessName, city]);

    const handleCopy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/50 backdrop-blur-sm border border-[#42CA80]/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Suggested Opening</span>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={fetchScript}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-500"
                    >
                        <RefreshCcw className={clsx("h-3.5 w-3.5", isLoading && "animate-spin")} />
                    </button>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-500"
                    >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            <div className="relative min-h-[60px]">
                {isLoading ? (
                    <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-2.5 bg-slate-200 rounded-full w-4/5" />
                        <div className="h-2.5 bg-slate-200 rounded-full w-full" />
                        <div className="h-2.5 bg-slate-200 rounded-full w-2/3" />
                    </div>
                ) : (
                    <p className="text-sm text-slate-600 italic leading-relaxed whitespace-pre-line">
                        "{script}"
                    </p>
                )}
            </div>

            {/* Ambient Glow */}
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 blur-2xl rounded-full group-hover:bg-emerald-500/10 transition-colors" />
        </div>
    );
}
