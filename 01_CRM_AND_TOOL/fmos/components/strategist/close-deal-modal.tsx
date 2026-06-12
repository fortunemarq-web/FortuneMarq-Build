"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { generateProjectTasks, generateProjectMilestones } from "@/lib/project-utils";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import type { Database } from "@/types/database.types";
import { leadStatusUpdate } from "@/lib/pipeline";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
interface CloseDealModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

type ServiceType =
  | "web_dev"
  | "local_seo"
  | "seo"
  | "performance_marketing"
  | "social_media"
  | "whatsapp_marketing";

type BuildType = "wordpress" | "custom" | "ecommerce" | "";

const serviceTypes: { value: ServiceType; label: string }[] = [
  { value: "web_dev", label: "Website Design and Development" },
  { value: "local_seo", label: "Local SEO" },
  { value: "seo", label: "SEO" },
  { value: "performance_marketing", label: "Performance Marketing" },
  { value: "social_media", label: "Social Media" },
  { value: "whatsapp_marketing", label: "WhatsApp Marketing" },
];

const buildTypes: { value: BuildType; label: string }[] = [
  { value: "wordpress", label: "WordPress (Elementor/Divi)" },
  { value: "custom", label: "Custom (HTML/CSS/JS)" },
  { value: "ecommerce", label: "E-Commerce (WooCommerce/Shopify)" },
];

