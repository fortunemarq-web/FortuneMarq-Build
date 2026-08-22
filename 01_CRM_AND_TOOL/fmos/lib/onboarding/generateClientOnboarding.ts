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
    { task_id: "GEN_01", task: "Send welcome message + onboarding WhatsApp", owner: "Jabeer", due_by: "Day 0", notes: "Send the standard welcome + onboarding template via WhatsApp to the number on file. Nothing to collect for this one." },
    { task_id: "GEN_02", task: "Confirm primary goal + target customer with client", owner: "Jabeer", due_by: "Day 1", notes: "Ask on a call or WhatsApp: what's the one goal — more calls, more walk-ins, or more online sales? Log the answer in Client Notes (Overview tab) — it shapes every report and message going forward." },
    { task_id: "GEN_03", task: "Collect brand kit + core business details", owner: "Jabeer", due_by: "Day 1–2", notes: "Collect the items listed under Assets to Collect below (name, address, hours, goal, logo, photos) over WhatsApp or a call. Upload each file against its own entry below and mark it Stored — don't save it anywhere else." },
    { task_id: "GEN_04", task: "Create client portal login", owner: "Jabeer", due_by: "Day 2", notes: "Create their login from this profile so they can view reports at /client/dashboard. Only relevant if they actually want portal access — mark this Not Applicable if they don't." },
  ],
  WEBSITE: [
    { task_id: "WEB_01", task: "Share Website Brief with client", owner: "Jabeer", due_by: "Day 0", notes: "Send the standard Website Brief form/link over WhatsApp or email — the same brief for every client, don't customise it per client." },
    { task_id: "WEB_02", task: "Collect brief + confirm it is build-ready", owner: "Jabeer", due_by: "Day 2–3", notes: "Check the returned brief for gaps (missing pages, no content, no contact details) before it goes to build. Send it back if it isn't build-ready." },
    { task_id: "WEB_03", task: "Hand build-ready brief to Zaid/Sufiyan", owner: "Jabeer", due_by: "Day 3", notes: "Hand off the completed brief plus every collected asset in one message — don't make them chase missing pieces." },
    { task_id: "WEB_04", task: "Wireframe / first draft", owner: "Zaid/Sufiyan", due_by: "Day 7", notes: "Freelancer builds the first draft. Check in on progress, don't sign off until Jabeer reviews it in the next task." },
    { task_id: "WEB_05", task: "Review draft with client", owner: "Jabeer", due_by: "Day 10", notes: "Walk the client through the draft live (call or screen share) and write down every requested change." },
    { task_id: "WEB_06", task: "Implement revisions and go live", owner: "Zaid/Sufiyan", due_by: "Day 14–21", notes: "Freelancer applies the revisions, Jabeer QAs against the brief, then it goes live." },
  ],
  GMB: [
    { task_id: "GMB_01", task: "Request GMB access from client", owner: "Jabeer", due_by: "Day 0", notes: "Request manager access to the client's own existing listing — never create a new listing if one already exists." },
    { task_id: "GMB_02", task: "Audit current GMB listing", owner: "Jabeer", due_by: "Day 1", notes: "Check current categories, description, hours, and photo count against what's missing or wrong." },
    { task_id: "GMB_03", task: "Optimise categories, description, hours", owner: "Jabeer", due_by: "Day 2", notes: "Fill in categories, a keyword-rich description, and correct hours directly inside GMB." },
    { task_id: "GMB_04", task: "Upload minimum 10 business photos", owner: "Zaid/Sufiyan", due_by: "Day 3", notes: "Collect at least 10 real business photos (office, team, work) over WhatsApp and upload them straight to GMB." },
    { task_id: "GMB_05", task: "Schedule monthly GMB posts", owner: "Jabeer", due_by: "Day 7 (ongoing)", notes: "Set a running 2x/week posting cadence in GMB — this is ongoing, don't expect it to ever sit at 'done' permanently." },
  ],
  SEO: [
    { task_id: "SEO_01", task: "Keyword research for niche + city", owner: "Jabeer", due_by: "Day 0", notes: "Pull real keyword volume for their niche + city from the same keyword data used for every other client — don't guess." },
    { task_id: "SEO_02", task: "Set up Google Search Console (if not already)", owner: "Jabeer", due_by: "Day 2", notes: "Add the client's site as a property in Search Console using their access and verify ownership." },
    { task_id: "SEO_03", task: "Share keyword plan with client", owner: "Jabeer", due_by: "Day 3", notes: "Share the plan as a simple one-page summary over WhatsApp — not a raw spreadsheet." },
    { task_id: "SEO_04", task: "Begin content publishing (monthly)", owner: "Jabeer", due_by: "Day 7 (ongoing)", notes: "Publish content against the keyword plan every month — ongoing, not a one-time task." },
  ],
  GOOGLE_ADS: [
    { task_id: "GADS_01", task: "Get Google Ads account access or create new", owner: "Jabeer", due_by: "Day 0", notes: "Confirm the account is the client's own — their billing, their ownership, never yours. Send a manager-link invite from the FortuneMarq MCC (982-189-5523) in Google Ads; they accept it from their own account. Record the linked Ads Account ID in Client Notes." },
    { task_id: "GADS_02", task: "Set up campaigns, ad groups, keywords", owner: "Jabeer", due_by: "Day 1", notes: "Build the campaign → ad group → keyword structure for their niche/city before spending a rupee of their budget." },
    { task_id: "GADS_03", task: "Share initial campaign structure with client", owner: "Jabeer", due_by: "Day 3", notes: "Send a plain-language summary of what's running and why — not a screenshot of the Ads dashboard." },
    { task_id: "GADS_04", task: "Monitor and optimise weekly", owner: "Jabeer", due_by: "Day 5 (ongoing)", notes: "Check spend, CPL, and performance weekly — ongoing for as long as the retainer runs." },
  ],
  META_ADS: [
    { task_id: "META_01", task: "Get Facebook Business Manager access", owner: "Jabeer", due_by: "Day 0", notes: "Get added to their Facebook Business Manager — never create a new BM under your own account for their brand." },
    { task_id: "META_02", task: "Set up Pixel + audiences", owner: "Jabeer", due_by: "Day 1", notes: "Install/verify the Pixel on their site and build the audiences you'll target." },
    { task_id: "META_03", task: "Design first ad creatives", owner: "Jabeer", due_by: "Day 3", notes: "Design the first creative set using their real photos/videos — never stock images for a local business." },
    { task_id: "META_04", task: "Monitor and optimise weekly", owner: "Jabeer", due_by: "Day 5 (ongoing)", notes: "Check spend and performance weekly — ongoing for the life of the retainer." },
  ],
  WHATSAPP_MARKETING: [
    { task_id: "WA_01", task: "Confirm WhatsApp number + Business profile", owner: "Jabeer", due_by: "Day 0", notes: "Confirm which number they want messaging from and that it has a WhatsApp Business profile set up." },
    { task_id: "WA_02", task: "Define audience + source of opt-in contacts", owner: "Jabeer", due_by: "Day 1", notes: "Confirm where their contact list actually comes from — it must be opt-in, never scraped or purchased." },
    { task_id: "WA_03", task: "Draft message templates for client approval", owner: "Jabeer", due_by: "Day 2", notes: "Draft the actual message templates and get explicit client sign-off before submitting anything to Meta." },
    { task_id: "WA_04", task: "Submit templates to Meta + await approval", owner: "Jabeer", due_by: "Day 3", notes: "Submit approved templates to Meta — approval can take 2–7 days, don't leave this to the last minute." },
    { task_id: "WA_05", task: "Schedule first broadcast / sequence", owner: "Jabeer", due_by: "Day 5 (ongoing)", notes: "Schedule the first send once templates are approved — ongoing after that." },
  ],
  AI_AUTOMATIONS: [
    { task_id: "AI_01", task: "Map the workflow to automate (enquiry → reply, booking, follow-up)", owner: "Jabeer", due_by: "Day 0", notes: "Write down the exact trigger → action the client wants automated before building anything." },
    { task_id: "AI_02", task: "Collect access to the tools/channels involved", owner: "Jabeer", due_by: "Day 1", notes: "Get real, standing access to every tool/channel involved (WhatsApp, email, sheet, etc.) — nothing gets built on borrowed or temporary access." },
    { task_id: "AI_03", task: "Build + test the automation", owner: "Zaid/Sufiyan", due_by: "Day 3–5", notes: "Build it, then test with real sample messages before the client ever sees it live." },
    { task_id: "AI_04", task: "Go live + monitor", owner: "Jabeer", due_by: "Day 7 (ongoing)", notes: "Turn it on, then check it's behaving correctly on the first few real uses — don't walk away right after go-live." },
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

  // Idempotency guard: never re-generate a service's tasks/assets if they already exist
  // for this client (calling this twice — e.g. a stale page re-rendering the empty state —
  // used to insert a full duplicate batch on top of the existing rows).
  const { data: existing } = await supabase
    .from("client_onboarding_tasks")
    .select("service_id")
    .eq("client_id", clientId);
  const existingServiceIds = new Set((existing ?? []).map((r: any) => r.service_id));
  const newServices = allServices.filter((s) => !existingServiceIds.has(s));

  const taskInserts: any[] = [];
  const assetInserts: any[] = [];

  for (const serviceId of newServices) {
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
