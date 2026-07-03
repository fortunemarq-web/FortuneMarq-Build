"use client";

import { useState, useEffect } from "react";
import { Trash2, Search, Filter, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase"; // Client-side search
import { deleteLeadsByIndustry, deleteSingleLead } from "@/actions/delete-data"; // Server-side delete
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";

// Use the existing industries from config (could be imported to share source of truth)
const FALLBACK_INDUSTRIES = [
    "Dental Clinics",
    "Physiotherapy Clinics",
    "Skin Clinics",
    "IVF Fertility Clinics",
    "Diagnostics Labs",
    "NEET / Medical Entrance Coaching",
    "JEE / Engineering Entrance Coaching",
    "School Tuition / Academic Coaching",
    "Computer / IT Training Institutes",
    "IELTS / Spoken English / Study Abroad",
    "Real Estate",
    "Modular Kitchen",
    "Interior Designers",
    "Car Rental and Taxi Services"
];

export default function DataManager() {
    const [activeTab, setActiveTab] = useState<"industry" | "single">("industry");

    // Industry Delete State
    const [selectedIndustry, setSelectedIndustry] = useState("");
    const [industryDeleteStatus, setIndustryDeleteStatus] = useState<"idle" | "confirming" | "deleting" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [dbIndustries, setDbIndustries] = useState<string[]>([]);

    useEffect(() => {
        const fetchIndustries = async () => {
            const supabase = createClient();
            const { data } = await supabase.from("leads").select("industry");
            if (data) {
                // Get unique industries from DB, filter out nulls
                const unique = Array.from(new Set((data as any[]).map(d => d.industry).filter(Boolean))) as string[];
                setDbIndustries(unique.sort());
            }
        };
        fetchIndustries();
    }, []);

    // Single Lead Delete State
    const [searchQuery, setSearchQuery] = useState(""); // Phone or Name
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        if (activeTab === "single") {
            const fetchRecent = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from("leads")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(20);
                if (data) setSearchResults(data);
            };
            fetchRecent();
        }
    }, [activeTab]);

    // Handlers
    const handleDeleteIndustry = async () => {
        if (!selectedIndustry) return;
        setIndustryDeleteStatus("deleting");
        const res = await deleteLeadsByIndustry(selectedIndustry);
        if (res.success) {
            setIndustryDeleteStatus("success");
            setStatusMessage(res.message);
            setSelectedIndustry("");
        } else {
            setIndustryDeleteStatus("error");
            setStatusMessage(res.message);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const supabase = createClient();

        // Simple search by Name or Phone
        const { data, error } = await supabase
            .from("leads")
            .select("*")
            .or(`company_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
            .limit(10);

        if (data) setSearchResults(data);
        setIsSearching(false);
    };

    const handleDeleteSingle = async (id: string) => {
        const ok = await promptModal({ title: "Delete this lead?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete permanently" }] });
        if (!ok) return;
        setDeletingId(id);
        const res = await deleteSingleLead(id);
        if (res.success) {
            // Remove from local list
            setSearchResults(prev => prev.filter(l => l.id !== id));
        } else {
            toast.error("Failed to delete", res.message);
        }
        setDeletingId(null);
    };

    return (
        <div className="w-full max-w-4xl space-y-8">
            <div className="flex justify-end">
                <button
                    onClick={async () => {
                        // Quick hack to show distribution in alert for debugging
                        const { analyzeIndustryDistribution } = await import("@/actions/analyze-data");
                        const dist = await analyzeIndustryDistribution();
                        toast.info("Industry distribution", JSON.stringify(dist, null, 2));
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                >
                    Inspect Data Distribution
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-surface p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("industry")}
                    className={clsx(
                        "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                        activeTab === "industry" ? "bg-slate-200 text-slate-900 shadow" : "text-slate-600 hover:text-[#999]"
                    )}
                >
                    Bulk Delete Industry
                </button>
                <button
                    onClick={() => setActiveTab("single")}
                    className={clsx(
                        "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                        activeTab === "single" ? "bg-slate-200 text-slate-900 shadow" : "text-slate-600 hover:text-[#999]"
                    )}
                >
                    Delete Individual Records
                </button>
            </div>

            {/* --- Industry Bulk Delete Panel --- */}
            {activeTab === "industry" && (
                <div className="bg-slate-50 border border-[#2a2a2a] rounded-2xl p-6 animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <Trash2 className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Bulk Delete by Industry</h2>
                            <p className="text-sm text-slate-600">Remove all leads and market data for a specific sector.</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Industry to Wipe</label>
                        <select
                            value={selectedIndustry}
                            onChange={(e) => { setSelectedIndustry(e.target.value); setIndustryDeleteStatus("idle"); }}
                            className="w-full bg-surface border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors"
                            disabled={industryDeleteStatus === "deleting"}
                        >
                            <option value="">-- Choose Industry --</option>
                            <option value="uncategorized" className="text-red-400 font-bold">⚠️ Uncategorized / No Industry (Clean Up)</option>

                            <optgroup label="Found in Database (Actual Data)">
                                {dbIndustries.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </optgroup>

                            {/* Only show fallback if not in DB list to avoid dupes, or just list them all? 
                                 Actually, for cleanup, DB list is what matters. 
                                 But let's keep the official list for reference if needed, 
                                 though standardizing on DB List is better for "Clean Up" tool.
                                 Let's show both merged, or just DB list? 
                                 If the user wants to delete "Dentist", it MUST appear here.
                                 If the DB has "Dentist", it will appear in dbIndustries.
                             */}
                        </select>

                        {/* Confirmation UI */}
                        {selectedIndustry && industryDeleteStatus === "idle" && (
                            <button
                                onClick={() => setIndustryDeleteStatus("confirming")}
                                className="w-full py-3 bg-red-600/10 border border-red-600/20 text-red-500 font-bold rounded-xl hover:bg-red-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" /> Wipe All "{selectedIndustry}" Data
                            </button>
                        )}

                        {industryDeleteStatus === "confirming" && (
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in duration-200">
                                <div className="flex items-center gap-2 text-red-400 font-bold">
                                    <AlertTriangle className="h-4 w-4" /> Warning: Irreversible Action
                                </div>
                                <p className="text-xs text-red-300">
                                    You are about to delete ALL leads, calls, and notes associated with
                                    <span className="font-bold underline ml-1">{selectedIndustry}</span>.
                                </p>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleDeleteIndustry} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700">Yes, Delete Everything</button>
                                    <button onClick={() => setIndustryDeleteStatus("idle")} className="flex-1 bg-transparent border border-red-500/30 text-red-400 py-2 rounded-lg text-sm font-bold hover:bg-red-500/10">Cancel</button>
                                </div>
                            </div>
                        )}

                        {industryDeleteStatus === "deleting" && (
                            <div className="flex items-center justify-center gap-2 text-slate-500 py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-900" /> Deleting data...
                            </div>
                        )}

                        {industryDeleteStatus === "success" && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold flex flex-col gap-2">
                                <p>✓ {statusMessage}</p>
                                <button onClick={() => setIndustryDeleteStatus("idle")} className="text-xs underline self-start opacity-70 hover:opacity-100">Reset Form</button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* --- Single Record Delete Panel --- */}
            {activeTab === "single" && (
                <div className="bg-slate-50 border border-[#2a2a2a] rounded-2xl p-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Find & Delete Records</h2>
                            <p className="text-sm text-slate-600">Search for a business name or phone number to remove.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Search by Business Name or Phone..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-surface border border-slate-300 text-slate-900 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-surface text-slate-900 font-bold px-6 rounded-xl hover:bg-white/[0.06] disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </button>
                    </form>

                    {/* Results List */}
                    <div className="space-y-2">
                        {searchResults.length > 0 ? (
                            searchResults.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between p-4 bg-surface border border-[#2a2a2a] rounded-xl group hover:border-slate-300 transition-colors">
                                    <div>
                                        <h3 className="text-slate-900 font-bold">{lead.company_name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {lead.lead_type && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                    lead.lead_type === "inbound" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                )}>
                                                    {lead.lead_type}
                                                </span>
                                            )}
                                            {lead.status && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-200 text-slate-500 border-slate-300">
                                                    {lead.status}
                                                </span>
                                            )}
                                            {lead.tags && Array.isArray(lead.tags) && lead.tags.map((tag: string) => (
                                                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono mt-1.5">{lead.phone || "No Phone"} • {lead.industry} • {lead.city}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSingle(lead.id)}
                                        disabled={deletingId === lead.id}
                                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete this record"
                                    >
                                        {deletingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            ))
                        ) : (
                            searchQuery && !isSearching && <p className="text-slate-600 text-center italic py-4">No records found matching "{searchQuery}"</p>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
