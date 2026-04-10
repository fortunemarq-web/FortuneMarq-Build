"use client";

import { useState } from "react";
import { handleObjection } from "@/app/api/ai/actions";
import { MessageSquare, Send, Copy, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

interface AIObjectionHandlerProps {
    niche: string;
    city: string;
}

export default function AIObjectionHandler({ niche, city }: AIObjectionHandlerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const result = await handleObjection(niche, city, query);
            setResponse(result);
        } catch (error) {
            setResponse("Error generating response. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text.replace(/^\d\.\s*/, ""));
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const suggestions = response.split(/\n?(?=\d\.)/).filter(s => s.trim());

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-amber-500/10 p-1.5 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Objection Helper</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                    <form onSubmit={onSubmit} className="relative">
                        <input
                            type="text"
                            placeholder="What did the prospect say?"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:border-amber-500 outline-none transition-all"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </form>

                    {response && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Suggested Responses</p>
                            {suggestions.map((s, i) => (
                                <div key={i} className="group relative bg-slate-50 border border-slate-100 p-3 rounded-xl hover:border-amber-200 transition-all">
                                    <p className="text-xs text-slate-600 leading-relaxed pr-8">{s}</p>
                                    <button
                                        onClick={() => handleCopy(s, i)}
                                        className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-amber-100 rounded-lg transition-all text-amber-600"
                                    >
                                        {copiedIndex === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
