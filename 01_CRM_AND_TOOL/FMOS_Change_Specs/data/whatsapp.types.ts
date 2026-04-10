// FortuneMarq WhatsApp Templates — TypeScript Types
// Used by FMOS to load, fill, and send the correct WhatsApp message at each stage.

export type TemplateCategory =
  | 'CURIOSITY'
  | 'BOT_REPLY'
  | 'OUTCOME_TRIGGERED'
  | 'FOLLOWBACK_REMINDER'
  | 'POST_MEETING'

export type SentBy =
  | 'jabeer_manual'
  | 'bot_auto'
  | 'fmos_auto_on_outcome_log'
  | 'afifa_fmos_button'

export type MetaCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export type LeadType = 'A' | 'B' | 'C' | 'D'

// A single WhatsApp template
export interface WhatsAppTemplate {
  id: string
  label: string
  variables: string[]           // variable names used in the message e.g. ["businessName", "city"]
  message: string | null        // null = no message sent (e.g. wrong number)
  description?: string
  handledBy?: string            // if this outcome is handled by another template file
  leadType?: LeadType           // for type-specific templates
  outcomeId?: string            // for outcome-triggered templates
  stage?: string                // for post-meeting templates
}

// A collection of templates grouped by category
export interface TemplateFile {
  category: TemplateCategory
  description: string
  sentBy: SentBy
  requiresMetaApproval: boolean
  metaCategory?: MetaCategory
  trigger?: string
  templates: WhatsAppTemplate[]
}

// Data needed to fill placeholders in any template
export interface TemplatePlaceholders {
  businessName?: string
  city?: string
  niche?: string
  searchVolume?: string
  landingPageLink?: string
  meetingDate?: string
  meetingTime?: string
  meetLink?: string
  followUpDate?: string
  followBackDate?: string
  followBackTime?: string
  callTime?: string
  name?: string
  proposalLink?: string
  invoiceLink?: string
  service1?: string
  service2?: string
  [key: string]: string | undefined
}

// What FMOS needs to send a WhatsApp message
export interface WhatsAppSendPayload {
  templateId: string
  recipientPhone: string
  placeholders: TemplatePlaceholders
  leadId: string
  triggeredBy: SentBy
  sentAt?: string
}
