import { createAdminClient } from "@/lib/supabase-admin";

/**
 * WhatsApp recipient resolution for the automation engine's `send_whatsapp` action.
 * SERVER-ONLY. Three channels, by audience:
 *   - lead / client → the entity's own phone (with opt-out guard)
 *   - admin         → ADMIN_WHATSAPP_NUMBERS (env, comma-separated E.164)
 *   - staff         → the assigned owner's WhatsApp number (profiles.phone)
 *
 * Everything here is defensive: it reads fields off a `select("*")` snapshot, so a
 * missing column (e.g. wa_opt_out, profiles.phone before those are added) just makes
 * the relevant guard/lookup no-op rather than throw. Zero schema prerequisites.
 */

export type WaAudience = "lead" | "client" | "admin" | "staff";

/** Admin WhatsApp numbers from env (comma-separated E.164, no '+'). */
export function adminNumbers(): string[] {
  return (process.env.ADMIN_WHATSAPP_NUMBERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The lead/client's own phone, tolerant of differing column names across tables. */
export function entityPhone(snapshot: any): string | null {
  return (
    snapshot?.phone ||
    snapshot?.contact_phone ||
    snapshot?.primary_phone ||
    snapshot?.whatsapp ||
    snapshot?.mobile ||
    null
  );
}

/**
 * Opt-out guard. Returns true when the entity has opted out of WhatsApp and must
 * NOT be messaged. Defensive: false when the column is absent (undefined).
 */
export function isOptedOut(snapshot: any): boolean {
  return snapshot?.wa_opt_out === true || snapshot?.do_not_contact === true;
}

/**
 * Resolve the staff/assignee WhatsApp number for an entity. Looks up the owner
 * (assigned_sales_exec → assigned_to → created_by) in profiles. Uses select("*")
 * so it never errors if profiles has no phone column yet — it just returns null,
 * meaning "staff number not available yet" and the send is skipped.
 */
export async function staffPhone(snapshot: any): Promise<string | null> {
  const userId =
    snapshot?.assigned_sales_exec || snapshot?.assigned_to || snapshot?.created_by || null;
  if (!userId) return null;
  try {
    const supabase = createAdminClient() as any;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!data) return null;
    if (data.wa_opt_in === false) return null; // staff opted out of personal alerts
    return data.phone || data.whatsapp || data.mobile || null;
  } catch {
    return null;
  }
}
