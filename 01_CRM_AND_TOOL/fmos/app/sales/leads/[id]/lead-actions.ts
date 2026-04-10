"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function logCallOutcome(
  leadId: string,
  data: { outcome: string; notes?: string; follow_up_date?: string }
) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    // 1. Insert into lead_outcomes
    const { error: outcomeError } = await supabase
      .from("lead_outcomes")
      .insert({
        lead_id: leadId,
        outcome: data.outcome,
        notes: data.notes || null,
        follow_up_date: data.follow_up_date || null,
        logged_by: user.id,
      } as any);

    if (outcomeError) return { error: outcomeError.message };

    // 2. Update lead's last_contacted_at
    await supabase
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", leadId);

    // 3. Log activity event
    await supabase.from("activity_events").insert({
      entity_type: "lead",
      entity_id: leadId,
      event_type: "call_logged",
      description: `Call outcome: ${data.outcome}`,
      created_by: user.id,
    } as any);

    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}
