import { createAdminClient } from "@/lib/supabase-admin";

/**
 * PHASE F STAGE 1 — WhatsApp Cloud API sending library.
 * SERVER-SIDE ONLY (uses WHATSAPP_API_TOKEN). Never import from client components.
 *
 * Send types:
 *  - sendWhatsAppText        — session message (only valid inside the 24h customer window)
 *  - sendWhatsAppTemplate    — approved template (business-initiated, opens a window)
 *  - sendWhatsAppButtons     — interactive quick-reply buttons (session message)
 *  - sendWhatsAppDocument    — PDF/document by link or uploaded media id
 *  - uploadWhatsAppMedia     — upload a file buffer to Meta, returns media id
 *
 * Every successful send is logged to whatsapp_logs (direction='outbound').
 */

const GRAPH_VERSION = "v23.0";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function credentials(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId || token.startsWith("PLACEHOLDER")) return null;
  return { token, phoneNumberId };
}

/** Indian default: 10 digits → 91XXXXXXXXXX. Accepts +91/0 prefixed input. */
export function toWaNumber(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits.length > 10 ? digits : null;
}

async function graphPost(path: string, body: unknown): Promise<SendResult> {
  const creds = credentials();
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message || `Graph API ${res.status}`;
      console.error("[whatsapp/send] Graph error:", msg);
      return { success: false, error: msg };
    }
    return { success: true, messageId: json?.messages?.[0]?.id };
  } catch (e: any) {
    console.error("[whatsapp/send] network error:", e);
    return { success: false, error: e?.message || "Network error" };
  }
}

async function logOutbound(opts: {
  leadId?: string | null;
  phone: string;
  message: string;
  messageType: string;
  waMessageId?: string;
  sentBy?: string | null;
}) {
  try {
    const supabase = createAdminClient() as any;
    await supabase.from("whatsapp_logs").insert({
      lead_id: opts.leadId ?? null,
      message_sent: opts.message.slice(0, 4000),
      direction: "outbound",
      message_type: opts.messageType,
      wa_message_id: opts.waMessageId ?? null,
      phone: opts.phone,
      sent_by: opts.sentBy ?? null,
    });
  } catch (e) {
    console.error("[whatsapp/send] log failed:", e);
  }
}

/** Plain text — only valid within the 24h window after the customer's last message. */
export async function sendWhatsAppText(
  phone: string,
  body: string,
  opts?: { leadId?: string | null; sentBy?: string | null }
): Promise<SendResult> {
  const creds = credentials();
  const to = toWaNumber(phone);
  if (!to) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const result = await graphPost(`${creds.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: true, body },
  });
  if (result.success)
    await logOutbound({ ...opts, phone: to, message: body, messageType: "text", waMessageId: result.messageId });
  return result;
}

/** Approved template send (business-initiated). components per Graph API spec. */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  opts?: {
    language?: string;
    components?: unknown[];
    leadId?: string | null;
    sentBy?: string | null;
  }
): Promise<SendResult> {
  const creds = credentials();
  const to = toWaNumber(phone);
  if (!to) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const result = await graphPost(`${creds.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: opts?.language || "en" },
      ...(opts?.components ? { components: opts.components } : {}),
    },
  });
  if (result.success)
    await logOutbound({
      leadId: opts?.leadId,
      sentBy: opts?.sentBy,
      phone: to,
      message: `[template:${templateName}]`,
      messageType: "template",
      waMessageId: result.messageId,
    });
  return result;
}

/** Interactive quick-reply buttons — session message (24h window). Max 3 buttons. */
export async function sendWhatsAppButtons(
  phone: string,
  body: string,
  buttons: { id: string; title: string }[],
  opts?: { leadId?: string | null; sentBy?: string | null }
): Promise<SendResult> {
  const creds = credentials();
  const to = toWaNumber(phone);
  if (!to) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  const result = await graphPost(`${creds.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
  if (result.success)
    await logOutbound({ ...opts, phone: to, message: body, messageType: "interactive", waMessageId: result.messageId });
  return result;
}

/** Document (PDF etc.) by public link OR previously-uploaded media id. */
export async function sendWhatsAppDocument(
  phone: string,
  doc: { link?: string; mediaId?: string; filename: string; caption?: string },
  opts?: { leadId?: string | null; sentBy?: string | null }
): Promise<SendResult> {
  const creds = credentials();
  const to = toWaNumber(phone);
  if (!to) return { success: false, error: "Invalid phone number" };
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  if (!doc.link && !doc.mediaId) return { success: false, error: "Document needs a link or mediaId" };
  const result = await graphPost(`${creds.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: {
      ...(doc.mediaId ? { id: doc.mediaId } : { link: doc.link }),
      filename: doc.filename,
      ...(doc.caption ? { caption: doc.caption } : {}),
    },
  });
  if (result.success)
    await logOutbound({
      ...opts,
      phone: to,
      message: doc.caption ? `[document:${doc.filename}] ${doc.caption}` : `[document:${doc.filename}]`,
      messageType: "document",
      waMessageId: result.messageId,
    });
  return result;
}

/** Upload a file to Meta's media endpoint → media id (use for PDF report sends). */
export async function uploadWhatsAppMedia(
  file: Buffer | Uint8Array,
  mimeType: string,
  filename: string
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  const creds = credentials();
  if (!creds) return { success: false, error: "WhatsApp API credentials not configured" };
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([file as BlobPart], { type: mimeType }), filename);
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/media`,
      { method: "POST", headers: { Authorization: `Bearer ${creds.token}` }, body: form }
    );
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error?.message || `Graph API ${res.status}` };
    return { success: true, mediaId: json.id };
  } catch (e: any) {
    return { success: false, error: e?.message || "Upload failed" };
  }
}
