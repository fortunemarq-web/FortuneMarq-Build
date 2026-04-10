"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveClientPackage } from "./client-actions";

interface PackageModalProps {
  client: { id: string; business_name: string; package?: any };
  onClose: () => void;
}

const SERVICES = [
  "standard_website",
  "premium_website",
  "ecom_website",
  "landing_page",
  "google_ads_mgmt",
  "meta_ads_mgmt",
  "seo_starter",
  "seo_growth",
  "seo_dominate",
  "gmb_setup",
  "gmb_management",
  "whatsapp_marketing",
  "monthly_reporting",
  "logo_branding",
];

const SERVICE_LABELS: Record<string, string> = {
  standard_website: "Standard Website",
  premium_website: "Premium Website",
  ecom_website: "E-Commerce Website",
  landing_page: "Landing Page",
  google_ads_mgmt: "Google Ads Mgmt",
  meta_ads_mgmt: "Meta Ads Mgmt",
  seo_starter: "SEO Starter",
  seo_growth: "SEO Growth",
  seo_dominate: "SEO Dominate",
  gmb_setup: "GMB Setup",
  gmb_management: "GMB Management",
  whatsapp_marketing: "WhatsApp Marketing",
  monthly_reporting: "Monthly Reporting",
  logo_branding: "Logo & Branding",
};

export default function PackageModal({ client, onClose }: PackageModalProps) {
  const router = useRouter();
  const pkg = client.package;

  const [packageName, setPackageName] = useState(pkg?.package_name || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(
    pkg?.services || []
  );
  const [monthlyValue, setMonthlyValue] = useState(pkg?.monthly_value || 0);
  const [onetimeValue, setOnetimeValue] = useState(pkg?.onetime_value || 0);
  const [startDate, setStartDate] = useState(
    pkg?.start_date || new Date().toISOString().split("T")[0]
  );
  const [renewalDate, setRenewalDate] = useState(pkg?.renewal_date || "");
  const [upsellEligible, setUpsellEligible] = useState(
    pkg?.upsell_eligible || false
  );
  const [upsellTarget, setUpsellTarget] = useState(pkg?.upsell_target || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    if (!packageName.trim()) {
      setError("Package name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveClientPackage(client.id, {
      package_name: packageName,
      services: selectedServices,
      monthly_value: monthlyValue,
      onetime_value: onetimeValue,
      start_date: startDate,
      renewal_date: renewalDate || undefined,
      upsell_eligible: upsellEligible,
      upsell_target: upsellTarget || undefined,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {pkg ? "Edit" : "Add"} Package
            </h2>
            <p className="text-xs text-slate-500">{client.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Package Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Package Name
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Website + Google Ads"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Services Included
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedServices.includes(service)
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {SERVICE_LABELS[service] || service}
                </button>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Monthly Value ₹
              </label>
              <input
                type="number"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                One-time Value ₹
              </label>
              <input
                type="number"
                value={onetimeValue}
                onChange={(e) => setOnetimeValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Renewal Date
              </label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Upsell Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={upsellEligible}
                onChange={(e) => setUpsellEligible(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-blue-800">
                Upsell Eligible
              </span>
            </label>
            {upsellEligible && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-blue-700 mb-1.5">
                  Target Upsell Service
                </label>
                <input
                  type="text"
                  value={upsellTarget}
                  onChange={(e) => setUpsellTarget(e.target.value)}
                  placeholder="e.g. SEO Growth"
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Package"}
          </button>
        </div>
      </div>
    </div>
  );
}
