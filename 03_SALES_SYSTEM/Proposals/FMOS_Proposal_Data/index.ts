// FortuneMarq Proposal Generator — Loader Utility
// Import this in the FMOS proposal generation feature.
//
// Usage:
//   import { buildProposalData, buildAgreementData, getServiceCard, getMarketOpportunity } from '@/data/proposals'
//
//   // Build the full proposal data object ready for PDF generation
//   const proposalData = buildProposalData(formData)
//
//   // Build agreement data after proposal is confirmed
//   const agreementData = buildAgreementData(proposalData, agreementDate)

import type {
  ProposalFormData,
  ProposalData,
  AgreementData,
  ServiceCard,
  MarketOpportunityContent,
  InvestmentRow,
  LeadType,
  ServiceId,
} from './proposal.types'

import servicesRaw from './services_data.json'
import schemaRaw from './proposal_schema.json'

const servicesData = servicesRaw as { services: ServiceCard[] }
const schema = schemaRaw

// --- SERVICE HELPERS ---

/**
 * Get the full service card data for a given service ID.
 * Used to populate Page 4 of the proposal.
 */
export function getServiceCard(serviceId: ServiceId): ServiceCard {
  const service = servicesData.services.find((s) => s.id === serviceId)
  if (!service) throw new Error(`No service found with ID: ${serviceId}`)
  return service
}

/**
 * Fill service card placeholders with lead-specific data.
 */
export function fillServiceCard(card: ServiceCard, city: string, niche: string): ServiceCard {
  const fill = (text: string) =>
    text.replace(/\{\{city\}\}/g, city).replace(/\{\{niche\}\}/g, niche)

  return {
    ...card,
    tagline: fill(card.tagline),
    whatWeDo: fill(card.whatWeDo),
  }
}

// --- MARKET OPPORTUNITY ---

/**
 * Get the market opportunity content for a specific lead type.
 * Fills in the search volume, niche keyword, city, and niche placeholders.
 */
export function getMarketOpportunity(
  leadType: LeadType,
  placeholders: {
    city: string
    niche: string
    nicheKeyword: string
    searchVolume: string
  }
): MarketOpportunityContent {
  const page = schema.pages.find((p) => p.pageId === 'MARKET_OPPORTUNITY') as any
  const variant = page?.typeVariants?.[leadType]
  if (!variant) throw new Error(`No market opportunity content for lead type: ${leadType}`)

  const fill = (text: string) =>
    text
      .replace(/\{\{city\}\}/g, placeholders.city)
      .replace(/\{\{niche\}\}/g, placeholders.niche)
      .replace(/\{\{nicheKeyword\}\}/g, placeholders.nicheKeyword)
      .replace(/\{\{searchVolume\}\}/g, placeholders.searchVolume)

  return {
    label: variant.label,
    intro: fill(variant.intro),
    finding: fill(variant.finding),
    opportunity: fill(variant.opportunity),
  }
}

// --- PROPOSAL BUILDER ---

/**
 * Builds the complete ProposalData object from the form Jabeer submits in FMOS.
 * This is the object passed to the PDF generator.
 */
export function buildProposalData(form: ProposalFormData): ProposalData {
  const { autoData, selectedServices, pricing, startDate } = form

  // Build investment rows
  const investmentRows: InvestmentRow[] = pricing.map((p) => {
    const service = getServiceCard(p.serviceId)
    return {
      service: service.label,
      setupFee: p.setupFee,
      monthlyFee: p.monthlyFee,
    }
  })

  const totalSetupFee = investmentRows.reduce((sum, r) => sum + r.setupFee, 0)
  const totalMonthlyFee = investmentRows.reduce((sum, r) => sum + r.monthlyFee, 0)

  // Build service cards with placeholders filled
  const selectedServiceCards = selectedServices.map((id) => {
    const card = getServiceCard(id)
    return fillServiceCard(card, autoData.city, autoData.niche)
  })

  // Get market opportunity content
  const marketOpportunity = getMarketOpportunity(autoData.leadType, {
    city: autoData.city,
    niche: autoData.niche,
    nicheKeyword: autoData.nicheKeyword,
    searchVolume: autoData.searchVolume,
  })

  return {
    proposalNumber: autoData.proposalNumber,
    proposalDate: autoData.proposalDate,
    autoData,
    marketOpportunity,
    selectedServiceCards,
    investmentRows,
    totalSetupFee,
    totalMonthlyFee,
    startDate,
  }
}

// --- AGREEMENT BUILDER ---

/**
 * Builds the AgreementData object from a confirmed proposal.
 * Called when the client confirms and Jabeer generates the agreement doc.
 */
export function buildAgreementData(
  proposal: ProposalData,
  agreementDate: string,
  agreementNumber: string
): AgreementData {
  return {
    agreementNumber,
    agreementDate,
    proposalNumber: proposal.proposalNumber,
    ownerName: proposal.autoData.ownerName,
    businessName: proposal.autoData.businessName,
    city: proposal.autoData.city,
    selectedServices: proposal.selectedServiceCards.map((s) => s.label),
    investmentRows: proposal.investmentRows,
    totalSetupFee: proposal.totalSetupFee,
    totalMonthlyFee: proposal.totalMonthlyFee,
    startDate: proposal.startDate,
  }
}

export type {
  ProposalFormData,
  ProposalData,
  AgreementData,
  ServiceCard,
  MarketOpportunityContent,
  InvestmentRow,
  LeadType,
  ServiceId,
}
