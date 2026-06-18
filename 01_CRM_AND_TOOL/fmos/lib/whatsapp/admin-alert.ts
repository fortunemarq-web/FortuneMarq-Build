"use server";

/**
 * Send an admin_alert or staff_alert WhatsApp to all ADMIN_WHATSAPP_NUMBERS.
 * Template body: "FortuneMarq OS — {{1}}. {{2}} (automated alert)"
 */

import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";

export async function sendAdminAlert(headline: string, detail: string): Promise<void> {
  // De-duplicated admin numbers. We pass the REAL admin numbers straight to the
  // send layer and let it apply test-mode redirection + the hard allowlist ONCE.
  //
  // BUGFIX: previously this also called resolveRecipients() here and looped its
  // result — but sendWhatsAppTemplate calls resolveRecipients() AGAIN internally,
  // so in test mode the recipient set was expanded twice (N admin numbers ×
  // M test recipients × M again). One escalation fanned out to dozens of
  // messages. Resolving in exactly one place removes the multiplication.
  const numbers = Array.from(
    new Set(
      (process.env.ADMIN_WHATSAPP_NUMBERS || "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
    )
  );

  for (const num of numbers) {
    await sendWhatsAppTemplate(num, "admin_alert", {
      language: "en",
      // Admin alerts are operational, not lead-facing — never opt-out-suppressed,
      // never throttled (so the cap-reached alert itself can always send).
      bypassOptOut: true,
      bypassThrottle: true,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: headline },
            { type: "text", text: detail },
          ],
        },
      ],
    }).catch((e) => console.error("[admin-alert] send failed:", e));
  }
}
