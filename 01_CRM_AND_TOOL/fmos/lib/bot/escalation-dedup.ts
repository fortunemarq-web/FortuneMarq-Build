/**
 * Idempotency for escalation admin alerts. At most ONE admin alert per
 * (leadId, trigger) within the window — repeated triggers from the same lead in
 * a short burst do not re-fire.
 *
 * ANONYMOUS visitors (no leadId — e.g. a website-chat visitor who hasn't given a
 * name + phone) NEVER alert: this returns false. The web widget still shows the
 * WhatsApp handoff (escalate:true); a human is only pinged once a real lead
 * exists. This is what stopped a single anonymous web escalation from paging the
 * admin team at all.
 *
 * In-memory + best-effort across server instances; it is layered behind the hard
 * allowlist (lib/whatsapp/guards.ts) and the admin-alert fan-out fix, which are
 * the deterministic guarantees. Pure/dependency-free for unit testing.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const recent = new Map<string, number>();

export function shouldSendEscalationAlert(
  leadId: string | undefined | null,
  trigger: string,
  now: number = Date.now()
): boolean {
  if (!leadId) return false; // anonymous → never alert
  const key = `${leadId}:${trigger}`;
  const last = recent.get(key);
  if (last !== undefined && now - last < WINDOW_MS) return false;
  recent.set(key, now);
  // Opportunistic prune so the map can't grow unbounded.
  if (recent.size > 500) {
    for (const [k, t] of recent) if (now - t >= WINDOW_MS) recent.delete(k);
  }
  return true;
}

/** Test-only: reset the dedup window. */
export function __resetEscalationDedup(): void {
  recent.clear();
}
