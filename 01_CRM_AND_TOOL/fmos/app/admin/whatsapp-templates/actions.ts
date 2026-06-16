"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";

// Phase D4: WhatsApp Template Seed — 17 real FortuneMarq templates
// Idempotent: checks for existing template by name before inserting

interface WhatsAppTemplate {
  name: string;
  category: string;
  label: string;
  lead_type: string | null;
  variables: string[];
  message: string;
  requires_meta_approval: boolean;
  meta_category: string;
  sent_by: string;
}

const TEMPLATES: WhatsAppTemplate[] = [
  // ── CURIOSITY (4) ──────────────────────────────────────────
  {
    name: "CURIOSITY_TYPE_A",
    category: "CURIOSITY",
    label: "Curiosity Message — Type A (SERP Ranked)",
    lead_type: "A",
    variables: ["businessName", "city", "niche", "searchVolume"],
    message: `Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.

I noticed you're showing up on Google, but you're not in the top 3 positions where most clicks go.

{{searchVolume}} people search for {{niche}} in {{city}} every month.

We help local businesses move up and capture more of that traffic.

Would it be okay if I share a quick report on your online presence? Takes 2 minutes to read.`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },
  {
    name: "CURIOSITY_TYPE_B",
    category: "CURIOSITY",
    label: "Curiosity Message — Type B (Has Website, Not Ranking)",
    lead_type: "B",
    variables: ["businessName", "city", "niche", "searchVolume"],
    message: `Hi! I came across {{businessName}} while looking at {{niche}} businesses in {{city}}.

I see you have a website, but it's not appearing when people search for {{niche}} in {{city}}.

{{searchVolume}} people make that search every month — and they're not finding you.

We help businesses like yours start ranking and getting found.

Can I share a quick report on what's happening and how to fix it? It's free.`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },
  {
    name: "CURIOSITY_TYPE_C",
    category: "CURIOSITY",
    label: "Curiosity Message — Type C (No Website)",
    lead_type: "C",
    variables: ["businessName", "city", "niche", "searchVolume"],
    message: `Hi! I came across {{businessName}} on Google Maps.

{{searchVolume}} people search for {{niche}} in {{city}} every month — but there's no website for your business when they search.

That means those potential customers are going to your competitors who do have one.

We build websites that rank and bring in calls. Can I share a quick overview of what that could look like for {{businessName}}?`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },
  {
    name: "CURIOSITY_TYPE_D",
    category: "CURIOSITY",
    label: "Curiosity Message — Type D (Low Search Volume)",
    lead_type: "D",
    variables: ["businessName", "city", "niche"],
    message: `Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.

Digital presence is becoming important for every local business — and the ones who build it early have a real advantage.

We help businesses like yours get found online through their website, Google listing, and search rankings.

Can I share what we do and how it works? It's a 2-minute read.`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },

  // ── FOLLOW-BACK REMINDER (2) ─────────────────────────────────
  {
    name: "FOLLOW_BACK_CALL",
    category: "FOLLOW_BACK_REMINDER",
    label: "Follow-Back Reminder — After Call",
    lead_type: null,
    variables: ["businessName"],
    message: `Hi {{businessName}}, this is Afifa from FortuneMarq.

I tried calling you but couldn't get through. I wanted to share a quick report about your online presence in your city.

Is there a good time I can call you back?`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },
  {
    name: "FOLLOW_BACK_REPORT_SENT",
    category: "FOLLOW_BACK_REMINDER",
    label: "Follow-Back After Report Sent",
    lead_type: null,
    variables: ["businessName"],
    message: `Hi {{businessName}}, I had sent you a report on your online presence a few days back.

Did you get a chance to go through it?

Happy to answer any questions or explain anything in more detail.`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "afifa",
  },

  // ── SEND PORTFOLIO (1) ────────────────────────────────────────
  {
    name: "SEND_PORTFOLIO",
    category: "OUTCOME_TRIGGERED",
    label: "Send Portfolio",
    lead_type: null,
    variables: ["businessName"],
    message: `Hi {{businessName}}, here is our portfolio of work — websites, GMB profiles, and ranking results we've done for similar businesses in your area.

[Portfolio Link — add link here]

Take a look and let me know your thoughts!`,
    requires_meta_approval: false,
    meta_category: "MARKETING",
    sent_by: "jabeer_manual",
  },

  // ── POST-MEETING (3) ─────────────────────────────────────────
  {
    name: "POST_MEETING_FOLLOW_UP",
    category: "POST_MEETING",
    label: "Post-Meeting Follow-Up",
    lead_type: null,
    variables: ["businessName", "ownerName"],
    message: `Hi {{ownerName}}, thank you for taking the time for our meeting today.

I hope the presentation gave you a clear picture of the opportunity for {{businessName}} online.

I'll be sending you the proposal shortly. Let me know if you have any questions in the meantime!

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "jabeer_manual",
  },
  {
    name: "POST_MEETING_PROPOSAL_SENT",
    category: "POST_MEETING",
    label: "Proposal Sent Message",
    lead_type: null,
    variables: ["ownerName", "businessName"],
    message: `Hi {{ownerName}}, here is the Online Growth Proposal I promised for {{businessName}}.

[Proposal PDF — attached]

Please go through it and let me know if you'd like to adjust anything. Looking forward to working with you!

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "jabeer_manual",
  },
  {
    name: "POST_MEETING_PROPOSAL_REMINDER",
    category: "POST_MEETING",
    label: "Proposal Follow-Up Reminder",
    lead_type: null,
    variables: ["ownerName", "businessName"],
    message: `Hi {{ownerName}}, just checking in on the proposal I sent for {{businessName}}.

Did you get a chance to look through it? Happy to clarify anything.

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "jabeer_manual",
  },

  // ── UPSELL (4) ───────────────────────────────────────────────
  {
    name: "UPSELL_SUMMARY_SOCIAL",
    category: "POST_MEETING",
    label: "Upsell Summary — Social Media",
    lead_type: null,
    variables: ["ownerName", "businessName"],
    message: `Hi {{ownerName}}, great speaking with you today!

As discussed, here's a summary of what Social Media Management would look like for {{businessName}}:
• Instagram + Facebook posts: 12/month
• Custom branded creatives
• Reply management
• Monthly performance report

Monthly Retainer: [Price]

Let me know if you'd like to go ahead!

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "MARKETING",
    sent_by: "jabeer_manual",
  },
  {
    name: "UPSELL_SUMMARY_ADS",
    category: "POST_MEETING",
    label: "Upsell Summary — Google Ads",
    lead_type: null,
    variables: ["ownerName", "businessName"],
    message: `Hi {{ownerName}}, following up on our conversation!

Here's what Google Ads management would include for {{businessName}}:
• Campaign setup and management
• Weekly optimisation
• Monthly performance report
• Ad spend is separate (you decide the budget)

Management Fee: [Price]/month

Ready to start? Let me know!

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "MARKETING",
    sent_by: "jabeer_manual",
  },
  {
    name: "UPSELL_CLOSED_CONFIRMATION",
    category: "POST_MEETING",
    label: "Upsell Confirmed",
    lead_type: null,
    variables: ["ownerName", "businessName", "service"],
    message: `Hi {{ownerName}}, great news — we're all set to add {{service}} for {{businessName}}!

I'll send the updated agreement shortly. Once confirmed, we'll get everything set up within the week.

Excited to take things to the next level for you!

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "jabeer_manual",
  },
  {
    name: "UPSELL_FOLLOWUP",
    category: "POST_MEETING",
    label: "Upsell Follow-Up",
    lead_type: null,
    variables: ["ownerName", "businessName"],
    message: `Hi {{ownerName}}, just checking in on our conversation about expanding services for {{businessName}}.

No pressure at all — just wanted to see if you had any questions or wanted to talk through the numbers again.

— Jabeer, FortuneMarq`,
    requires_meta_approval: false,
    meta_category: "UTILITY",
    sent_by: "jabeer_manual",
  },
];

