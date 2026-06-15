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
