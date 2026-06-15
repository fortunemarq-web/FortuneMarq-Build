"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    Plus,
    Edit2,
    Trash2,
    XCircle,
    Eye,
    Info,
    Loader2
} from "lucide-react";
import clsx from "clsx";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";

// Canonical WhatsApp template library — same table (whatsapp_templates) the
// sales template picker reads, so anything created here reaches senders.
interface Template {
    id: string;
    name: string;
    content: string;
    category: string;
    lead_type: string | null;
    variables: string[] | null;
    requires_meta_approval: boolean | null;
    meta_category: string | null;
    sent_by: string | null;
    created_at: string;
}

// Categories the picker understands (STAGE_CATEGORIES in whatsapp-template-picker).
const CATEGORIES = [
    "CURIOSITY",
    "BOT_REPLY",
    "OUTCOME_TRIGGERED",
    "FOLLOWBACK_REMINDER",
    "POST_MEETING",
];

const META_CATEGORIES = ["UTILITY", "MARKETING", "AUTHENTICATION"];

// "" = universal (applies to every lead type)
const LEAD_TYPES = ["", "A", "B", "C", "D"];

// Variables the picker substitutes from lead data (substituteVariables()).
const VARIABLES = [
    { key: "{{businessName}}", description: "Lead's business name" },
    { key: "{{city}}", description: "Lead's city" },
    { key: "{{niche}}", description: "Lead's industry / niche" },
    { key: "{{searchVolume}}", description: "Monthly search volume" },
    { key: "{{landingPageLink}}", description: "Landing page URL" },
    { key: "{{name}}", description: "Contact name" },
];

const CATEGORY_COLORS: Record<string, string> = {
    CURIOSITY: "bg-emerald-50 text-emerald-600 border-emerald-200",
    BOT_REPLY: "bg-sky-50 text-sky-600 border-sky-200",
    OUTCOME_TRIGGERED: "bg-amber-50 text-amber-600 border-amber-200",
    FOLLOWBACK_REMINDER: "bg-violet-50 text-violet-600 border-violet-200",
    POST_MEETING: "bg-indigo-50 text-indigo-600 border-indigo-200",
};

// Pull {{token}} names out of the body so the stored variables array stays accurate.
function extractVariables(content: string): string[] {
    const found = new Set<string>();
    for (const m of content.matchAll(/{{\s*(\w+)\s*}}/g)) found.add(m[1]);
    return [...found];
}

