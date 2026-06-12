import { getBusinessSettings } from "./actions";
import BusinessSettingsForm from "@/components/admin/settings/BusinessSettingsForm";
import { Settings } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mb-2">
            <Link href="/admin" className="hover:text-indigo-600">Admin</Link>
            <span>/</span>
            <span className="text-slate-900">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Business Settings</h1>
              <p className="text-sm text-slate-500 mt-0.5">GSTIN, bank details, invoice prefix — used on every invoice PDF.</p>
            </div>
          </div>
        </div>

        <BusinessSettingsForm initialSettings={settings} />

      </div>
    </div>
  );
}
