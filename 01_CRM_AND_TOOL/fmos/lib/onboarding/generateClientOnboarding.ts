// Phase D3: Generate onboarding tasks + asset vault entries for a new client.
// Called when a client is created from a confirmed agreement.

import { SupabaseClient } from "@supabase/supabase-js";

interface ServiceTask {
  task_id: string;
  task: string;
  owner: string;
  due_by: string;
  notes?: string;
}

interface ServiceAsset {
  asset_id: string;
  asset_name: string;
  required: boolean;
  format?: string;
}

// ── Static onboarding data per service ──────────────────────────

const SERVICE_TASKS: Record<string, ServiceTask[]> = {
  WEBSITE: [
    { task_id: "WEB_01", task: "Send welcome message to client", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "WEB_02", task: "Share Website Brief Form link with client", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "WEB_03", task: "Review completed Brief Form", owner: "Jabeer", due_by: "Day 2–3" },
    { task_id: "WEB_04", task: "Share Brief Form with Zaid/Sufiyan", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "WEB_05", task: "Complete wireframe / first draft", owner: "Zaid/Sufiyan", due_by: "Day 7" },
    { task_id: "WEB_06", task: "Review draft with client", owner: "Jabeer", due_by: "Day 10" },
    { task_id: "WEB_07", task: "Implement revisions and go live", owner: "Zaid/Sufiyan", due_by: "Day 14–21" },
  ],
  GMB: [
    { task_id: "GMB_01", task: "Request GMB access from client", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "GMB_02", task: "Audit current GMB listing", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "GMB_03", task: "Optimise categories, description, hours", owner: "Jabeer", due_by: "Day 2" },
    { task_id: "GMB_04", task: "Upload minimum 10 business photos", owner: "Zaid/Sufiyan", due_by: "Day 3" },
    { task_id: "GMB_05", task: "Schedule monthly GMB posts", owner: "Jabeer", due_by: "Day 7 (ongoing)" },
  ],
  SEO: [
    { task_id: "SEO_01", task: "Keyword research for niche + city", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "SEO_02", task: "Set up Google Search Console (if not already)", owner: "Jabeer", due_by: "Day 2" },
    { task_id: "SEO_03", task: "Share keyword plan with client", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "SEO_04", task: "Begin content publishing (monthly)", owner: "Jabeer", due_by: "Day 7 (ongoing)" },
  ],
  GOOGLE_ADS: [
    { task_id: "GADS_01", task: "Get Google Ads account access or create new", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "GADS_02", task: "Set up campaigns, ad groups, keywords", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "GADS_03", task: "Share initial campaign structure with client", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "GADS_04", task: "Monitor and optimise weekly", owner: "Jabeer", due_by: "Day 5 (ongoing)" },
  ],
  META_ADS: [
    { task_id: "META_01", task: "Get Facebook Business Manager access", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "META_02", task: "Set up Pixel + audiences", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "META_03", task: "Design first ad creatives", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "META_04", task: "Monitor and optimise weekly", owner: "Jabeer", due_by: "Day 5 (ongoing)" },
  ],
};

const SERVICE_ASSETS: Record<string, ServiceAsset[]> = {
  WEBSITE: [
    { asset_id: "WEB_LOGO", asset_name: "Logo (PNG transparent)", required: true, format: "PNG" },
    { asset_id: "WEB_PHOTOS", asset_name: "Business photos (JPG, min 10)", required: true, format: "JPG" },
    { asset_id: "WEB_DOMAIN", asset_name: "Domain login (username + password)", required: true },
    { asset_id: "WEB_HOSTING", asset_name: "Hosting login (if separate)", required: true },
    { asset_id: "WEB_CONTENT", asset_name: "Existing content / copy", required: false },
    { asset_id: "WEB_SOCIAL", asset_name: "Social media links", required: false },
  ],
  GMB: [
    { asset_id: "GMB_LOGIN", asset_name: "GMB login or access", required: true },
    { asset_id: "GMB_PHOTOS", asset_name: "Business photos (min 10)", required: true, format: "JPG" },
    { asset_id: "GMB_DESC", asset_name: "Business description (owner-written)", required: false },
  ],
  SEO: [
    { asset_id: "SEO_GSC", asset_name: "Google Search Console access", required: true },
    { asset_id: "SEO_GA", asset_name: "Google Analytics access", required: false },
  ],
  GOOGLE_ADS: [
    { asset_id: "GADS_LOGIN", asset_name: "Google Ads login or manager access", required: true },
    { asset_id: "GADS_BUDGET", asset_name: "Ad budget confirmation (email/WhatsApp)", required: true },
  ],
  META_ADS: [
    { asset_id: "META_BM", asset_name: "Facebook Business Manager access", required: true },
    { asset_id: "META_IG", asset_name: "Instagram account access", required: true },
    { asset_id: "META_BUDGET", asset_name: "Ad budget confirmation", required: true },
  ],
};

/**
 * Generate onboarding tasks and asset vault entries for a newly created client.
 * Called when an agreement is confirmed and a client record is created.
 *
 * @param supabase - Supabase client
 * @param clientId - UUID of the newly created client
 * @param services - Array of service IDs (e.g., ['WEBSITE', 'GMB', 'SEO'])
 */
export async function generateClientOnboarding(
  supabase: SupabaseClient,
  clientId: string,
  services: string[]
): Promise<void> {
  // Generate tasks for each service
  const taskInserts: any[] = [];
  const assetInserts: any[] = [];

  for (const serviceId of services) {
    const tasks = SERVICE_TASKS[serviceId] || [];
    const assets = SERVICE_ASSETS[serviceId] || [];

    for (const task of tasks) {
      taskInserts.push({
        client_id: clientId,
        service_id: serviceId,
        task_id: task.task_id,
        task: task.task,
        owner: task.owner,
        due_by: task.due_by,
        notes: task.notes || null,
        status: "PENDING",
      });
    }

    for (const asset of assets) {
      assetInserts.push({
        client_id: clientId,
        service_id: serviceId,
        asset_id: asset.asset_id,
        asset_name: asset.asset_name,
        required: asset.required,
        status: "NOT_COLLECTED",
      });
    }
  }

  // Batch insert tasks
  if (taskInserts.length > 0) {
    await (supabase as any).from("client_onboarding_tasks").insert(taskInserts);
    // TODO: regenerate types after client_onboarding_tasks migration
  }

  // Batch insert asset vault entries
  if (assetInserts.length > 0) {
    await (supabase as any).from("client_asset_vault").insert(assetInserts);
    // TODO: regenerate types after client_asset_vault migration
  }
}

export { SERVICE_TASKS, SERVICE_ASSETS };
