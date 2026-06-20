"use client";

import { useState } from "react";
import { saveBusinessSettings, BusinessSettings } from "@/app/admin/settings/actions";
import { Building, CreditCard, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</Label>
      <Input
        type={type}
        value={String(settings[key] ?? "")}
        onChange={(e) => update(key, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* SQL note */}
      <div className="rounded-xl border border-warn-line bg-warn-soft p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warn">One-time DB setup required</p>
        <p className="mt-1 rounded bg-amber-100 p-2 font-mono text-xs leading-relaxed text-amber-800">
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
        <p className="mt-2 text-xs text-warn">Run this once in Supabase SQL editor, then save settings below.</p>
      </div>

      {/* Business Details */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building className="h-4 w-4 text-slate-400" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {field("Business Name", "business_name", "text", "FortuneMarq Media & Marketing")}
          {field("GSTIN", "gstin", "text", "29ICWPS9816Q1ZS")}
          {field("Email", "email", "email", "fortunemarq@gmail.com")}
          {field("Phone", "phone", "text", "+91 93530 82656")}
          {field("Address Line 1", "address_line1", "text", "Galaxy Mall, Floor 1, Shop 43")}
          {field("Address Line 2", "address_line2", "text", "JC Nagar")}
          {field("City", "city", "text", "Hubli")}
          {field("State", "state", "text", "Karnataka")}
          {field("Pincode", "pincode", "text", "580020")}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Bank Details
          </CardTitle>
          <span className="text-xs text-slate-400">Printed on every invoice</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {field("Bank Name", "bank_name", "text", "Karnataka Bank")}
          {field("Account Name", "account_name", "text", "FortuneMarq Media & Marketing")}
          {field("Account Number", "account_number", "text", "0332202500001101")}
          {field("IFSC Code", "ifsc", "text", "KARB0000332")}
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-slate-400" />
            Invoice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice Prefix</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => update("invoice_prefix", e.target.value)}
                className="tabular-nums"
                placeholder="FM"
              />
              <span className="shrink-0 text-xs text-slate-400">e.g. FM-2026-001</span>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">GST Rate (%)</Label>
            <Input
              type="number"
              value={settings.gst_rate}
              onChange={(e) => update("gst_rate", Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Terms (days)</Label>
            <Input
              type="number"
              value={settings.payment_terms_days}
              onChange={(e) => update("payment_terms_days", Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
            <CheckCircle className="h-4 w-4" /> Saved successfully
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
