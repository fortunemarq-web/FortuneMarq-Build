"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle, DollarSign, Clock } from "lucide-react";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

// Every change-request status maps to one of the five tones.
const STATUS_TONE: Record<string, Tone> = {
    requested: "neutral",
    reviewing: "info",
    approved: "brand",
    rejected: "danger",
    implemented: "brand",
};

interface ChangeRequest {
    id: string;
    title: string;
    description: string;
    status: string; // requested, reviewing, approved, rejected, implemented
    priority?: string;
    impact_cost?: number;
    impact_timeline_days?: number;
    created_at: string;
    decision_note?: string;
}

export default function ChangeRequestBoard({ projectId, initialRequests, isClientView = false }: { projectId: string, initialRequests: ChangeRequest[], isClientView?: boolean }) {
    const [requests, setRequests] = useState(initialRequests);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ title: "", description: "", priority: "medium" });
    const supabase = createClient();

    const addRequest = async () => {
        if (!newItem.title) return;
        try {
            const { data, error } = await supabase.from("change_requests").insert({
                project_id: projectId,
                title: newItem.title,
                description: newItem.description,
                priority: newItem.priority,
                status: 'requested'
            }).select().single();

            if (error) throw error;
            if (data) setRequests([data as any, ...requests]);
            setIsAdding(false);
            setNewItem({ title: "", description: "", priority: "medium" });
            toast.success("Change request submitted");
        } catch (e) {
            console.error(e);
            toast.error("Error submitting request");
        }
    };

    const updateStatus = async (id: string, status: string, note?: string) => {
        // Only PM can do this usually
        try {
            const updates: any = { status };
            if (note) updates.decision_note = note;

            await supabase.from("change_requests").update(updates).eq("id", id);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        } catch (e) { console.error(e); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-xl font-semibold text-slate-900">Change Requests (Scope)</h2>
                <Button onClick={() => setIsAdding(!isAdding)} variant="primary" size="sm">
                    Request Change
                </Button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 border border-line p-4 rounded-xl mb-6">
                    <h3 className="text-slate-900 font-semibold mb-3">Submit Change Request</h3>
                    <div className="space-y-3">
                        <Input type="text" placeholder="Summary of change" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                        <Textarea placeholder="Detailed description and rationale..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="h-24" />
                        <Select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })} className="w-auto">
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                        </Select>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={addRequest} variant="primary" size="sm">Submit Request</Button>
                            <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {requests.map(req => (
                    <Card key={req.id} className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <Badge tone={STATUS_TONE[req.status] || "neutral"} size="sm" className="uppercase">
                                    {req.status}
                                </Badge>
                                <Badge tone="neutral" variant="outline" size="sm" className="uppercase">{req.priority}</Badge>
                                <h3 className="font-display font-semibold text-slate-900 text-lg">{req.title}</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">{req.description}</p>
                            {(req.impact_cost || req.impact_timeline_days) && (
                                <div className="inline-flex gap-4 text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                                    {req.impact_cost && <span className="flex items-center gap-1 tabular-nums"><DollarSign className="h-3.5 w-3.5" /> Cost Impact: ${req.impact_cost}</span>}
                                    {req.impact_timeline_days && <span className="flex items-center gap-1 tabular-nums"><Clock className="h-3.5 w-3.5" /> Timeline: +{req.impact_timeline_days} days</span>}
                                </div>
                            )}
                        </div>

                        {!isClientView && req.status === 'requested' && (
                            <div className="flex items-center gap-2 self-start md:self-center">
                                <Button onClick={() => updateStatus(req.id, 'reviewing')} variant="secondary" size="sm">Mark Reviewing</Button>
                            </div>
                        )}
                        {!isClientView && req.status === 'reviewing' && (
                            <div className="flex items-center gap-2 self-start md:self-center">
                                <button onClick={async () => {
                                    const reason = await promptModal({
                                        title: "Reject change request",
                                        description: `"${req.title}" — give the client a reason for the rejection.`,
                                        type: "textarea",
                                        placeholder: "Why is this request being rejected?",
                                        confirmLabel: "Reject",
                                        destructive: true,
                                    });
                                    if (reason) updateStatus(req.id, 'rejected', reason);
                                }} className="rounded-lg p-2 bg-danger-soft text-danger transition-colors hover:bg-red-100" title="Reject"><XCircle className="h-5 w-5" /></button>
                                <button onClick={async () => {
                                    const note = await promptModal({
                                        title: "Approve change request",
                                        description: `"${req.title}" — add an approval note (scope, cost, timeline).`,
                                        type: "textarea",
                                        defaultValue: "Approved",
                                        confirmLabel: "Approve",
                                    });
                                    if (note) updateStatus(req.id, 'approved', note);
                                }} className="rounded-lg p-2 bg-brand-soft text-brand-deep transition-colors hover:bg-emerald-100" title="Approve"><CheckCircle2 className="h-5 w-5" /></button>
                            </div>
                        )}
                    </Card>
                ))}

                {requests.length === 0 && (
                    <div className="text-center py-8 text-slate-500 italic">No change requests active.</div>
                )}
            </div>
        </div>
    );
}
