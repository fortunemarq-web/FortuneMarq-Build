// FortuneMarq FMOS — Onboarding Loader
// Loads the onboarding checklists and generates per-client onboarding records.

import type {
  ServiceId,
  ServiceOnboarding,
  ClientOnboardingRecord,
  ClientOnboardingTask,
  ClientAssetRecord,
  OnboardingChecklist,
} from './onboarding.types'

import checklistsData from './onboarding_checklists.json'

const checklists = checklistsData as OnboardingChecklist

// ── GET CHECKLIST FOR A SINGLE SERVICE ──────────────────────────────────────

export function getServiceChecklist(serviceId: ServiceId): ServiceOnboarding | null {
  return checklists.services[serviceId] ?? null
}

// ── GET ALL SERVICE IDs ──────────────────────────────────────────────────────

export function getAllServiceIds(): ServiceId[] {
  return Object.keys(checklists.services) as ServiceId[]
}

// ── GENERATE CLIENT ONBOARDING RECORD ───────────────────────────────────────
// Called when a client agreement is confirmed.
// Merges checklists for all services the client signed for into one flat task list.

export function generateClientOnboarding(params: {
  clientId: string
  agreementId: string
  services: ServiceId[]
}): Omit<ClientOnboardingRecord, 'id'> {
  const { clientId, agreementId, services } = params

  const tasks: ClientOnboardingTask[] = []
  const assets: ClientAssetRecord[] = []

  for (const serviceId of services) {
    const checklist = checklists.services[serviceId]
    if (!checklist) continue

    // Jabeer's action tasks
    for (const action of checklist.jabeerActions) {
      tasks.push({
        taskId: `${serviceId}_${action.taskId}`,
        serviceId,
        task: action.task,
        owner: action.owner as ClientOnboardingTask['owner'],
        dueBy: action.dueBy,
        notes: action.notes,
        status: 'PENDING',
      })
    }

    // Team tasks (cousins)
    if (checklist.teamTasks) {
      for (const teamTask of checklist.teamTasks) {
        tasks.push({
          taskId: `${serviceId}_${teamTask.taskId}`,
          serviceId,
          task: teamTask.task,
          owner: teamTask.owner as ClientOnboardingTask['owner'],
          dueBy: teamTask.dueBy,
          status: 'PENDING',
        })
      }
    }

    // Assets to collect
    for (const asset of checklist.assetsToCollect) {
      assets.push({
        assetId: `${serviceId}_${asset.assetId}`,
        serviceId,
        asset: asset.asset,
        required: asset.required,
        status: 'NOT_COLLECTED',
        notes: asset.notes,
      })
    }
  }

  return {
    clientId,
    agreementId,
    services,
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
    tasks,
    assets,
  }
}

// ── CHECK ONBOARDING COMPLETION ──────────────────────────────────────────────
// Returns true only when all required tasks are DONE and all required assets are STORED.

export function isOnboardingComplete(record: ClientOnboardingRecord): boolean {
  const allTasksDone = record.tasks.every((t) => t.status === 'DONE')
  const allRequiredAssetsStored = record.assets
    .filter((a) => a.required)
    .every((a) => a.status === 'STORED')

  return allTasksDone && allRequiredAssetsStored
}

// ── GET PENDING TASKS FOR A SERVICE ─────────────────────────────────────────

export function getPendingTasksForService(
  record: ClientOnboardingRecord,
  serviceId: ServiceId
): ClientOnboardingTask[] {
  return record.tasks.filter(
    (t) => t.serviceId === serviceId && t.status !== 'DONE'
  )
}

// ── GET MISSING REQUIRED ASSETS ─────────────────────────────────────────────

export function getMissingRequiredAssets(
  record: ClientOnboardingRecord
): ClientAssetRecord[] {
  return record.assets.filter(
    (a) => a.required && a.status !== 'STORED'
  )
}

// ── ONBOARDING FLOW STEPS (for display in FMOS UI) ──────────────────────────

export function getOnboardingFlow(): Record<string, string> {
  return checklists.onboarding_flow
}

export { checklists }
