"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Briefcase, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { generateProjectTasks } from "@/lib/project-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CreateProjectModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const serviceTypes = [
    { value: "web_dev", label: "Website Design and Development" },
    { value: "local_seo", label: "Local SEO" },
    { value: "seo", label: "SEO" },
    { value: "performance_marketing", label: "Performance Marketing" },
    { value: "social_media", label: "Social Media" },
    { value: "whatsapp_marketing", label: "WhatsApp Marketing" },
];

const buildTypes = [
    { value: "wordpress", label: "WordPress (Elementor/Divi)" },
    { value: "custom", label: "Custom (HTML/CSS/JS)" },
    { value: "ecommerce", label: "E-Commerce (WooCommerce/Shopify)" },
];

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        clientId: "",
        newClientName: "",
        newClientEmail: "",
        selectedServices: [] as string[],
        buildType: "",
        startDate: "",
        deadline: "",
        description: "",
        createClient: false,
    });

    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        async function fetchClients() {
            const supabase = createClient();
            const { data } = await supabase.from("clients").select("id, business_name").order("business_name");
            if (data) setClients(data);
        }
        fetchClients();
    }, []);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleService = (serviceValue: string) => {
        setFormData(prev => {
            const current = prev.selectedServices;
            const newServices = current.includes(serviceValue)
                ? current.filter(s => s !== serviceValue)
                : [...current, serviceValue];

            // Reset build type if web_dev is removed
            const isWebDevSelected = newServices.includes("web_dev");
            return {
                ...prev,
                selectedServices: newServices,
                buildType: isWebDevSelected ? prev.buildType : ""
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (formData.selectedServices.length === 0) {
            setMessage({ type: "error", text: "Please select at least one service." });
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            let clientId = formData.clientId;

            // 1. Create client if needed
            if (formData.createClient) {
                if (!formData.newClientName) throw new Error("Business Name is required for new client");

                const { data: newClient, error: clientError } = await (supabase.from("clients") as any).insert({
                    business_name: formData.newClientName,
                    primary_email: formData.newClientEmail || null,
                    created_at: new Date().toISOString()
                }).select().single();

                if (clientError) throw clientError;
                clientId = newClient.id;
            }

            if (!clientId) throw new Error("Please select or create a client");

            // 2. Create Projects (One per selected service)
            const errors: string[] = [];
            let successCount = 0;

            for (const service of formData.selectedServices) {
                const projectData: any = {
                    client_id: clientId,
                    service_type: service,
                    build_type: service === "web_dev" ? formData.buildType : null,
                    status: "not_started",
                    start_date: new Date(formData.startDate).toISOString(),
                    deadline: new Date(formData.deadline).toISOString(),
                    created_at: new Date().toISOString()
                };

                const { data: project, error: projError } = await (supabase.from("projects") as any)
                    .insert(projectData)
                    .select()
                    .single();

                if (projError) {
                    console.error(`Failed to create project for ${service}`, projError);
                    errors.push(service);
                    continue; // Skip tasks generation for this failed project
                }

                // 3. Generate Tasks
                if (project) {
                    await generateProjectTasks(supabase, project.id, service as any, formData.startDate);
                    // generateProjectMilestones removed as per request
                    successCount++;
                }
            }

            if (errors.length > 0) {
                if (successCount === 0) {
                    throw new Error(`Failed to create any projects. Issues with: ${errors.join(", ")}`);
                } else {
                    // Partial success
                    console.warn(`Some projects failed: ${errors.join(", ")}`);
                }
            }

            setMessage({ type: "success", text: `${successCount} Project(s) created successfully!` });
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (error: any) {
            console.error(error);
            setMessage({ type: "error", text: error.message || "Failed to create project" });
        } finally {
            setLoading(false);
        }
    };

    const showBuildType = formData.selectedServices.includes("web_dev");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h2 className="font-display text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-brand-deep" />
                        Create Project Manually
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Client Selection */}
                    <div className="space-y-4 rounded-xl border border-line bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <Label className="mb-0">Client</Label>
                            <label className="flex items-center gap-2 text-xs text-brand-deep cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="createClient"
                                    checked={formData.createClient}
                                    onChange={handleChange}
                                    className="accent-brand-deep"
                                />
                                New Client?
                            </label>
                        </div>

                        {formData.createClient ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    type="text"
                                    name="newClientName"
                                    placeholder="Business Name *"
                                    value={formData.newClientName}
                                    onChange={handleChange}
                                    required={formData.createClient}
                                />
                                <Input
                                    type="email"
                                    name="newClientEmail"
                                    placeholder="Primary Email (Optional)"
                                    value={formData.newClientEmail}
                                    onChange={handleChange}
                                />
                            </div>
                        ) : (
                            <Select
                                name="clientId"
                                value={formData.clientId}
                                onChange={handleChange}
                                required={!formData.createClient}
                            >
                                <option value="">Select Existing Client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.business_name}</option>
                                ))}
                            </Select>
                        )}
                    </div>

                    {/* Project Details */}
                    <div>
                        <div className="mb-4">
                            <Label>Service Types *</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {serviceTypes.map(s => {
                                    const isSelected = formData.selectedServices.includes(s.value);
                                    return (
                                        <div
                                            key={s.value}
                                            onClick={() => toggleService(s.value)}
                                            className={`
                                                cursor-pointer flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors
                                                ${isSelected
                                                    ? 'border-brand-line bg-brand-soft text-slate-900'
                                                    : 'border-line bg-surface text-slate-500 hover:border-line-strong'
                                                }
                                            `}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-brand bg-brand' : 'border-line-strong'}`}>
                                                {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                            {s.label}
                                        </div>
                                    );
                                })}
                            </div>
                            {formData.selectedServices.length === 0 && (
                                <p className="mt-1 text-xs text-slate-500">Select at least one service.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {showBuildType && (
                                <div className="sm:col-span-2">
                                    <Label>Build Type (for Web Dev) *</Label>
                                    <Select
                                        name="buildType"
                                        value={formData.buildType}
                                        onChange={handleChange}
                                        required={showBuildType}
                                    >
                                        <option value="">Select Build Type...</option>
                                        {buildTypes.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                    </Select>
                                </div>
                            )}

                            <div>
                                <Label>Start Date *</Label>
                                <Input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Deadline *</Label>
                                <Input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-brand-soft text-brand-deep' : 'bg-danger-soft text-danger'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-line">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? "Creating..." : <><Plus className="h-4 w-4" /> Create Projects</>}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
