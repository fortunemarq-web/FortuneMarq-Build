"use server";

/**
 * Send an admin_alert or staff_alert WhatsApp to all ADMIN_WHATSAPP_NUMBERS.
 * Template body: "FortuneMarq OS — {{1}}. {{2}} (automated alert)"
 */

import { sendWhatsAppTemplate, resolveRecipients } from "@/lib/whatsapp/send";

export async function sendAdminAlert(headline: string, detail: string): Promise<void> {
  const numbers = (process.env.ADMIN_WHATSAPP_NUMBERS || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  for (const num of numbers) {
    const { phones } = resolveRecipients(num);
    for (const phone of phones) {
      await sendWhatsAppTemplate(phone, "admin_alert", {
        language: "en",
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
}