export default function CloseDealModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
  userId,
}: CloseDealModalProps) {
  const [formData, setFormData] = useState({
    selectedServices: [] as ServiceType[],
    buildType: "" as BuildType,
    dealValue: "",
    contractLink: "",
    projectStartDate: "",
    projectDeadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const isWebService = formData.selectedServices.includes("web_dev");

    if (
      formData.selectedServices.length === 0 ||
      !formData.dealValue ||
      !formData.contractLink ||
      !formData.projectStartDate ||
      !formData.projectDeadline ||
      (isWebService && !formData.buildType)
    ) {
      setMessage({
        type: "error",
        text: isWebService && !formData.buildType
          ? "Please select a build type for web projects."
          : "Please fill in all required fields.",
      });
      return;
    }

    const dealValueNum = parseFloat(formData.dealValue);
    if (isNaN(dealValueNum) || dealValueNum <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid deal value.",
      });
      return;
    }

    const startDate = new Date(formData.projectStartDate);
    const deadline = new Date(formData.projectDeadline);
    if (deadline <= startDate) {
      setMessage({
        type: "error",
        text: "Project deadline must be after the start date.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Step 1: Update lead status to 'closed_won'
      const { error: leadError } = await supabase
        .from("leads")
        .update(leadStatusUpdate("closed_won") as any)
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // AUDIT: Lead Converted
      await logAudit({
        resourceType: "lead",
        resourceId: lead.id,
        action: "update",
        resourceLabel: "Deal Won!",
        newValue: { deal_value: dealValueNum },
      });

      // Step 2: Insert into clients table
      // Populate all Phase 2 fields from lead data + form data
      const clientData = {
        business_name: lead.company_name,
        primary_email: lead.email || null,
        owner_name: (lead as any).contact_person || null,
        phone: (lead as any).phone || null,
        city: (lead as any).city || null,
        niche: (lead as any).industry || null,
        services: formData.selectedServices,
        monthly_value: dealValueNum,
        status: "active",
        health_score: 3,
        start_date: formData.projectStartDate || new Date().toISOString().split("T")[0],
        renewal_date: null, // Set manually by admin later
        onboarding_completed: false,
        created_at: new Date().toISOString(),
      };

      const { data: clientDataResult, error: clientError } = await supabase
        .from("clients")
        .insert(clientData as any)
        .select()
        .single();

      if (clientError) {
        // If clients table doesn't exist or insert fails, check if it's RLS
        if (clientError.message?.includes("row-level security policy")) {
          console.error("clients table RLS policy blocking insert:", clientError);
          toast.error(`Error: Cannot create client due to security policy. Please check RLS settings.\n\n${clientError.message}`);
        } else {
          console.error("clients table insert failed:", clientError);
          toast.error(`Error: Failed to create client.\n\n${clientError.message}`);
        }
        onClose();
        return; // Stop here if client creation fails
      }

      const clientId = clientDataResult?.id;

      if (!clientId) {
        console.error("Client was created but no ID returned");
        toast.error("Error: Client was created but no ID was returned. Cannot proceed.");
        onClose();
        return;
      }

      // Auto-create onboarding checklist for the new client
      try {
        await supabase.rpc("create_default_onboarding", {
          p_client_id: clientId,
        } as any);
      } catch (onboardingError) {
        console.warn("Onboarding checklist creation failed (non-blocking):", onboardingError);
      }

      // AUDIT: Client Created
      await logAudit({
        resourceType: "client",
        resourceId: clientId,
        action: "create",
        resourceLabel: `Client: ${clientData.business_name}`,
      });

      // Step 3: Insert into deals table
      const { data: dealDataResult, error: dealError } = await supabase
        .from("deals")
        .insert({
          lead_id: lead.id,
          // client_id: clientId || null, // client_id might not exist in type, but prompt asked for it. 
          // Re-checking: if we cast as any, it works if DB has it.
          client_id: clientId || null,
          service_type: formData.selectedServices.join(", "),
          deal_value: dealValueNum,
          contract_link: formData.contractLink,
          status: "won",
          strategist_id: userId || null,
          created_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (dealError) {
        if (dealError.message?.includes("row-level security policy")) {
          console.warn("deals table RLS policy blocking insert:", dealError);
        } else {
          console.warn("deals table insert failed:", dealError);
        }
      }

      const dealId = dealDataResult?.id;

      if (dealId) {
        // AUDIT: Deal Created
        await logAudit({
          resourceType: "client", // or 'lead', or other if available
          resourceId: dealId,
          action: "update",
          resourceLabel: `Deal Closed: ₹${dealValueNum}`,
          newValue: { services: formData.selectedServices.join(", ") },
        });
      }

      // Step 4: Create MULTIPLE Projects (one per service type)
      // "Separate folders of the services" -> Separate Projects linked to client/deal

      const errors: string[] = [];
      let successCount = 0;

      for (const service of formData.selectedServices) {
        const isWebServiceType = service === "web_dev";
        const projectData: any = {
          name: `${lead.company_name || "Client"} — ${service === "web_dev" ? "Web Dev" : service}`,
          deal_id: dealId || null,
          client_id: clientId || null,
          service_type: service,
          build_type: isWebServiceType && formData.buildType ? formData.buildType : null,
          status: "not_started",
          start_date: new Date(formData.projectStartDate).toISOString(),
          deadline: new Date(formData.projectDeadline).toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data: projectDataResult, error: projectError } = await supabase
          .from("projects")
          .insert(projectData)
          .select()
          .single();

        if (projectError) {
          console.error(`Failed to create project for ${service}:`, projectError);
          errors.push(service);
          continue; // Skip tasks generation for this failed project
        }

        const projectId = projectDataResult?.id;

        if (projectId) {
          successCount++;
          // AUDIT: Project Created
          await logAudit({
            resourceType: "client", // mapping to 'client' or adding 'project' later
            resourceId: projectId,
            action: "create",
            resourceLabel: `Project: ${service}`,
            newValue: { deadline: formData.projectDeadline },
          });

          // Generate tasks from templates for THIS service
          await generateProjectTasks(
            supabase,
            projectId,
            service,
            formData.projectStartDate
          );
          await generateProjectMilestones(
            supabase,
            projectId,
            service
          );
        }
      }

      if (errors.length > 0) {
        if (successCount === 0) {
          throw new Error(`Failed to create any projects. Errors with: ${errors.join(", ")}`);
        } else {
          // Partial success, maybe warn but don't blocking everything?
          // We'll consider it a success but show alert?
          console.warn(`Some projects failed to create: ${errors.join(", ")}`);
          toast.error(`Warning: Projects for ${errors.join(", ")} failed to create. Others succeeded.`);
        }
      }

      // Success!
      setMessage({
        type: "success",
        text: "Project Created!",
      });

      // Close modal after a brief delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project. Please try again.";
      setMessage({
        type: "error",
        text: message,
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      selectedServices: [] as ServiceType[],
      buildType: "" as BuildType,
      dealValue: "",
      contractLink: "",
      projectStartDate: "",
      projectDeadline: "",
    });
    setMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setMessage(null);
  };

  // Check if build type dropdown should be shown
  const showBuildType = formData.selectedServices.includes("web_dev");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-[#0f0f0f] bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Close Deal</h2>
            <p className="mt-1 text-sm text-slate-500">{lead.company_name}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-5">
            {/* Service Type - Multi-Select */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                Service Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {serviceTypes.map((service) => (
                  <label
                    key={service.value}
                    className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${formData.selectedServices.includes(service.value)
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-[#0f0f0f] bg-slate-50 hover:bg-slate-100"
                      }`}
                  >
                    <input
                      type="checkbox"
                      name="serviceType"
                      value={service.value}
                      checked={formData.selectedServices.includes(service.value)}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        const validValue = value as ServiceType;
                        setFormData((prev) => {
                          const newServices = checked
                            ? [...prev.selectedServices, validValue]
                            : prev.selectedServices.filter((s) => s !== validValue);

                          // If adding web_dev, keep buildType. If removing web_dev, clear buildType?
                          // Logic: if web_dev is no longer present, clear buildType.
                          const isWebDevSelected = newServices.includes("web_dev");

                          return {
                            ...prev,
                            selectedServices: newServices,
                            buildType: isWebDevSelected ? prev.buildType : ("" as BuildType),
                          };
                        });
                        setMessage(null);
                      }}
                      className="mr-3 h-4 w-4 accent-indigo-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-slate-900">{service.label}</span>
                  </label>
                ))}
              </div>
              {formData.selectedServices.length === 0 && (
                <p className="mt-1 text-xs text-slate-600">Select at least one service.</p>
              )}
            </div>

            {/* Build Type - Conditional */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${showBuildType
                ? "max-h-32 opacity-100"
                : "max-h-0 opacity-0"
                }`}
            >
              <label
                htmlFor="buildType"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Build Type <span className="text-red-500">*</span>
              </label>
              <select
                id="buildType"
                name="buildType"
                value={formData.buildType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#0f0f0f] bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
                disabled={isSubmitting || !showBuildType}
                required={showBuildType}
              >
                <option value="">Select a build type</option>
                {buildTypes.map((buildType) => (
                  <option key={buildType.value} value={buildType.value}>
                    {buildType.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deal Value */}
            <div>
              <label
                htmlFor="dealValue"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Deal Value (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ₹
                </span>
                <input
                  id="dealValue"
                  name="dealValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dealValue}
                  onChange={handleChange}
                  placeholder="5000"
                  className="w-full rounded-lg border border-[#0f0f0f] bg-slate-50 px-4 py-3 pl-8 text-slate-900 placeholder-[#a1a1aa] focus:border-indigo-500 focus:outline-none"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Contract Link */}
            <div>
              <label
                htmlFor="contractLink"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Contract Link/URL <span className="text-red-500">*</span>
              </label>
              <input
                id="contractLink"
                name="contractLink"
                type="url"
                value={formData.contractLink}
                onChange={handleChange}
                placeholder="https://example.com/contract/..."
                className="w-full rounded-lg border border-[#0f0f0f] bg-slate-50 px-4 py-3 text-slate-900 placeholder-[#a1a1aa] focus:border-indigo-500 focus:outline-none"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Project Start Date */}
            <div>
              <label
                htmlFor="projectStartDate"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Project Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="projectStartDate"
                name="projectStartDate"
                type="date"
                value={formData.projectStartDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-[#0f0f0f] bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Project Deadline */}
            <div>
              <label
                htmlFor="projectDeadline"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                Project Deadline <span className="text-red-500">*</span>
              </label>
              <input
                id="projectDeadline"
                name="projectDeadline"
                type="date"
                value={formData.projectDeadline}
                onChange={handleChange}
                min={
                  formData.projectStartDate ||
                  new Date().toISOString().split("T")[0]
                }
                className="w-full rounded-lg border border-[#0f0f0f] bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none"
                disabled={isSubmitting || !formData.projectStartDate}
                required
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-5 flex items-center gap-2 rounded-lg border px-4 py-3 ${message.type === "success"
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                : "border-red-500/50 bg-red-500/10 text-red-500"
                }`}
              role="alert"
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating Project..." : "Confirm & Start Project"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#0f0f0f] bg-slate-50 px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
