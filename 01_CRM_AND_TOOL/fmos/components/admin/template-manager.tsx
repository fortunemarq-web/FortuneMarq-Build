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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type Tone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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

// Template categories aren't pipeline status — collapse to neutral/info/warning
// so the table reads as one quiet system, not a five-colour rainbow.
const CATEGORY_TONE: Record<string, Tone> = {
    CURIOSITY: "brand",
    BOT_REPLY: "info",
    OUTCOME_TRIGGERED: "warning",
    FOLLOWBACK_REMINDER: "neutral",
    POST_MEETING: "info",
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
            .from("whatsapp_templates")
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
                    .from("whatsapp_templates")
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
                    .from("whatsapp_templates")
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
            .from("whatsapp_templates")
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
            <Card className="flex flex-col items-start justify-between gap-4 p-4 md:flex-row md:items-center">
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-auto"
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c.replace(/_/g, " ")}
                            </option>
                        ))}
                    </Select>

                    <div className="flex rounded-lg border border-line bg-slate-100 p-1">
                        {["all", "universal", "A", "B", "C", "D"].map((o) => (
                            <button
                                key={o}
                                onClick={() => setSelectedType(o)}
                                className={clsx(
                                    "rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all",
                                    selectedType === o
                                        ? "bg-surface text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {o === "all" ? "All" : o === "universal" ? "Universal" : `Type ${o}`}
                            </button>
                        ))}
                    </div>
                </div>

                <Button onClick={handleAdd} variant="primary">
                    <Plus className="h-4 w-4" /> Add Template
                </Button>
            </Card>

            {/* Templates Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <THead>
                            <TR className="hover:bg-transparent">
                                <TH>Template</TH>
                                <TH>Category</TH>
                                <TH>Lead Type</TH>
                                <TH>Preview</TH>
                                <TH className="text-right">Actions</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {isLoading ? (
                                <TR className="hover:bg-transparent">
                                    <TD colSpan={5} className="py-12 text-center text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" /> Loading templates...
                                        </div>
                                    </TD>
                                </TR>
                            ) : filteredTemplates.length === 0 ? (
                                <TR className="hover:bg-transparent">
                                    <TD colSpan={5} className="py-12 text-center text-slate-400">
                                        No templates found matching filters.
                                    </TD>
                                </TR>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <TR key={template.id} className="group">
                                        <TD>
                                            <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                                            {template.requires_meta_approval && (
                                                <p className="text-[11px] uppercase tracking-wide text-warn">Meta approval required</p>
                                            )}
                                        </TD>
                                        <TD>
                                            <Badge tone={CATEGORY_TONE[template.category] || "neutral"} size="sm" className="uppercase">
                                                {template.category.replace(/_/g, " ")}
                                            </Badge>
                                        </TD>
                                        <TD className="text-xs tabular-nums text-slate-500">
                                            {template.lead_type ? `Type ${template.lead_type}` : "Universal"}
                                        </TD>
                                        <TD>
                                            <p className="max-w-xs truncate text-sm text-slate-500">{template.content}</p>
                                        </TD>
                                        <TD className="text-right">
                                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleEdit(template)}
                                                    className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-brand-soft hover:text-brand-deep"
                                                    title="Edit Template"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template)}
                                                    className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-danger-soft hover:text-danger"
                                                    title="Delete Template"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>
            </Card>

            {/* Editor Drawer / Modal */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="h-full w-full max-w-2xl overflow-y-auto bg-surface shadow-lg animate-in slide-in-from-right duration-300">
                        <div className="flex h-full flex-col border-l border-line">
                            {/* Drawer Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-slate-50 p-6">
                                <div>
                                    <h2 className="font-display text-xl font-semibold text-slate-900">
                                        {editingTemplate ? "Edit Template" : "New WhatsApp Template"}
                                    </h2>
                                    <p className="text-sm text-slate-500">Available in the sales template picker.</p>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="rounded-full p-2 transition-colors hover:bg-slate-200"
                                >
                                    <XCircle className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 space-y-8 p-6">
                                <div>
                                    <Label>Template Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. CURIOSITY_TYPE_A"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c.replace(/_/g, " ")}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Lead Type</Label>
                                        <Select
                                            value={formData.lead_type}
                                            onChange={(e) => setFormData({ ...formData, lead_type: e.target.value })}
                                        >
                                            {LEAD_TYPES.map((t) => (
                                                <option key={t || "universal"} value={t}>
                                                    {t ? `Type ${t}` : "Universal (all types)"}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label>Meta Category</Label>
                                        <Select
                                            value={formData.meta_category}
                                            onChange={(e) => setFormData({ ...formData, meta_category: e.target.value })}
                                        >
                                            {META_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <label className="flex cursor-pointer items-end gap-3 pb-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_meta_approval}
                                            onChange={(e) =>
                                                setFormData({ ...formData, requires_meta_approval: e.target.checked })
                                            }
                                            className="h-5 w-5 rounded accent-brand-deep"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Requires Meta approval</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="mb-0">Message Body</Label>
                                            <div className="group relative">
                                                <Info className="h-4 w-4 cursor-help text-slate-400" />
                                                <div className="invisible absolute bottom-full right-0 z-20 mb-2 w-64 rounded-lg bg-slate-900 p-3 text-[11px] text-white shadow-md group-hover:visible">
                                                    <p className="mb-2 border-b border-white/20 pb-1 font-semibold">Available Variables</p>
                                                    <div className="space-y-1.5">
                                                        {VARIABLES.map((v) => (
                                                            <div key={v.key} className="flex justify-between">
                                                                <span className="text-brand">{v.key}</span>
                                                                <span className="opacity-60">{v.description}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            required
                                            rows={12}
                                            className="resize-none leading-relaxed"
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
                                                    className="rounded-md border border-line bg-slate-100 px-2 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-200"
                                                >
                                                    {v.key}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="mb-0 flex items-center gap-2">
                                            <Eye className="h-3 w-3" /> Live Preview
                                        </Label>
                                        {/* WhatsApp chat preview — keeps WhatsApp's own UI colours on purpose */}
                                        <div className="flex h-[calc(100%-2rem)] flex-col rounded-xl border border-line bg-[#E9EDEF] p-4">
                                            <div className="relative flex-1 rounded-lg bg-white p-4 shadow-sm">
                                                <div className="absolute -left-2 top-4 hidden h-4 w-4 rotate-45 border-b border-l border-slate-100 bg-white md:block" />
                                                <div className="flex h-full flex-col bg-white">
                                                    <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-900">
                                                        {formData.content ? (
                                                            renderPreview(formData.content)
                                                        ) : (
                                                            <span className="italic text-slate-300">Preview will appear here...</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-end gap-1 text-right text-[11px] text-slate-400">
                                                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 opacity-60">
                                                WhatsApp Web Preview
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="sticky bottom-0 mt-auto flex gap-4 border-t border-line bg-surface pb-6 pt-6">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        variant="primary"
                                        size="lg"
                                        className="flex-1"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : editingTemplate ? (
                                            "Update Template"
                                        ) : (
                                            "Create Template"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsDrawerOpen(false)}
                                        variant="subtle"
                                        size="lg"
                                        className="px-8"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
