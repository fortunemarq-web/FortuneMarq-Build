/**
 * HARD OUTBOUND ALLOWLIST — belt-and-suspenders WhatsApp safety guard.
 *
 * Pre-launch (i.e. while WHATSAPP_LAUNCH !== "1") EVERY outbound WhatsApp
 * recipient is filtered against WHATSAPP_ALLOWLIST in BOTH test and live mode;
 * anything off the list is DROPPED and logged. This guarantees no stray number
 * receives an automated message before launch even if WHATSAPP_SEND_MODE or
 * WHATSAPP_TEST_RECIPIENTS are misconfigured.
 *
 *   WHATSAPP_ALLOWLIST   comma-separated numbers. Defaults to the two locked
 *                        QA numbers when unset.
 *   WHATSAPP_LAUNCH=1    disables the allowlist (go-live switch).
 *
 * Pure / dependency-free so it can be unit-tested without the send stack.
 */

const DEFAULT_ALLOWLIST = "+918904192656,+919353082656";

/** Last 10 digits (Indian numbers; tolerant of +91 / 0 / formatting). */
function last10(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : d;
}

/** null ⇒ allowlist disabled (launched). Otherwise the set of allowed last-10 keys. */
export function allowlistKeys(): Set<string> | null {
  if (process.env.WHATSAPP_LAUNCH === "1") return null;
  const raw = process.env.WHATSAPP_ALLOWLIST ?? DEFAULT_ALLOWLIST;
  return new Set(
    raw.split(",").map((p) => last10(p)).filter((d) => d.length === 10)
  );
}

/** True when this recipient may be messaged (always true once launched). */
export function isAllowlisted(phone: string): boolean {
  const allow = allowlistKeys();
  if (allow === null) return true;
  return allow.has(last10(phone));
}

/** Split a recipient list into kept + dropped (dropped are off-allowlist). */
export function filterAllowlist(phones: string[]): { allowed: string[]; dropped: string[] } {
  const allow = allowlistKeys();
  if (allow === null) return { allowed: phones, dropped: [] };
  const allowed: string[] = [];
  const dropped: string[] = [];
  for (const p of phones) (allow.has(last10(p)) ? allowed : dropped).push(p);
  return { allowed, dropped };
}
