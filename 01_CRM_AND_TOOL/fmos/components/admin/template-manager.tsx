"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Copy,
    Eye,
    Info,
    MessageCircle,
    ChevronRight,
    Loader2
} from "lucide-react";
import clsx from "clsx";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";

interface Niche {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

interface City {
    id: string;
    name: string;
    state: string;
}

interface Template {
    id: string;
    niche_id: string;
    city_id: string;
    outcome: 'no_answer' | 'not_interested' | 'interested';
    message_body: string;
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    niche?: Niche;
    city?: City;
}

const VARIABLES = [
    { key: "{lead_name}", description: "Client's full name" },
    { key: "{business_name}", description: "Name of the business" },
    { key: "{niche}", description: "Industry / Niche (e.g. Gym)" },
    { key: "{city}", description: "City name (e.g. Hubli)" },
    { key: "{landing_page_url}", description: "Specific landing page for the niche" },
    { key: "{market_pdf_url}", description: "Market research PDF link" },
    { key: "{case_study_url}", description: "Case study results PDF link" },
];

export default function TemplateManager() {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [niches, setNiches] = useState<Niche[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedNiche, setSelectedNiche] = useState<string>("all");
    const [selectedCity, setSelectedCity] = useState<string>("all");
    const [selectedOutcome, setSelectedOutcome] = useState<string>("all");

    // Form State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        niche_id: "",
        city_id: "",
        outcome: "no_answer" as Template["outcome"],
        message_body: "",
        is_active: true
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const [
            { data: templatesData },
            { data: nichesData },
            { data: citiesData }
        ] = await Promise.all([
            supabase.from("whatsapp_message_templates" as any).select("*, niche:niches(*), city:cities(*)").order("updated_at", { ascending: false }),
            supabase.from("niches" as any).select("*").order("name"),
            supabase.from("cities" as any).select("*").order("name")
        ]);

        if (templatesData) setTemplates(templatesData as any as Template[]);
        if (nichesData) setNiches(nichesData as any as Niche[]);
        if (citiesData) setCities(citiesData as any as City[]);
        setIsLoading(false);
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            niche_id: template.niche_id,
            city_id: template.city_id,
            outcome: template.outcome,
            message_body: template.message_body,
            is_active: template.is_active
        });
        setIsDrawerOpen(true);
    };

    const handleAdd = () => {
        setEditingTemplate(null);
        setFormData({
            niche_id: niches[0]?.id || "",
            city_id: cities[0]?.id || "",
            outcome: "no_answer",
            message_body: "",
            is_active: true
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingTemplate) {
                // Upsert with version increment
                const { error } = await supabase.from("whatsapp_message_templates" as any)
                    .update({
                        ...formData,
                        version: editingTemplate.version + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingTemplate.id);
                if (error) throw error;

                // Log Audit
                await logAudit({
                    action: 'update',
                    resourceType: 'template',
                    resourceId: editingTemplate.id,
                    resourceLabel: `Updated template for ${niches.find(n => n.id === formData.niche_id)?.name}`,
                    oldValue: editingTemplate,
                    newValue: formData
                });
            } else {
                const { error } = await supabase.from("whatsapp_message_templates" as any)
                    .insert([{
                        ...formData,
                        version: 1
                    }]);
                if (error) throw error;

                // Log Audit
                await logAudit({
                    action: 'create',
                    resourceType: 'template',
                    resourceLabel: `Created template for ${niches.find(n => n.id === formData.niche_id)?.name}`,
                    newValue: formData
                });
            }

            await fetchInitialData();
            setIsDrawerOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (template: Template) => {
        const newStatus = !template.is_active;
        setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: newStatus } : t));

        const { error } = await supabase.from("whatsapp_message_templates" as any)
            .update({ is_active: newStatus })
            .eq("id", template.id);

        await logAudit({
            action: 'update',
            resourceType: 'template',
            resourceId: template.id,
            resourceLabel: `${newStatus ? 'Activated' : 'Deactivated'} template for ${template.niche?.name}`,
            newValue: { is_active: newStatus }
        });

        if (error) {
            console.error(error);
            fetchInitialData(); // Revert on failure
        }
    };

    const handleDelete = async (template: Template) => {
        if (!confirm(`Delete this template${template.niche?.name ? ` for ${template.niche.name}` : ""}? This can't be undone.`)) return;
        const { error } = await supabase.from("whatsapp_message_templates" as any)
            .delete()
            .eq("id", template.id);
        if (error) {
            toast.error("Could not delete template", error.message);
            return;
        }
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        toast.success("Template deleted");
        await logAudit({
            action: 'delete',
            resourceType: 'template',
            resourceId: template.id,
            resourceLabel: `Deleted template${template.niche?.name ? ` for ${template.niche.name}` : ""}`,
            oldValue: template
        });
    };

    const filteredTemplates = templates.filter(t => {
        if (selectedNiche !== "all" && t.niche_id !== selectedNiche) return false;
        if (selectedCity !== "all" && t.city_id !== selectedCity) return false;
        if (selectedOutcome !== "all" && t.outcome !== selectedOutcome) return false;
        return true;
    });

    const getOutcomeColor = (outcome: string) => {
        switch (outcome) {
            case 'no_answer': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'not_interested': return 'bg-red-50 text-red-600 border-red-200';
            case 'interested': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const renderPreview = (text: string) => {
        let preview = text;
        const samples = {
            "{lead_name}": "Rajesh Kumar",
            "{business_name}": "Smile Dental Clinic",
            "{niche}": "Dental Clinics",
            "{city}": "Hubli",
            "{landing_page_url}": "https://fm.agency/dental-hubli",
            "{market_pdf_url}": "https://storage.fm.agency/market.pdf",
            "{case_study_url}": "https://storage.fm.agency/results.pdf",
        };
        Object.entries(samples).forEach(([key, val]) => {
            preview = preview.replaceAll(key, val);
        });
        return preview;
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <select
                        value={selectedNiche}
                        onChange={(e) => setSelectedNiche(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="all">All Niches</option>
                        {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>

                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="all">All Cities</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {['all', 'no_answer', 'not_interested', 'interested'].map(o => (
                            <button
                                key={o}
                                onClick={() => setSelectedOutcome(o)}
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all capitalize",
                                    selectedOutcome === o ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {o.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                    <Plus className="h-4 w-4" /> Add Template
                </button>
            </div>

            {/* Templates Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Niche & City</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Outcome</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">v#</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" /> Loading templates...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTemplates.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No templates found matching filters.</td>
                            </tr>
                        ) : (
                            filteredTemplates.map(template => (
                                <tr key={template.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg border border-slate-200">
                                                {template.niche?.icon || '🏢'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{template.niche?.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{template.city?.name || 'Local'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                            getOutcomeColor(template.outcome)
                                        )}>
                                            {template.outcome.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{template.message_body}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                                        {template.version}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(template)}
                                            className={clsx(
                                                "w-10 h-5 rounded-full transition-all relative",
                                                template.is_active ? "bg-emerald-500" : "bg-slate-300"
                                            )}
                                        >
                                            <div className={clsx(
                                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                template.is_active ? "right-1" : "left-1"
                                            )} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Edit Template"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Template"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Editor Drawer / Modal */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="h-full w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                        <div className="flex flex-col h-full border-l border-slate-200">
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{editingTemplate ? "Edit Template" : "New WhatsApp Template"}</h2>
                                    <p className="text-sm text-slate-500">Configure your automated outcomes message.</p>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <XCircle className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Niche</label>
                                        <select
                                            value={formData.niche_id}
                                            onChange={(e) => setFormData({ ...formData, niche_id: e.target.value })}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            <option value="">Select Niche</option>
                                            {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                                        <select
                                            value={formData.city_id}
                                            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Call Outcome</label>
                                    <div className="flex gap-4">
                                        {['no_answer', 'not_interested', 'interested'].map(o => (
                                            <button
                                                key={o}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, outcome: o as any })}
                                                className={clsx(
                                                    "flex-1 py-3 px-4 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all",
                                                    formData.outcome === o
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                )}
                                            >
                                                {o.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Message Body</label>
                                            <div className="relative group">
                                                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                                                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl text-[10px] invisible group-hover:visible shadow-xl z-20">
                                                    <p className="font-bold mb-2 border-b border-white/20 pb-1">Available Variables</p>
                                                    <div className="space-y-1.5">
                                                        {VARIABLES.map(v => (
                                                            <div key={v.key} className="flex justify-between">
                                                                <span className="text-emerald-400 font-mono">{v.key}</span>
                                                                <span className="opacity-60">{v.description}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <textarea
                                            value={formData.message_body}
                                            onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                                            required
                                            rows={12}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none font-sans leading-relaxed resize-none"
                                            placeholder="Type your message here..."
                                        />
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {VARIABLES.map(v => (
                                                <button
                                                    key={v.key}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, message_body: formData.message_body + v.key })}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-mono border border-slate-200 transition-colors"
                                                >
                                                    {v.key}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Eye className="h-3 w-3" /> Live Preview
                                        </label>
                                        <div className="bg-[#E9EDEF] rounded-2xl p-4 border border-slate-200 h-[calc(100%-2rem)] flex flex-col">
                                            <div className="bg-white rounded-xl p-4 shadow-sm relative flex-1">
                                                <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45 border-l border-b border-slate-100 hidden md:block" />
                                                <div className="flex flex-col h-full bg-white">
                                                    <div className="text-xs text-slate-900 whitespace-pre-wrap font-sans leading-relaxed flex-1 overflow-y-auto">
                                                        {formData.message_body ? renderPreview(formData.message_body) : <span className="text-slate-300 italic">Preview will appear here...</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 text-right mt-2 flex items-center justify-end gap-1">
                                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 text-center mt-3 font-medium opacity-60 uppercase tracking-widest">WhatsApp Web Preview</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white pb-6 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : editingTemplate ? "Update Template" : "Create Template"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
