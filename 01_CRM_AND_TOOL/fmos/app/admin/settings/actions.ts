"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface BusinessSettings {
  id?: string;
  business_name: string;
  gstin: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  gst_rate: number;
  invoice_prefix: string;
  payment_terms_days: number;
  /** Monthly MRR target (₹). 0 = no target set (forecast target UI hidden). */
  mrr_target: number;
}

// Not exported: "use server" modules may only export async functions,
// and this constant is only used inside this file anyway.
const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: "FortuneMarq Media & Marketing",
  gstin: "29ICWPS9816Q1ZS",
  address_line1: "Galaxy Mall, Floor 1, Shop 43",
  address_line2: "JC Nagar",
  city: "Hubli",
  state: "Karnataka",
  pincode: "580020",
  phone: "+91 93530 82656",
  email: "fortunemarq@gmail.com",
  bank_name: "Karnataka Bank",
  account_name: "FortuneMarq Media & Marketing",
  account_number: "0332202500001101",
  ifsc: "KARB0000332",
  gst_rate: 18,
  invoice_prefix: "FM",
  payment_terms_days: 15,
  mrr_target: 0,
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const supabase = await createServerClientWithCookies();
    const { data, error } = await supabase.from("business_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_SETTINGS;
    // DB row has nullable columns; DEFAULT_SETTINGS supplies the non-null shape.
    return { ...DEFAULT_SETTINGS, ...data } as BusinessSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveBusinessSettings(settings: BusinessSettings) {
  const supabase = await createServerClientWithCookies();

  // Try update first, then insert (upsert pattern)
  const db = supabase as any;
  const { data: existing } = await db.from("business_settings")
    .select("id")
    .limit(1)
    .single();

  let error;
  if (existing?.id) {
    const { error: updateError } = await db.from("business_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    error = updateError;
  } else {
    const { error: insertError } = await db.from("business_settings")
      .insert({ ...settings });
    error = insertError;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/admin/finance/invoices");
  return { success: true };
}
