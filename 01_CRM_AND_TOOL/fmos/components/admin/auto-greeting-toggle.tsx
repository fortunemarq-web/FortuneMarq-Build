"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { Zap } from "lucide-react";

/**
 * PHASE F STAGE 1 — WhatsApp auto-greeting toggle.
 * New inbound WhatsApp/CTWA leads get an instant session reply when ON.
 * Stored in app_settings ('whatsapp_auto_greeting'). Default ON.
 */
export default function AutoGreetingToggle() {
  const supabase = createClient() as any;
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_auto_greeting")
        .maybeSingle();
      if (error) {
        // Table may not exist until the Stage 1 SQL is run — treat as default ON
        setEnabled(true);
        return;
      }
      setEnabled(data?.value?.enabled !== false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    const { data: current } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "whatsapp_auto_greeting")
      .maybeSingle();
    const { error } = await supabase.from("app_settings").upsert({
      key: "whatsapp_auto_greeting",
      value: { ...(current?.value ?? {}), enabled: next },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(`Couldn't update auto-greeting: ${error.message}`);
      return;
    }
    setEnabled(next);
    toast.success(`Auto-greeting ${next ? "enabled" : "disabled"}`);
  };

  return (
    <button
      onClick={toggle}
      disabled={enabled === null || saving}
      title="Instant WhatsApp reply to new inbound leads ('Got your enquiry — we'll call you shortly')"
      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all disabled:opacity-50 ${
        enabled
          ? "bg-brand-deep/10 border-brand-deep/20 text-brand-deep"
          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
      }`}
    >
      <Zap className="h-4 w-4" />
      Auto-greeting {enabled === null ? "…" : enabled ? "ON" : "OFF"}
      <span
        className={`ml-1 w-8 h-4 rounded-full relative transition-colors ${
          enabled ? "bg-brand-deep" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            enabled ? "left-4.5 right-0.5" : "left-0.5"
          }`}
          style={{ left: enabled ? "calc(100% - 0.875rem)" : "0.125rem" }}
        />
      </span>
    </button>
  );
}
