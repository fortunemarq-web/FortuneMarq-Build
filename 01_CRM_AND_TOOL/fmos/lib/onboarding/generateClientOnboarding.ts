// Phase D3: Generate onboarding tasks + asset vault entries for a new client.
// Called when a client is created from a confirmed agreement.
//
// 2026-06-15: tightened into a "build-ready intake".
//   - GENERAL (client basics) is ALWAYS added, regardless of services.
//   - WEBSITE assets are now a full build-ready brief (zero back-and-forth for Zaid/Sufiyan).
//   - WHATSAPP_MARKETING + AI_AUTOMATIONS now have real task/asset sets.
//   Required assets gate the per-service "Ready to build" status in the UI.

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
  // Always added — universal client intake, independent of services purchased.
  GENERAL: [
    { task_id: "GEN_01", task: "Send welcome message + onboarding WhatsApp", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "GEN_02", task: "Confirm primary goal + target customer with client", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "GEN_03", task: "Collect brand kit + core business details", owner: "Jabeer", due_by: "Day 1–2" },
    { task_id: "GEN_04", task: "Create client portal login", owner: "Jabeer", due_by: "Day 2" },
  ],
  WEBSITE: [
    { task_id: "WEB_01", task: "Share Website Brief with client", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "WEB_02", task: "Collect brief + confirm it is build-ready", owner: "Jabeer", due_by: "Day 2–3" },
    { task_id: "WEB_03", task: "Hand build-ready brief to Zaid/Sufiyan", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "WEB_04", task: "Wireframe / first draft", owner: "Zaid/Sufiyan", due_by: "Day 7" },
    { task_id: "WEB_05", task: "Review draft with client", owner: "Jabeer", due_by: "Day 10" },
    { task_id: "WEB_06", task: "Implement revisions and go live", owner: "Zaid/Sufiyan", due_by: "Day 14–21" },
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
  WHATSAPP_MARKETING: [
    { task_id: "WA_01", task: "Confirm WhatsApp number + Business profile", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "WA_02", task: "Define audience + source of opt-in contacts", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "WA_03", task: "Draft message templates for client approval", owner: "Jabeer", due_by: "Day 2" },
    { task_id: "WA_04", task: "Submit templates to Meta + await approval", owner: "Jabeer", due_by: "Day 3" },
    { task_id: "WA_05", task: "Schedule first broadcast / sequence", owner: "Jabeer", due_by: "Day 5 (ongoing)" },
  ],
  AI_AUTOMATIONS: [
    { task_id: "AI_01", task: "Map the workflow to automate (enquiry → reply, booking, follow-up)", owner: "Jabeer", due_by: "Day 0" },
    { task_id: "AI_02", task: "Collect access to the tools/channels involved", owner: "Jabeer", due_by: "Day 1" },
    { task_id: "AI_03", task: "Build + test the automation", owner: "Zaid/Sufiyan", due_by: "Day 3–5" },
    { task_id: "AI_04", task: "Go live + monitor", owner: "Jabeer", due_by: "Day 7 (ongoing)" },
  ],
};

const SERVICE_ASSETS: Record<string, ServiceAsset[]> = {
  // Universal client basics — collected once, used by every service.
  GENERAL: [
    { asset_id: "GEN_BIZNAME", asset_name: "Legal business name", required: true },
    { asset_id: "GEN_OWNER", asset_name: "Owner name + direct WhatsApp/phone", required: true },
    { asset_id: "GEN_ADDRESS", asset_name: "Business address + service areas/cities", required: true },
    { asset_id: "GEN_HOURS", asset_name: "Operating hours", required: true },
    { asset_id: "GEN_GOAL", asset_name: "Primary goal (more calls / walk-ins / online sales)", required: true },
    { asset_id: "GEN_LOGO", asset_name: "Logo (vector or transparent PNG)", required: true, format: "SVG/PNG" },
    { asset_id: "GEN_PHOTOS", asset_name: "Business photos / videos (min 10)", required: true, format: "JPG" },
    { asset_id: "GEN_BRAND", asset_name: "Brand colours + fonts + tagline", required: false },
    { asset_id: "GEN_GST", asset_name: "GST number (if registered)", required: false },
    { asset_id: "GEN_SOCIAL", asset_name: "Social media links", required: false },
  ],
  // WEBSITE = the full build-ready brief. When all required items are Stored, the build can start.
  WEBSITE: [
    { asset_id: "WEB_DOMAIN", asset_name: "Domain access (or confirm 'agency registers')", required: true },
    { asset_id: "WEB_HOSTING", asset_name: "Hosting access (or confirm 'agency provides')", required: true },
    { asset_id: "WEB_PAGES", asset_name: "Pages wanted (Home, About, Services, Contact, Gallery, Booking…)", required: true },
    { asset_id: "WEB_CONTENT", asset_name: "Page content/copy (or mark 'agency writes')", required: true },
    { asset_id: "WEB_CONTACT", asset_name: "Contact details to display (phone, email, address)", required: true },
    { asset_id: "WEB_MAPS", asset_name: "Google Maps location link", required: true },
    { asset_id: "WEB_WA", asset_name: "WhatsApp click-to-chat number", required: true },
    { asset_id: "WEB_LEADDEST", asset_name: "Where website enquiries should go (email / WhatsApp / CRM)", required: true },
    { asset_id: "WEB_INTEGRATIONS", asset_name: "Integrations needed (booking, payment, forms)", required: false },
    { asset_id: "WEB_REFS", asset_name: "2–3 reference websites they like", required: false },
  ],
  GMB: [
    { asset_id: "GMB_LOGIN", asset_name: "GMB login or access", required: true },
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
  WHATSAPP_MARKETING: [
    { asset_id: "WA_NUMBER", asset_name: "Client WhatsApp Business number", required: true },
    { asset_id: "WA_BMACCESS", asset_name: "Meta Business / WABA access", required: true },
    { asset_id: "WA_LIST", asset_name: "Customer contact list (opt-in)", required: true },
    { asset_id: "WA_OFFER", asset_name: "Offer / message content", required: true },
  ],
  AI_AUTOMATIONS: [
    { asset_id: "AI_GOAL", asset_name: "Process to automate (described)", required: true },
    { asset_id: "AI_ACCESS", asset_name: "Access to channels/tools (WhatsApp, email, sheet, etc.)", required: true },
    { asset_id: "AI_DATA", asset_name: "Sample data / FAQs / canned responses", required: false },
  ],
};

/**
 * Generate onboarding tasks and asset vault entries for a newly created client.
 * Called when an agreement is confirmed and a client record is created.
 *
 * GENERAL (client basics) is ALWAYS included, even if not in `services`.
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
  // Always lead with the universal client-basics intake.
  const allServices = ["GENERAL", ...services.filter((s) => s !== "GENERAL")];

  const taskInserts: any[] = [];
  const assetInserts: any[] = [];

  for (const serviceId of allServices) {
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
    await supabase.from("client_onboarding_tasks").insert(taskInserts);
  }

  // Batch insert asset vault entries
  if (assetInserts.length > 0) {
    await supabase.from("client_asset_vault").insert(assetInserts);
  }
}

export { SERVICE_TASKS, SERVICE_ASSETS };
