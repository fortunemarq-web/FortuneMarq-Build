// FortuneMarq Telecaller Script Loader
// Import this in the FMOS calling interface to get the correct script for a lead.
//
// Usage:
//   import { getScriptForLead, fillPlaceholders } from '@/data/scripts'
//
//   const script = getScriptForLead({ SERP_Ranked: 'Y', Has_Website: 'Y' })
//   const filledStep = fillPlaceholders(script.steps[0].lines[0].text, {
//     businessName: lead.business_name,
//     city: lead.city,
//     niche: lead.niche,
//     nicheKeyword: 'gym near me',
//     searchVolume: '63,950',
//   })

import type {
  TelecallerScript,
  LeadScriptData,
  ScriptPlaceholders,
  ScriptType,
} from './script.types'

import scriptA from './script_type_A.json'
import scriptB from './script_type_B.json'
import scriptC from './script_type_C.json'
import scriptD from './script_type_D.json'

const scripts: Record<ScriptType, TelecallerScript> = {
  A: scriptA as TelecallerScript,
  B: scriptB as TelecallerScript,
  C: scriptC as TelecallerScript,
  D: scriptD as TelecallerScript,
}

/**
 * Determines the correct script type for a lead based on their online presence data.
 * Type D (low volume) must be flagged manually or by a niche threshold in your data layer.
 *
 * Logic:
 *   isLowVolume = true           → Type D
 *   SERP_Ranked = Y              → Type A
 *   Has_Website = Y, Ranked = N  → Type B
 *   Has_Website = N, Ranked = N  → Type C
 */
export function getScriptType(lead: LeadScriptData): ScriptType {
  if (lead.isLowVolume) return 'D'
  if (lead.SERP_Ranked === 'Y') return 'A'
  if (lead.Has_Website === 'Y' && lead.SERP_Ranked === 'N') return 'B'
  return 'C'
}

/**
 * Returns the full script object for a lead.
 */
export function getScriptForLead(lead: LeadScriptData): TelecallerScript {
  const type = getScriptType(lead)
  return scripts[type]
}

/**
 * Replaces all [Placeholder] tokens in a script text string with real lead data.
 * Call this before displaying any script line to Afifa.
 */
export function fillPlaceholders(
  text: string,
  data: ScriptPlaceholders
): string {
  return text
    .replace(/\[Business Name\]/g, data.businessName)
    .replace(/\[City\]/g, data.city)
    .replace(/\[Niche\]/g, data.niche)
    .replace(/\[Niche Keyword\]/g, data.nicheKeyword)
    .replace(/\[Search Volume\]/g, data.searchVolume)
    .replace(/\[PDF Link\]/g, data.pdfLink ?? '')
}

/**
 * Returns all steps for a script, with placeholders filled in.
 * This is the main function to call when rendering the calling interface.
 */
export function getFilledScript(
  lead: LeadScriptData,
  placeholders: ScriptPlaceholders
): TelecallerScript {
  const script = getScriptForLead(lead)

  const filledSteps = script.steps.map((step) => ({
    ...step,
    lines: step.lines.map((line) => ({
      ...line,
      text: fillPlaceholders(line.text, placeholders),
      ...(line.textKn ? { textKn: fillPlaceholders(line.textKn, placeholders) } : {}),
    })),
    objections: step.objections.map((obj) => ({
      ...obj,
      response: fillPlaceholders(obj.response, placeholders),
      ...(obj.responseKn ? { responseKn: fillPlaceholders(obj.responseKn, placeholders) } : {}),
    })),
  }))

  const filledWhatsApp = script.postCallWhatsApp.map((template) => ({
    ...template,
    message: fillPlaceholders(template.message, placeholders),
  }))

  return {
    ...script,
    steps: filledSteps,
    postCallWhatsApp: filledWhatsApp,
  }
}

export { scripts }
export type { TelecallerScript, LeadScriptData, ScriptPlaceholders, ScriptType }
