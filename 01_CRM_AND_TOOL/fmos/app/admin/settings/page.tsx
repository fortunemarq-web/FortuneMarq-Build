import { getBusinessSettings } from "./actions";
import BusinessSettingsForm from "@/components/admin/settings/BusinessSettingsForm";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default async function SettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link href="/admin" className="hover:text-brand-deep">Admin</Link>
            <span>/</span>
            <span className="text-slate-900">Settings</span>
          </div>
          <PageHeader
            title="Business Settings"
            subtitle="GSTIN, bank details, invoice prefix — used on every invoice PDF."
          />
        </div>

        <BusinessSettingsForm initialSettings={settings} />

      </div>
    </div>
  );
}
