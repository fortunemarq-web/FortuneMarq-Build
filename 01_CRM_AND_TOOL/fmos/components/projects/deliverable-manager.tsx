"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { UploadCloud, FileText, Link as LinkIcon, Download, Trash2, Tag } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";

interface Deliverable {
    id: string;
    title: string;
    type: 'file' | 'link' | 'note';
    url?: string;
    description?: string;
    version?: string;
    created_at: string;
}

export default function DeliverableManager({ projectId, initialDeliverables, isClientView = false }: { projectId: string, initialDeliverables: Deliverable[], isClientView?: boolean }) {
    const [deliverables, setDeliverables] = useState(initialDeliverables);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ title: "", type: "link", url: "", description: "", version: "v1.0" });
    const supabase = createClient();

    const addDeliverable = async () => {
        if (!newItem.title) return;
        try {
            const { data, error } = await supabase.from("deliverables").insert({
                project_id: projectId,
                title: newItem.title,
                type: newItem.type,
                url: newItem.url,
                description: newItem.description,
                version: newItem.version
            }).select().single();

            if (error) throw error;
            if (data) setDeliverables([data as any, ...deliverables]);
            setIsAdding(false);
            setNewItem({ title: "", type: "link", url: "", description: "", version: "v1.0" });
        } catch (e) {
            console.error(e);
            toast.error("Error adding deliverable");
        }
    };

    const deleteDeliverable = async (id: string) => {
        const ok = await promptModal({ title: "Delete this deliverable?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
        if (!ok) return;
        await supabase.from("deliverables").delete().eq("id", id);
        setDeliverables(prev => prev.filter(d => d.id !== id));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-xl font-semibold text-slate-900">Project Deliverables</h2>
                {!isClientView && (
                    <Button onClick={() => setIsAdding(!isAdding)} variant="primary" size="sm">
                        <UploadCloud className="h-4 w-4" /> Add Deliverable
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-slate-50 border border-line p-4 rounded-xl mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-slate-900 font-semibold mb-3">New Deliverable</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input type="text" placeholder="Title" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                        <Select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                            <option value="link">Link / URL</option>
                            <option value="file">File (paste URL)</option>
                            <option value="note">Note / Text</option>
                        </Select>
                        <Input type="text" placeholder="URL or Content" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} className="md:col-span-2" />
                        <Input type="text" placeholder="Version (e.g. v1.0 final)" value={newItem.version} onChange={e => setNewItem({ ...newItem, version: e.target.value })} />
                        <Input type="text" placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={addDeliverable} variant="primary" size="sm">Save Deliverable</Button>
                        <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">Cancel</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliverables.map(item => (
                    <Card key={item.id} className="p-4 hover:border-brand-line transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-lg bg-brand-soft text-brand-deep">
                                {item.type === 'link' ? <LinkIcon className="h-5 w-5" /> : item.type === 'file' ? <FileText className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                            </div>
                            {!isClientView && (
                                <button onClick={() => deleteDeliverable(item.id)} className="text-slate-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">{item.title}</h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description || "No description"}</p>

                        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-line pt-3">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.version || "v1"}</span>
                            <span className="tabular-nums">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>

                        {item.url && (
                            <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-200">
                                <Download className="h-3.5 w-3.5" /> Access Resource
                            </a>
                        )}
                    </Card>
                ))}

                {deliverables.length === 0 && (
                    <EmptyState
                        className="col-span-full"
                        icon={UploadCloud}
                        title="No deliverables yet"
                        description="Uploaded deliverables will appear here."
                    />
                )}
            </div>
        </div>
    );
}
