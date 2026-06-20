"use client";

import { useState, useTransition } from "react";
import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/app/admin/clients/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

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
      <Button onClick={() => setOpen(true)} variant="primary">
        <Plus className="h-4 w-4" />
        Add Client
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">Add New Client</h2>
            <p className="text-xs text-slate-500">
              Onboarding checklist will be created automatically
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); setError(""); }}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <CheckCircle2 className="h-12 w-12 text-brand" />
            <p className="text-sm font-semibold text-slate-900">
              Client created successfully!
            </p>
            <p className="text-xs text-slate-500">
              Redirecting to profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Business Name */}
            <div>
              <Label>
                Business Name <span className="text-danger">*</span>
              </Label>
              <Input
                name="business_name"
                required
                placeholder="e.g. Sunrise Dental Clinic"
              />
            </div>

            {/* Owner + Phone row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner Name</Label>
                <Input name="owner_name" placeholder="Dr. Sharma" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input name="phone" type="tel" placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <Input name="primary_email" type="email" placeholder="owner@business.com" />
            </div>

            {/* City + Niche */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input name="city" placeholder="Hubli" />
              </div>
              <div>
                <Label>Niche</Label>
                <Input name="niche" placeholder="Dental" />
              </div>
            </div>

            {/* Services multi-select */}
            <div>
              <Label>Services</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.value}
                    type="button"
                    onClick={() => toggleService(svc.value)}
                    className={cn(
                      "min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      services.includes(svc.value)
                        ? "border-brand-line bg-brand-soft text-brand-deep"
                        : "border-line bg-surface text-slate-600 hover:border-line-strong"
                    )}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MRR + Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>MRR (₹)</Label>
                <Input name="monthly_value" type="number" min="0" step="100" placeholder="5000" className="tabular-nums" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input name="start_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input name="renewal_date" type="date" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-danger-line bg-danger-soft px-4 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Client"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => { setOpen(false); setError(""); }}
                variant="secondary"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
