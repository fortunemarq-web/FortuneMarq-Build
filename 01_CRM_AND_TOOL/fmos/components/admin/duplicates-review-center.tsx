"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    Users,
    Search,
    GitMerge,
    Trash2,
    AlertCircle,
    Check,
    ShieldAlert,
    Loader2,
    RefreshCw,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";
import MergeLeadWizard from "./MergeLeadWizard";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/badge";

export default function DuplicatesReviewCenter() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [activeMergePair, setActiveMergePair] = useState<any | null>(null);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        const supabase = createClient();

        // Fetch candidates with lead details
        // We need to join leads twice: for primary and duplicate
        // Supabase JS join syntax:
        const { data, error } = await supabase
            .from("duplicate_candidates")
            .select(`
        *,
        primary:primary_id (id, company_name, city, phone, email, status),
        duplicate:duplicate_id (id, company_name, city, phone, email, status)
      `)
            .eq("status", "open")
            .order("confidence", { ascending: false });

        if (!error) {
            setCandidates(data || []);
        }
        setLoading(false);
    };

    const runScan = async () => {
        setScanning(true);
        try {
            await fetch("/api/leads/duplicates/scan", { method: "POST" });
            await fetchCandidates();
            toast.success("Scan complete");
        } catch (e) {
            toast.error("Scan failed");
        } finally {
            setScanning(false);
        }
    };

    const handleIgnore = async (id: string) => {
        const supabase = createClient();
        await supabase.from("duplicate_candidates").update({ status: "ignored" }).eq("id", id);
        setCandidates(prev => prev.filter(c => c.id !== id));
    };

    if (!loading && candidates.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mb-4 border border-brand-line">
                    <Check className="h-8 w-8 text-brand-deep" />
                </div>
                <h2 className="font-display text-xl font-semibold text-slate-900">No duplicates found</h2>
                <p className="text-slate-500 mt-2 mb-6">Your data looks clean!</p>
                <Button onClick={runScan} disabled={scanning} variant="secondary" className="mx-auto">
                    {scanning ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                    {scanning ? "Scanning..." : "Run Scan Now"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-400" /> Review Duplicates
                </h2>
                <Button onClick={runScan} disabled={scanning} variant="secondary" size="sm">
                    {scanning ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Scan
                </Button>
            </div>

            <div className="grid gap-4">
                {candidates.map((cand) => {
                    const confTone: Tone =
                        cand.confidence >= 90 ? "danger" : cand.confidence >= 70 ? "warning" : "info";
                    return (
                    <Card key={cand.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <Badge tone={confTone} size="sm" className="uppercase tracking-wider">
                                    {cand.match_type} Match ({cand.confidence}%)
                                </Badge>
                                <span className="text-xs text-slate-500">ID: {cand.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => handleIgnore(cand.id)} variant="ghost" size="sm">Ignore</Button>
                                <Button onClick={() => setActiveMergePair(cand)} size="sm">
                                    <GitMerge className="h-3.5 w-3.5" /> Merge
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            {/* Connector Line */}
                            <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-line -translate-x-1/2"></div>

                            {/* Primary */}
                            <DuplicateCard lead={cand.primary} label="Primary Lead" />

                            {/* Duplicate */}
                            <DuplicateCard lead={cand.duplicate} label="Potential Duplicate" />
                        </div>
                    </Card>
                    );
                })}
            </div>

            {activeMergePair && (
                <MergeLeadWizard
                    pair={activeMergePair}
                    onClose={() => setActiveMergePair(null)}
                    onSuccess={() => {
                        setActiveMergePair(null);
                        setCandidates(prev => prev.filter(c => c.id !== activeMergePair.id));
                        toast.success("Merge successful");
                    }}
                />
            )}
        </div>
    );
}

function DuplicateCard({ lead, label }: { lead: any, label: string }) {
    if (!lead) return <div className="p-4 rounded-lg bg-slate-50 border border-line text-slate-500 text-sm">Lead Removed</div>;
    return (
        <div className="p-4 rounded-lg bg-slate-50 border border-line space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <h3 className="font-display text-lg font-semibold text-slate-900 truncate">{lead.company_name}</h3>
            <div className="space-y-1 text-sm text-slate-600">
                {lead.city && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {lead.city}</p>}
                {lead.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {lead.phone}</p>}
                {lead.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {lead.email}</p>}
                {lead.status && <Badge tone="neutral" size="sm" className="mt-2">{lead.status}</Badge>}
            </div>
        </div>
    );
}
