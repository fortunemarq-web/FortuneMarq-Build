/**
 * The exact set of WhatsApp template HANDLES approved on Meta.
 *
 * These are the only strings `sendWhatsAppTemplate(...)` may use — anything else
 * returns Meta error #132001 ("template name does not exist"). The `whatsapp_templates`
 * table stores human display names ("Meeting Confirmation"), NOT these handles, so any
 * picker that needs a sendable template name must source it from here, never from that
 * table. Keep this in sync with the templates approved in the Meta WhatsApp Manager.
 */
export const APPROVED_WA_TEMPLATES = [
  "admin_alert",
  "agreement_sent",
  "agreement_welcome",
  "approval_request",
  "automation_test_intro",
  "daily_report",
  "direct_report_type_a",
  "direct_report_type_b",
  "direct_report_type_c_",
  "direct_report_type_d",
  "follow_back",
  "followback_reminder_busy",
  "followback_reminder_interested",
  "followup_scheduled",
  "hello_world",
  "invoice_sent",
  "lead_ack_inbound",
  "meeting_confirmation",
  "meeting_noshow",
  "meeting_reminder_15m",
  "meeting_reminder_1h",
  "meeting_thanks",
  "missed_you",
  "monthly_report_ready",
  "not_interested",
  "onboarding_intake",
  "onboarding_reminder",
  "payment_overdue",
  "payment_partial_received",
  "payment_received",
  "payment_reminder",
  "project_update",
  "proposal_followup",
  "proposal_sent",
  "referral_request",
  "renewal_reminder",
  "review_request",
  "revival_nudge",
  "send_info",
  "staff_alert",
] as const;

export type ApprovedWaTemplate = (typeof APPROVED_WA_TEMPLATES)[number];

export function isApprovedWaTemplate(name: string): name is ApprovedWaTemplate {
  return (APPROVED_WA_TEMPLATES as readonly string[]).includes(name);
}
