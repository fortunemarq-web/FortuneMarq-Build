// FortuneMarq WhatsApp Template Loader
// Import this in FMOS wherever a WhatsApp message needs to be sent.
//
// Usage examples:
//
//   // Get curiosity message for a Type B lead
//   const msg = getCuriosityTemplate('B')
//
//   // Get bot reply after lead replies to curiosity message
//   const msg = getBotReplyTemplate('C')
//
//   // Get message to send when Afifa logs an outcome
//   const msg = getOutcomeTemplate('INTERESTED_BOOK_NOW')
//
//   // Fill placeholders before sending
//   const filled = fillTemplate(msg.message, {
//     businessName: 'Fitness First Gym',
//     city: 'Hubli',
//     meetingDate: 'Thursday, 3rd April',
//     meetingTime: '11:00 AM',
//     meetLink: 'https://meet.google.com/xxx-xxxx-xxx',
//   })

import type {
  WhatsAppTemplate,
  TemplateFile,
  TemplatePlaceholders,
  LeadType,
} from './whatsapp.types'

import curiosityData from './curiosity_templates.json'
import botReplyData from './bot_reply_templates.json'
import outcomeData from './outcome_templates.json'
import followbackData from './followback_reminder_templates.json'
import postMeetingData from './post_meeting_templates.json'

const curiosityTemplates = curiosityData as TemplateFile
const botReplyTemplates = botReplyData as TemplateFile
const outcomeTemplates = outcomeData as TemplateFile
const followbackTemplates = followbackData as TemplateFile
const postMeetingTemplates = postMeetingData as TemplateFile

// --- CURIOSITY ---

/**
 * Get the curiosity message for a specific lead type.
 * Jabeer sends these manually as a batch before calling begins.
 */
export function getCuriosityTemplate(leadType: LeadType): WhatsAppTemplate {
  const template = curiosityTemplates.templates.find(
    (t) => t.leadType === leadType
  )
  if (!template) throw new Error(`No curiosity template found for lead type: ${leadType}`)
  return template
}

// --- BOT REPLY ---

/**
 * Get the bot reply template for a specific lead type.
 * Auto-sent when a lead replies to the curiosity message.
 * Sends the niche landing page link with context.
 */
export function getBotReplyTemplate(leadType: LeadType): WhatsAppTemplate {
  const template = botReplyTemplates.templates.find(
    (t) => t.leadType === leadType
  )
  if (!template) throw new Error(`No bot reply template found for lead type: ${leadType}`)
  return template
}

// --- OUTCOME TRIGGERED ---

/**
 * Get the message to send when Afifa logs a specific call outcome.
 * Returns null if no message should be sent for this outcome.
 */
export function getOutcomeTemplate(outcomeId: string): WhatsAppTemplate | null {
  const template = outcomeTemplates.templates.find(
    (t) => t.outcomeId === outcomeId
  )
  if (!template) return null
  if (!template.message) return null  // outcomes like WRONG_NUMBER send nothing
  return template
}

// --- FOLLOW-BACK REMINDER ---

/**
 * Get the follow-back day reminder template.
 * Sent by Afifa on the day of a scheduled follow-back call.
 */
export function getFollowbackReminderTemplate(): WhatsAppTemplate {
  return followbackTemplates.templates[0]
}

// --- POST MEETING ---

/**
 * Get a post-meeting template by ID.
 * IDs: PROPOSAL_SENT, PROPOSAL_FOLLOWUP, AGREEMENT_REQUEST, INVOICE_SENT
 */
export function getPostMeetingTemplate(templateId: string): WhatsAppTemplate {
  const template = postMeetingTemplates.templates.find(
    (t) => t.id === templateId
  )
  if (!template) throw new Error(`No post-meeting template found with ID: ${templateId}`)
  return template
}

// --- PLACEHOLDER FILLER ---

/**
 * Replaces all {{variable}} tokens in a template message with real values.
 * Call this before sending any WhatsApp message.
 */
export function fillTemplate(
  message: string,
  placeholders: TemplatePlaceholders
): string {
  return message.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return placeholders[key] ?? `[${key}]`
  })
}

// --- FULL SEND HELPER ---

/**
 * Get a filled, ready-to-send message string for any template.
 * Returns null if this outcome/template sends no message.
 */
export function getReadyMessage(
  template: WhatsAppTemplate | null,
  placeholders: TemplatePlaceholders
): string | null {
  if (!template || !template.message) return null
  return fillTemplate(template.message, placeholders)
}

export {
  curiosityTemplates,
  botReplyTemplates,
  outcomeTemplates,
  followbackTemplates,
  postMeetingTemplates,
}

export type { WhatsAppTemplate, TemplateFile, TemplatePlaceholders, LeadType }