export async function seedWhatsAppTemplates(): Promise<{
  success: boolean;
  seeded: number;
  skipped: number;
  error?: string;
}> {
  const supabase = await createServerClientWithCookies();
  let seeded = 0;
  let skipped = 0;

  try {
    for (const template of TEMPLATES) {
      // Check if template already exists by name
      // TODO: regenerate types after whatsapp_templates columns migration
      const { data: existing } = await supabase
        .from("whatsapp_templates")
        .select("id")
        .eq("name", template.name)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // id is a NOT NULL text PK with no default; the template name is unique
      // and human-readable, so use it as the id. `label` is not a real column,
      // and the body column is `content` (not `message`).
      const { error } = await supabase.from("whatsapp_templates").insert({
        id: template.name,
        name: template.name,
        category: template.category,
        lead_type: template.lead_type,
        variables: template.variables,
        content: template.message,
        requires_meta_approval: template.requires_meta_approval,
        meta_category: template.meta_category,
        sent_by: template.sent_by,
      });

      if (error) {
        console.error(`Failed to seed template ${template.name}:`, error.message);
      } else {
        seeded++;
      }
    }

    return { success: true, seeded, skipped };
  } catch (err: any) {
    return { success: false, seeded, skipped, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: the 24 Meta-approval WhatsApp templates (companion to
// WHATSAPP_TEMPLATE_SPEC.md). These are the names the automation engine resolves
// in a send_whatsapp rule. Registered here as a reference library so the rule
// builder's template picker can offer them. Body uses Meta {{1}},{{2}}… params;
// `variables` lists each param's meaning in order. Idempotent (skip by name).
// ─────────────────────────────────────────────────────────────────────────────

interface MetaTemplate {
  name: string;
  channel: "LEAD_CLIENT" | "ADMIN" | "STAFF";
  meta_category: "UTILITY" | "MARKETING";
  variables: string[];
  content: string;
}

const META_TEMPLATES: MetaTemplate[] = [
  // CHANNEL 1 — Leads / Clients
  { name: "lead_ack_inbound", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name"], content: "Hi {{1}}, thanks for reaching out to FortuneMarq! We've received your enquiry and a growth specialist will call you shortly. — Team FortuneMarq" },
  { name: "meeting_confirmation", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "date/time"], content: "Hi {{1}}, your strategy call with FortuneMarq is confirmed for {{2}}. We'll call you on this number — looking forward to speaking with you!" },
  { name: "meeting_reminder_1h", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name"], content: "Hi {{1}}, a quick reminder — your FortuneMarq strategy call is in about 1 hour. Talk soon!" },
  { name: "meeting_reminder_15m", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name"], content: "Hi {{1}}, your FortuneMarq call starts in about 15 minutes. We'll reach you on this number shortly." },
  { name: "proposal_sent", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "proposal link"], content: "Hi {{1}}, your growth proposal from FortuneMarq is ready. View it here: {{2}} — happy to walk you through any questions." },
  { name: "agreement_sent", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "agreement link"], content: "Hi {{1}}, your FortuneMarq service agreement is ready to review and sign: {{2}} — let us know if anything needs adjusting." },
  { name: "agreement_welcome", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name"], content: "Welcome to FortuneMarq, {{1}}! Your agreement is signed and onboarding is starting now. Your account manager will reach out with next steps shortly." },
  { name: "onboarding_intake", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "intake link"], content: "Hi {{1}}, welcome aboard! To kick off your project, please complete your onboarding intake here: {{2}} — it takes about 10 minutes." },
  { name: "followup_scheduled", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "follow-up date"], content: "Hi {{1}}, great speaking with you! As agreed, I'll follow up with you on {{2}}. Feel free to reach out anytime before then." },
  { name: "missed_you", channel: "LEAD_CLIENT", meta_category: "MARKETING", variables: ["contact name", "business name"], content: "Hi {{1}}, this is FortuneMarq — we tried reaching you about growing {{2}} but couldn't connect. When's a good time to call you back?" },
  { name: "proposal_followup", channel: "LEAD_CLIENT", meta_category: "MARKETING", variables: ["contact name", "business name"], content: "Hi {{1}}, just checking in on the proposal we sent for {{2}}. Any questions I can help with? Happy to jump on a quick call." },
  { name: "meeting_thanks", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "business name"], content: "Hi {{1}}, thanks for your time today! It was great learning about {{2}}. We'll have your tailored proposal over to you shortly." },
  { name: "project_update", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "milestone"], content: "Hi {{1}}, an update on your project with FortuneMarq: {{2}} is now live. We'll keep you posted on the next milestone." },
  { name: "approval_request", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "review link"], content: "Hi {{1}}, a deliverable is ready for your review and approval: {{2}} — please take a look when you can and share your feedback." },
  { name: "monthly_report_ready", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "report month", "report link"], content: "Hi {{1}}, your {{2}} performance report from FortuneMarq is ready. View it here: {{3}} — let's catch up on the results." },
  { name: "invoice_sent", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "invoice number", "amount", "invoice link"], content: "Hi {{1}}, invoice {{2}} for {{3}} is ready. You can view and pay it here: {{4}} — thank you!" },
  { name: "payment_reminder", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "invoice number", "amount", "due date", "invoice link"], content: "Hi {{1}}, a reminder that invoice {{2}} for {{3}} is due on {{4}}. You can pay here: {{5}}. Thank you!" },
  { name: "payment_overdue", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "invoice number", "amount", "invoice link"], content: "Hi {{1}}, our records show invoice {{2}} for {{3}} is now overdue. Please settle it here at your earliest convenience: {{4}} — reach out if you need anything." },
  { name: "payment_received", channel: "LEAD_CLIENT", meta_category: "UTILITY", variables: ["contact name", "amount", "invoice number"], content: "Hi {{1}}, we've received your payment of {{2}} for invoice {{3}}. Thank you — your account is all up to date!" },
  { name: "meeting_noshow", channel: "LEAD_CLIENT", meta_category: "MARKETING", variables: ["contact name"], content: "Hi {{1}}, sorry we missed each other for our scheduled call today. Would you like to reschedule? Just reply with a time that suits you." },
  { name: "onboarding_reminder", channel: "LEAD_CLIENT", meta_category: "MARKETING", variables: ["contact name", "intake link"], content: "Hi {{1}}, a quick reminder to finish your FortuneMarq onboarding so we can get your project moving: {{2}} — it only takes a few minutes." },
  { name: "revival_nudge", channel: "LEAD_CLIENT", meta_category: "MARKETING", variables: ["contact name", "city", "business name"], content: "Hi {{1}}, it's been a while! FortuneMarq is helping businesses in {{2}} grow online, and we'd love to help {{3}} too. Interested in a quick chat?" },
  // CHANNEL 2 — Admin (generic)
  { name: "admin_alert", channel: "ADMIN", meta_category: "UTILITY", variables: ["headline", "detail"], content: "FortuneMarq OS — {{1}}. {{2}} (automated alert)" },
  // CHANNEL 3 — Staff (generic)
  { name: "staff_alert", channel: "STAFF", meta_category: "UTILITY", variables: ["headline", "detail"], content: "FortuneMarq — {{1}}. {{2}} (open FMOS to action)" },
];

export async function seedMetaTemplates(): Promise<{
  success: boolean;
  seeded: number;
  skipped: number;
  error?: string;
}> {
  const supabase = await createServerClientWithCookies();
  let seeded = 0;
  let skipped = 0;

  try {
    for (const t of META_TEMPLATES) {
      const { data: existing } = await supabase
        .from("whatsapp_templates")
        .select("id")
        .eq("name", t.name)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("whatsapp_templates").insert({
        id: t.name,
        name: t.name,
        category: t.channel,
        lead_type: null,
        variables: t.variables,
        content: t.content,
        requires_meta_approval: true,
        meta_category: t.meta_category,
        sent_by: "system",
      });

      if (error) {
        console.error(`Failed to seed Meta template ${t.name}:`, error.message);
      } else {
        seeded++;
      }
    }

    return { success: true, seeded, skipped };
  } catch (err: any) {
    return { success: false, seeded, skipped, error: err.message };
  }
}
