// FortuneMarq Proposal & Agreement — TypeScript Types
// Used by FMOS proposal generator to build and export proposal PDFs.

export type LeadType = 'A' | 'B' | 'C' | 'D'

export type ServiceId =
  | 'WEBSITE'
  | 'GMB'
  | 'SEO'
  | 'GOOGLE_ADS'
  | 'META_ADS'
  | 'WHATSAPP_MARKETING'
  | 'AI_AUTOMATIONS'

// Data auto-filled from the lead profile in FMOS
export interface ProposalAutoData {
  businessName: string
  ownerName: string
  city: string
  niche: string
  nicheKeyword: string
  searchVolume: string
  leadType: LeadType
  proposalDate: string
  proposalNumber: string
  meetingDate: string
}

// Pricing entered manually by Jabeer per service
export interface ServicePricing {
  serviceId: ServiceId
  setupFee: number       // 0 if no setup fee
  monthlyFee: number     // 0 if one-time only
}

// Full data Jabeer submits in FMOS to generate a proposal
export interface ProposalFormData {
  autoData: ProposalAutoData
  selectedServices: ServiceId[]
  pricing: ServicePricing[]
  startDate: string
}

// A single service card rendered on Page 4 of the proposal
export interface ServiceCard {
  id: ServiceId
  label: string
  layer: string
  tagline: string
  whatWeDo: string
  deliverables: string[]
  timeline: string
  whatWeNeed: string[]
  importantNote?: string
}

// Market opportunity content — type-specific
export interface MarketOpportunityContent {
  label: string
  intro: string
  finding: string
  opportunity: string
}

// Investment row in the pricing table
export interface InvestmentRow {
  service: string
  setupFee: number
  monthlyFee: number
}

// Full proposal data object passed to the PDF generator
export interface ProposalData {
  proposalNumber: string
  proposalDate: string
  autoData: ProposalAutoData
  marketOpportunity: MarketOpportunityContent
  selectedServiceCards: ServiceCard[]
  investmentRows: InvestmentRow[]
  totalSetupFee: number
  totalMonthlyFee: number
  startDate: string
}

// Agreement document data
export interface AgreementData {
  agreementNumber: string
  agreementDate: string
  proposalNumber: string
  ownerName: string
  businessName: string
  city: string
  selectedServices: string[]
  investmentRows: InvestmentRow[]
  totalSetupFee: number
  totalMonthlyFee: number
  startDate: string
}
