"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function markClientRenewed(
  clientId: string,
  newRenewalDate: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("clients")
    .update({
      renewal_date: newRenewalDate,
      status: "active" as any,
    })
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/clients/renewals");
  revalidatePath("/admin/clients");
  return { success: true };
}

export async function markClientChurned(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("clients")
    .update({ status: "churned" as any })
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/clients/renewals");
  revalidatePath("/admin/clients");
  return { success: true };
}

export async function logUpsellAttempt(
  clientId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("clients")
    .update({
      last_upsell_attempt: new Date().toISOString().split("T")[0],
      upsell_notes: notes as any,
    })
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/clients/renewals");
  return { success: true };
}
