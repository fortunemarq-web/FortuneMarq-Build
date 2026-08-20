// FortuneMarq Telecaller Script — TypeScript Types
// Used by FMOS calling interface to load and display scripts

export type ScriptType = 'A' | 'B' | 'C' | 'D'

export type LineType = 'script' | 'branch' | 'note'

export type OutcomeCategory =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'FOLLOW_BACK'
  | 'DEAD'

// A single line in the script
export interface ScriptLine {
  type: LineType
  text: string
  textKn?: string    // Kanglish (Kannada in Latin script); falls back to text
  condition?: string // e.g. "If no", "If still resistant"
}

// An objection and its response — attached to a step
export interface Objection {
  trigger: string     // what the lead says
  triggerKn?: string  // the same objection in Kanglish (recognition cue)
  response: string    // what Afifa says back
  responseKn?: string // Kanglish response; falls back to response
}

// One step in the script (e.g. Introduction, Data Hook, Meeting Ask)
export interface ScriptStep {
  stepId: number
  stepName: string
  lines: ScriptLine[]
  objections: Objection[]
}

// A call outcome option shown to Afifa after the call
export interface CallOutcome {
  id: string
  label: string
  category: OutcomeCategory
  requiresReason?: boolean
  reasons?: string[]             // for NOT_INTERESTED
  subOptions?: string[]          // for WRONG_NUMBER / DEAD
  markAs?: ('cold' | 'dead')[]   // for NOT_INTERESTED
  actions: string[]              // system actions to trigger
  whatsappTemplate: string | null
}

// Post-call WhatsApp message template
export interface PostCallWhatsApp {
  templateId: string
  trigger: string   // outcome id that triggers this
  message: string   // message text with [placeholders]
}

// The full script object loaded for a lead
export interface TelecallerScript {
  type: ScriptType
  typeLabel: string
  pdfType: string
  condition: Record<string, string>
  steps: ScriptStep[]
  outcomes: CallOutcome[]
  postCallWhatsApp: PostCallWhatsApp[]
}

// Lead data shape used to determine script type
export interface LeadScriptData {
  SERP_Ranked: 'Y' | 'N'
  Has_Website: 'Y' | 'N'
  isLowVolume?: boolean  // set true for Type D niches
}

// Placeholders that FMOS replaces before displaying the script
export interface ScriptPlaceholders {
  businessName: string
  city: string
  niche: string
  nicheKeyword: string
  searchVolume: string
  pdfLink?: string
}
