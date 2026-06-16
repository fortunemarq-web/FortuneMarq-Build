"use server";

import { runTrigger } from "@/lib/automations/engine";

/**
 * Fire an automation trigger from anywhere (client or server) without risk.
 *
 * Thin, fail-open wrapper around the automation engine's runTrigger. Every error
 * is swallowed and logged — a failed automation must NEVER break the UI path that
 * called it. Client components should call this fire-and-forget (`void fireTrigger(...)`).
 *
 * Inert by design: runTrigger only does anything if an enabled rule in
 * automation_rules matches (entity_type + trigger). No rule → no-op.
 */
export async function fireTrigger(
    trigger: string,
    entityType: string,
    entityId: string,
    context?: any
): Promise<void> {
    try {
        await runTrigger(trigger, entityType, entityId, null, context);
    } catch (e) {
        console.error(`[automation] fireTrigger(${trigger}, ${entityType}, ${entityId}) failed:`, e);
    }
}
