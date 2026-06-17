"use server";

/**
 * 4.6 — Delivery-stage WhatsApp sends.
 *
 * Two business-initiated templates fired from the delivery loop:
 *   - project_update      [contactName, milestoneName]  — milestone went live
 *   - monthly_report_ready[contactName, month, url]      — monthly report published
 *
 * Both go through sendWhatsAppTemplate, which routes via resolveRecipients —
 * so WHATSAPP_SEND_MODE=test transparently redirects to the test numbers and
 * real clients are never messaged during QA.
 */

import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import type { SendResult } from "@/lib/whatsapp/send";

/** Fired when every task under a milestone is done. */
export async function sendProjectUpdate(
  phone: string,
  contactName: string,
  milestoneName: string,
  opts?: { leadId?: string | null }
): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, "project_update", {
    language: "en",
    leadId: opts?.leadId ?? null,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: contactName },
          { type: "text", text: milestoneName },
        ],
      },
    ],
  });
}

/** Fired when a monthly report is published — link is the public magic-link URL. */
export async function sendMonthlyReportReady(
  phone: string,
  contactName: string,
  monthLabel: string,
  reportUrl: string,
  opts?: { leadId?: string | null }
): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, "monthly_report_ready", {
    language: "en",
    leadId: opts?.leadId ?? null,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: contactName },
          { type: "text", text: monthLabel },
          { type: "text", text: reportUrl },
        ],
      },
    ],
  });
}