export default function TemplateManager() {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");

    // Form State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: CATEGORIES[0],
        lead_type: "" as string,
        content: "",
        meta_category: "UTILITY",
        requires_meta_approval: false,
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("whatsapp_templates" as any)
            .select("*")
            .order("category", { ascending: true });
        if (error) {
            console.error(error);
            toast.error("Failed to load templates", error.message);
        }
        if (data) setTemplates(data as any as Template[]);
        setIsLoading(false);
    };

    const handleAdd = () => {
        setEditingTemplate(null);
        setFormData({
            name: "",
            category: CATEGORIES[0],
            lead_type: "",
            content: "",
            meta_category: "UTILITY",
            requires_meta_approval: false,
        });
        setIsDrawerOpen(true);
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            category: template.category,
            lead_type: template.lead_type ?? "",
            content: template.content,
            meta_category: template.meta_category ?? "UTILITY",
            requires_meta_approval: template.requires_meta_approval ?? false,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name: formData.name.trim(),
            category: formData.category,
            lead_type: formData.lead_type || null,
            content: formData.content,
            variables: extractVariables(formData.content),
            meta_category: formData.meta_category,
            requires_meta_approval: formData.requires_meta_approval,
        };

        try {
            if (editingTemplate) {
                const { error } = await supabase
                    .from("whatsapp_templates" as any)
                    .update(payload)
                    .eq("id", editingTemplate.id);
                if (error) throw error;

                await logAudit({
                    action: "update",
                    resourceType: "template",
                    resourceId: editingTemplate.id,
                    resourceLabel: `Updated WhatsApp template ${payload.name}`,
                    oldValue: editingTemplate,
                    newValue: payload,
                });
            } else {
                // id is a NOT NULL text PK with no default — generate one.
                const id =
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `tmpl_${Date.now()}`;
                const { error } = await supabase
                    .from("whatsapp_templates" as any)
                    .insert([{ id, ...payload }]);
                if (error) throw error;

                await logAudit({
                    action: "create",
                    resourceType: "template",
                    resourceId: id,
                    resourceLabel: `Created WhatsApp template ${payload.name}`,
                    newValue: payload,
                });
            }

            await fetchTemplates();
            setIsDrawerOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to save template", error?.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (template: Template) => {
        const ok = await promptModal({
            title: `Delete "${template.name}"?`,
            description: "This can't be undone.",
            confirmLabel: "Delete",
            destructive: true,
            type: "select",
            options: [{ value: "confirm", label: "Yes, delete" }],
        });
        if (!ok) return;
        const { error } = await supabase
            .from("whatsapp_templates" as any)
            .delete()
            .eq("id", template.id);
        if (error) {
            toast.error("Could not delete template", error.message);
            return;
        }
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        toast.success("Template deleted");
        await logAudit({
            action: "delete",
            resourceType: "template",
            resourceId: template.id,
            resourceLabel: `Deleted WhatsApp template ${template.name}`,
            oldValue: template,
        });
    };

    const filteredTemplates = templates.filter((t) => {
        if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
        if (selectedType !== "all") {
            if (selectedType === "universal" && t.lead_type) return false;
            if (selectedType !== "universal" && (t.lead_type ?? "").toUpperCase() !== selectedType)
                return false;
        }
        return true;
    });

    const renderPreview = (text: string) => {
        let preview = text;
        const samples: Record<string, string> = {
            "{{businessName}}": "Smile Dental Clinic",
            "{{city}}": "Hubli",
            "{{niche}}": "Dental Clinics",
            "{{searchVolume}}": "2,400",
            "{{landingPageLink}}": "https://fortunemarq.com/dental-hubli",
            "{{name}}": "Rajesh Kumar",
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
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>

                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {["all", "universal", "A", "B", "C", "D"].map((o) => (
                            <button
                                key={o}
                                onClick={() => setSelectedType(o)}
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all capitalize",
                                    selectedType === o
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {o === "all" ? "All" : o === "universal" ? "Universal" : `Type ${o}`}
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
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Template</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" /> Loading templates...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTemplates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                    No templates found matching filters.
                                </td>
                            </tr>
                        ) : (
                            filteredTemplates.map((template) => (
                                <tr key={template.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{template.name}</p>
                                        {template.requires_meta_approval && (
                                            <p className="text-[10px] text-amber-600 uppercase tracking-tighter">Meta approval required</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={clsx(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                CATEGORY_COLORS[template.category] || "bg-slate-50 text-slate-600 border-slate-200"
                                            )}
                                        >
                                            {template.category.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                        {template.lead_type ? `Type ${template.lead_type}` : "Universal"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{template.content}</p>
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
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {editingTemplate ? "Edit Template" : "New WhatsApp Template"}
                                    </h2>
                                    <p className="text-sm text-slate-500">Available in the sales template picker.</p>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <XCircle className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 p-6 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Template Name</label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. CURIOSITY_TYPE_A"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c.replace(/_/g, " ")}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Lead Type</label>
                                        <select
                                            value={formData.lead_type}
                                            onChange={(e) => setFormData({ ...formData, lead_type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            {LEAD_TYPES.map((t) => (
                                                <option key={t || "universal"} value={t}>
                                                    {t ? `Type ${t}` : "Universal (all types)"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Meta Category</label>
                                        <select
                                            value={formData.meta_category}
                                            onChange={(e) => setFormData({ ...formData, meta_category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            {META_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <label className="flex items-end gap-3 pb-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_meta_approval}
                                            onChange={(e) =>
                                                setFormData({ ...formData, requires_meta_approval: e.target.checked })
                                            }
                                            className="h-5 w-5 rounded accent-emerald-600"
                                        />
                                        <span className="text-xs font-bold text-slate-500 uppercase">Requires Meta approval</span>
                                    </label>
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
                                                        {VARIABLES.map((v) => (
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
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            required
                                            rows={12}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none font-sans leading-relaxed resize-none"
                                            placeholder="Type your message here..."
                                        />
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {VARIABLES.map((v) => (
                                                <button
                                                    key={v.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData({ ...formData, content: formData.content + v.key })
                                                    }
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
                                                        {formData.content ? (
                                                            renderPreview(formData.content)
                                                        ) : (
                                                            <span className="text-slate-300 italic">Preview will appear here...</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 text-right mt-2 flex items-center justify-end gap-1">
                                                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 text-center mt-3 font-medium opacity-60 uppercase tracking-widest">
                                                WhatsApp Web Preview
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white pb-6 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : editingTemplate ? (
                                            "Update Template"
                                        ) : (
                                            "Create Template"
                                        )}
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
