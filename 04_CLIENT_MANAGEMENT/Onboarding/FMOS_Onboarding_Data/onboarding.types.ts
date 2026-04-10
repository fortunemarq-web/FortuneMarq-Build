// FortuneMarq FMOS — Onboarding Types
// Used by the onboarding module in FMOS to display and track client onboarding tasks

export type ServiceId =
  | 'WEBSITE'
  | 'GMB'
  | 'SEO'
  | 'GOOGLE_ADS'
  | 'META_ADS'
  | 'WHATSAPP_MARKETING'
  | 'AI_AUTOMATIONS'

export type TaskOwner = 'Jabeer' | 'Zaid' | 'Sufiyan' | 'Afifa' | 'Client'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'

export type AssetStatus = 'NOT_COLLECTED' | 'REQUESTED' | 'RECEIVED' | 'STORED'

export interface OnboardingTask {
  taskId: string
  task: string
  owner: TaskOwner
  dueBy: string
  template?: string       // WhatsApp template ID if applicable
  store?: string          // Where to store in Asset Vault
  notes?: string
  // Runtime fields (added by FMOS when generating the client's checklist)
  status?: TaskStatus
  completedAt?: string
  completedBy?: string
}

export interface AssetItem {
  assetId: string
  asset: string
  format: string
  storeIn: string
  required: boolean
  notes?: string
  // Runtime fields
  status?: AssetStatus
  receivedAt?: string
  fileUrl?: string        // URL in FMOS file storage once uploaded
}

export interface TeamTask {
  taskId: string
  task: string
  owner: TaskOwner
  dueBy: string
  submitVia: string
  status?: TaskStatus
  submittedAt?: string
  reviewedAt?: string
}

export interface ServiceOnboarding {
  label: string
  onboardingTimeTarget: string
  jabeerActions: OnboardingTask[]
  assetsToCollect: AssetItem[]
  teamTasks?: TeamTask[]
}

export interface OnboardingChecklist {
  description: string
  version: string
  triggeredBy: string
  assignedTo: string
  onboarding_flow: Record<string, string>
  services: Record<ServiceId, ServiceOnboarding>
}

// ── CLIENT ONBOARDING INSTANCE ──────────────────────────────────────────────
// This is the shape of the onboarding record created per client in Supabase.

export interface ClientOnboardingRecord {
  id: string                          // UUID
  clientId: string                    // FK → clients table
  agreementId: string                 // FK → agreements table
  services: ServiceId[]               // Services the client signed for
  status: 'IN_PROGRESS' | 'COMPLETE'
  startedAt: string                   // ISO timestamp
  completedAt?: string
  tasks: ClientOnboardingTask[]
  assets: ClientAssetRecord[]
}

export interface ClientOnboardingTask {
  taskId: string
  serviceId: ServiceId
  task: string
  owner: TaskOwner
  dueBy: string
  notes?: string
  status: TaskStatus
  completedAt?: string
  completedBy?: string
}

export interface ClientAssetRecord {
  assetId: string
  serviceId: ServiceId
  asset: string
  required: boolean
  status: AssetStatus
  receivedAt?: string
  fileUrl?: string
  notes?: string
}
