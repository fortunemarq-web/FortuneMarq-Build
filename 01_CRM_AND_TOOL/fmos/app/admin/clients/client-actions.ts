"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function saveClientPackage(
  clientId: string,
  data: {
    package_name: string;
    services: string[];
    monthly_value: number;
    onetime_value: number;
    start_date: string;
    renewal_date?: string;
    upsell_eligible: boolean;
    upsell_target?: string;
  }
) {
  const supabase = await createServerClientWithCookies();

  try {
    const { error } = await supabase
      .from("client_packages")
      .upsert(
        {
          client_id: clientId,
          package_name: data.package_name,
          services: data.services,
          monthly_value: data.monthly_value,
          onetime_value: data.onetime_value,
          start_date: data.start_date,
          renewal_date: data.renewal_date || null,
          upsell_eligible: data.upsell_eligible,
          upsell_target: data.upsell_target || null,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id" }
      );

    if (error) return { error: error.message };
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

export async function updateHealthScore(
  clientId: string,
  scores: {
    hs_payment: number;
    hs_results: number;
    hs_engagement: number;
    hs_tenure: number;
    hs_risk: number;
  },
  finalScore: number
) {
  const supabase = await createServerClientWithCookies();

  try {
    const { error } = await supabase
      .from("client_packages")
      .update({
        health_score: finalScore,
        health_updated_at: new Date().toISOString(),
        hs_payment: scores.hs_payment,
        hs_results: scores.hs_results,
        hs_engagement: scores.hs_engagement,
        hs_tenure: scores.hs_tenure,
        hs_risk: scores.hs_risk,
        upsell_eligible: finalScore >= 80,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", clientId);

    if (error) return { error: error.message };
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

export async function logUpsellAttempt(
  clientId: string,
  packageId: string | undefined,
  data: {
    current_services?: string[];
    target_service: string;
    method: string;
    outcome: string;
    follow_up_date?: string;
    converted_value?: number;
    notes?: string;
  }
) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    // Insert upsell attempt
    const { error: insertError } = await supabase
      .from("upsell_attempts")
      .insert({
        client_id: clientId,
        package_id: packageId || null,
        attempted_by: user.id,
        current_services: data.current_services || null,
        target_service: data.target_service,
        method: data.method,
        outcome: data.outcome,
        follow_up_date: data.follow_up_date || null,
        converted_value: data.converted_value || null,
        notes: data.notes || null,
        attempt_date: new Date().toISOString().split("T")[0],
      });

    if (insertError) return { error: insertError.message };

    // If converted, increment package value
    if (data.outcome === "converted" && data.converted_value && packageId) {
      await supabase.rpc("increment_package_value", {
        p_package_id: packageId,
        p_amount: data.converted_value,
      });

      await supabase
        .from("client_packages")
        .update({
          upsell_last_attempt_at: new Date().toISOString(),
          upsell_last_outcome: "converted",
          upsell_eligible: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", packageId);
    } else if (packageId) {
      await supabase
        .from("client_packages")
        .update({
          upsell_last_attempt_at: new Date().toISOString(),
          upsell_last_outcome: data.outcome,
          updated_at: new Date().toISOString(),
        })
        .eq("id", packageId);
    }

    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}
