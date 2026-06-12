"use client";

import { useState } from "react";
import { saveBusinessSettings, BusinessSettings } from "@/app/admin/settings/actions";
import { Building, CreditCard, FileText, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface Props {
  initialSettings: BusinessSettings;
}

export default function BusinessSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof BusinessSettings, value: string | number) => {
    setSettings((s) => ({ ...s, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveBusinessSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof BusinessSettings, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={String(settings[key] ?? "")}
        onChange={(e) => update(key, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
      />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* SQL note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">One-time DB setup required</p>
        <p className="text-xs text-amber-800 font-mono bg-amber-100 rounded p-2 mt-1 leading-relaxed">
          CREATE TABLE IF NOT EXISTS business_settings (<br />
          &nbsp;&nbsp;id uuid PRIMARY KEY DEFAULT gen_random_uuid(),<br />
          &nbsp;&nbsp;business_name TEXT, gstin TEXT, address_line1 TEXT,<br />
          &nbsp;&nbsp;address_line2 TEXT, city TEXT, state TEXT, pincode TEXT,<br />
          &nbsp;&nbsp;phone TEXT, email TEXT, bank_name TEXT, account_name TEXT,<br />
          &nbsp;&nbsp;account_number TEXT, ifsc TEXT, gst_rate NUMERIC DEFAULT 18,<br />
          &nbsp;&nbsp;invoice_prefix TEXT DEFAULT 'FM',<br />
          &nbsp;&nbsp;payment_terms_days INTEGER DEFAULT 15,<br />
          &nbsp;&nbsp;updated_at TIMESTAMPTZ DEFAULT now()<br />
          );
        </p>
        <p className="text-xs text-amber-700 mt-2">Run this once in Supabase SQL editor, then save settings below.</p>
      </div>

      {/* Business Details */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <Building className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Business Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Business Name", "business_name", "text", "FortuneMarq Media & Marketing")}
          {field("GSTIN", "gstin", "text", "29ICWPS9816Q1ZS")}
          {field("Email", "email", "email", "fortunemarq@gmail.com")}
          {field("Phone", "phone", "text", "+91 93530 82656")}
          {field("Address Line 1", "address_line1", "text", "Galaxy Mall, Floor 1, Shop 43")}
          {field("Address Line 2", "address_line2", "text", "JC Nagar")}
          {field("City", "city", "text", "Hubli")}
          {field("State", "state", "text", "Karnataka")}
          {field("Pincode", "pincode", "text", "580020")}
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Bank Details</h2>
          <span className="ml-auto text-xs text-slate-400">Printed on every invoice</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Bank Name", "bank_name", "text", "Karnataka Bank")}
          {field("Account Name", "account_name", "text", "FortuneMarq Media & Marketing")}
          {field("Account Number", "account_number", "text", "0332202500001101")}
          {field("IFSC Code", "ifsc", "text", "KARB0000332")}
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <FileText className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-slate-900">Invoice Settings</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Invoice Prefix</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => update("invoice_prefix", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                placeholder="FM"
              />
              <span className="text-xs text-slate-400 shrink-0">e.g. FM-2026-001</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">GST Rate (%)</label>
            <input
              type="number"
              value={settings.gst_rate}
              onChange={(e) => update("gst_rate", Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Payment Terms (days)</label>
            <input
              type="number"
              value={settings.payment_terms_days}
              onChange={(e) => update("payment_terms_days", Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
            <CheckCircle className="h-4 w-4" /> Saved successfully
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
