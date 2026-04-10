"use client";

import { useState, useTransition } from "react";
import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/app/admin/clients/actions";
import { useRouter } from "next/navigation";

const SERVICE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "local_seo", label: "Local SEO" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "smm", label: "Social Media" },
  { value: "whatsapp", label: "WhatsApp Marketing" },
];

export default function AddClientModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createClient({
        business_name: fd.get("business_name") as string,
        owner_name: fd.get("owner_name") as string,
        phone: fd.get("phone") as string,
        primary_email: fd.get("primary_email") as string,
        city: fd.get("city") as string,
        niche: fd.get("niche") as string,
        services,
        monthly_value: parseFloat(fd.get("monthly_value") as string) || 0,
        start_date: fd.get("start_date") as string,
        renewal_date: fd.get("renewal_date") as string,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          if (result.clientId) {
            router.push(`/admin/clients/${result.clientId}`);
          } else {
            router.refresh();
          }
        }, 1200);
      } else {
        setError(result.error ?? "Failed to create client");
      }
    });
  };

  const toggleService = (val: string) => {
    setServices((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#42CA80] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#38b571] transition-colors min-h-[44px]"
      >
        <Plus className="h-4 w-4" />
        Add Client
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
            <p className="text-xs text-slate-500">
              Onboarding checklist will be created automatically
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); setError(""); }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <CheckCircle2 className="h-12 w-12 text-[#42CA80]" />
            <p className="text-sm font-semibold text-slate-900">
              Client created successfully!
            </p>
            <p className="text-xs text-slate-500">
              Redirecting to profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                name="business_name"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20"
                placeholder="e.g. Sunrise Dental Clinic"
              />
            </div>

            {/* Owner + Phone row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name</label>
                <input name="owner_name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="Dr. Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input name="phone" type="tel" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input name="primary_email" type="email" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="owner@business.com" />
            </div>

            {/* City + Niche */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input name="city" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="Hubli" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Niche</label>
                <input name="niche" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="Dental" />
              </div>
            </div>

            {/* Services multi-select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Services</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.value}
                    type="button"
                    onClick={() => toggleService(svc.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all min-h-[36px] ${
                      services.includes(svc.value)
                        ? "border-[#42CA80] bg-[#42CA80]/10 text-[#2a9d5c]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MRR + Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MRR (₹)</label>
                <input name="monthly_value" type="number" min="0" step="100" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20 font-mono" placeholder="5000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input name="start_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Date</label>
                <input name="renewal_date" type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#42CA80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b571] disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Client"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(""); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
