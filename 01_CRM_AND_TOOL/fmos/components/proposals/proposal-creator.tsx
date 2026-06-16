"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ArrowRight, Loader2, FileText, Globe, BarChart2,
  Megaphone, Zap, MessageSquare, ChevronDown, ChevronUp,
  Clock, Package, Star, Shield, Phone, Mail, ExternalLink,
  Copy, CheckCheck, Target, TrendingUp, Eye, Users, Repeat,
  ArrowDown, Lightbulb, Search, MousePointer, Heart, Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import servicesData from "@/lib/data/services_data.json";
import { sendNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { leadStageUpdate } from "@/lib/pipeline";
import { fireTrigger } from "@/actions/automations";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  company_name: string;
  contact_person: string | null;
  city: string | null;
  industry: string | null;
  lead_type: string | null;
  phone?: string | null;
}

interface SelectedService {
  id: string;
  label: string;
  setupFee: number;
  monthlyRetainer: number;
}

interface ExistingProposal {
  id: string;
  proposal_number: string;
  services: SelectedService[] | null;
  total_setup: number | null;
  total_monthly: number | null;
  start_date: string | null;
  status: string | null;
}

interface ProposalCreatorProps {
  lead: Lead;
  proposalNumber: string;
  userId: string | null;
  /** When set, the creator edits this proposal instead of creating a new one. */
  existingProposal?: ExistingProposal | null;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const RAW_SERVICES = (servicesData as any).services as Array<{
  id: string;
  label: string;
  layer: string;
  tagline?: string;
  whatWeDo?: string;
  deliverables?: string[];
  timeline?: string;
  importantNote?: string;
}>;

const LAYER_ORDER = ["Foundation Layer", "Visibility Layer", "Engagement Layer"];

const LAYER_META: Record<string, { color: string; icon: React.ElementType; desc: string }> = {
  "Foundation Layer":  { color: "blue",   icon: Globe,     desc: "Build your digital presence" },
  "Visibility Layer":  { color: "purple", icon: BarChart2, desc: "Get found when customers search" },
  "Engagement Layer":  { color: "orange", icon: Megaphone, desc: "Stay connected and automate growth" },
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  WEBSITE: Globe, GMB: Star, SEO: BarChart2,
  GOOGLE_ADS: Zap, META_ADS: Megaphone,
  WHATSAPP_MARKETING: MessageSquare, AI_AUTOMATIONS: Zap,
};

// ─── Funnel stage mapping ─────────────────────────────────────────────────────
const FUNNEL_STAGES = [
  { key: "attract",  label: "Attract",   icon: Eye,          color: "blue",   desc: "People discover your business online", services: ["SEO","GOOGLE_ADS","META_ADS","GMB"] },
  { key: "capture",  label: "Capture",   icon: MousePointer, color: "indigo", desc: "Visitors land and understand your value", services: ["WEBSITE","GMB"] },
  { key: "nurture",  label: "Nurture",   icon: MessageSquare,color: "purple", desc: "Warm leads hear from you at the right time", services: ["WHATSAPP_MARKETING","META_ADS"] },
  { key: "convert",  label: "Convert",   icon: Target,       color: "emerald",desc: "Enquiries become paying clients", services: ["WEBSITE","GOOGLE_ADS","WHATSAPP_MARKETING"] },
  { key: "retain",   label: "Retain",    icon: Repeat,       color: "orange", desc: "Clients stay, refer, and come back", services: ["AI_AUTOMATIONS","WHATSAPP_MARKETING"] },
];

// ─── Service deep-dive content ────────────────────────────────────────────────
const SERVICE_DEEP: Record<string, {
  problem: string;
  ourApproach: string[];
  whyItWorks: string;
  features: Array<{ title: string; detail: string }>;
}> = {
  WEBSITE: {
    problem: "Most business websites are either non-existent, outdated, or built as a digital business card that nobody finds. A website only creates value when it's built around what your customer is looking for — and when it guides them from 'just browsing' to 'I need to call these people'.",
    ourApproach: [
      "We start with a 30-min brief — understanding your services, customers, and what makes you different",
      "We research what your competitors are doing online and find the gaps",
      "We design your website around a single goal: converting visitors into enquiries",
      "We build it, review it with you, and make revisions before going live",
      "We connect Google Analytics + Search Console so you can track performance from day one",
    ],
    whyItWorks: "Every element — the headline, the layout, the call-to-action — is chosen based on what actually converts in your industry. This isn't a template site. It's built for your business and your customer.",
    features: [
      { title: "Mobile-first design", detail: "70%+ of local searches happen on mobile. Your site looks and works perfectly on every screen size." },
      { title: "Fast loading (< 3 seconds)", detail: "Every second of load time costs you leads. We optimise images, code, and hosting for speed." },
      { title: "Clear conversion flow", detail: "Strategic placement of calls-to-action, WhatsApp buttons, and contact forms that guide visitors to reach out." },
      { title: "On-page SEO from day one", detail: "Page titles, meta descriptions, headings, and content structured so Google understands what your site is about." },
      { title: "Google Analytics + Search Console", detail: "You'll know exactly how many people visit, where they come from, and what they do on your site." },
      { title: "You own everything", detail: "Domain, hosting, code — all in your name. No dependency on us to keep your site live." },
    ],
  },
  GMB: {
    problem: "Google Business Profile is the most underused free marketing tool available to local businesses. Most businesses set it up once and forget it — which means they're losing local search visibility to competitors who actively manage theirs.",
    ourApproach: [
      "Full audit of your current profile (or setup from scratch if you don't have one)",
      "Keyword research to identify the exact search terms your customers use",
      "Category optimisation, service area setup, and photo strategy",
      "Build a monthly content calendar: posts, offers, Q&A updates",
      "Review response management to build trust and signal activity to Google",
      "Monthly performance report: searches, views, calls, and direction requests",
    ],
    whyItWorks: "Google's local algorithm rewards businesses that are active, complete, and trusted. A fully optimised, actively managed GMB profile consistently outranks competitors who set it up and left it. This is low-hanging fruit — and we pick it every month.",
    features: [
      { title: "Category & attribute optimisation", detail: "Choosing the right primary and secondary categories dramatically affects which searches you appear in." },
      { title: "4 posts per month", detail: "Regular posts signal activity to Google and keep your profile fresh for visitors checking you out." },
      { title: "Photo strategy", detail: "Businesses with 10+ photos get 35% more clicks. We guide you on what to shoot and upload it for you." },
      { title: "Review management", detail: "We respond to every review — positive and negative — in a way that builds trust with future customers." },
      { title: "Q&A setup", detail: "Pre-populated Q&A covers your most common customer questions before they even need to ask." },
      { title: "Monthly performance snapshot", detail: "You see exactly how many people found you, called you, and asked for directions — every month." },
    ],
  },
  SEO: {
    problem: "Paid ads stop the moment you stop paying. SEO builds an asset — your website's ability to rank — that compounds over time and generates leads without ongoing ad spend. Most businesses ignore SEO because they don't understand it. That's your opportunity.",
    ourApproach: [
      "Technical SEO audit: we find every issue that's blocking your site from ranking",
      "Keyword research: identify exactly what your customers search for",
      "On-page optimisation: update titles, content, headings, internal links",
      "Local SEO signals: NAP consistency, local schema markup, city-specific pages",
      "Content strategy: create pages that answer questions your customers are searching",
      "Monthly rank tracking with keyword movement report",
    ],
    whyItWorks: "SEO is a long game but it's the most cost-effective channel over 12+ months. Once your site ranks, you get leads without paying per click. Our approach combines technical fixes (quick wins) with content strategy (long-term compounding) — so you see movement fast and it keeps growing.",
    features: [
      { title: "Full technical audit + fixes", detail: "Crawl errors, broken links, slow pages, missing meta tags, duplicate content — we find and fix all of it." },
      { title: "Keyword targeting strategy", detail: "We identify the exact search terms your customers use and build a content plan around them." },
      { title: "Local SEO (city + niche)", detail: "Optimised for searches like '[your service] in [your city]' — the searches that drive actual local business." },
      { title: "Monthly rank reports", detail: "Track exactly where you rank for each target keyword, and what moved since last month." },
      { title: "Content creation", detail: "Service pages, location pages, and blog content written to rank and to convert visitors who land on them." },
      { title: "Google Search Console access shared", detail: "You have full visibility into how Google sees your site — impressions, clicks, and which queries you appear for." },
    ],
  },
  GOOGLE_ADS: {
    problem: "Google Ads gets your business in front of people who are actively searching for exactly what you offer — right now. Done poorly, it wastes budget fast. Done right, it's the most predictable lead generation channel available to a local business.",
    ourApproach: [
      "Campaign architecture designed around your services, not just your business name",
      "Keyword research with a tight negative keyword list to stop wasted spend from day one",
      "Multiple ad variants written and tested — we don't guess, we split test",
      "Daily monitoring: bids, budgets, search term reports, anomaly detection",
      "Conversion tracking setup so we know which clicks become enquiries",
      "Monthly deep-dive report with what worked, what didn't, and what we're doing next",
    ],
    whyItWorks: "Most businesses run Google Ads without proper conversion tracking — they're flying blind. We set up tracking first, so every decision is based on real data. Combined with tight keyword targeting and daily monitoring, your budget goes to clicks that actually become leads.",
    features: [
      { title: "Campaign + ad group structure", detail: "Properly structured campaigns by service type mean better Quality Scores, lower cost per click, and higher ad positions." },
      { title: "Negative keyword list from day one", detail: "Stops you paying for irrelevant searches — a common cause of wasted budget in poorly managed accounts." },
      { title: "A/B tested ad copy", detail: "Multiple headlines and descriptions tested simultaneously. Winning variants get more budget, losing ones get paused." },
      { title: "Daily bid management", detail: "We adjust bids based on day of week, time of day, and device — so your budget is spent when it's most likely to convert." },
      { title: "Conversion tracking", detail: "We track form submissions, WhatsApp clicks, and phone calls — so you know the actual cost per lead, not just cost per click." },
      { title: "Weekly performance summary", detail: "Short update every week: spend, clicks, conversions, cost per lead. You always know how your money is performing." },
    ],
  },
  META_ADS: {
    problem: "Unlike Google Ads, Meta Ads reach people before they're actively searching — you put your business in front of the right people while they're scrolling. This is how you build brand recognition in your local area and generate leads from people who didn't even know they needed you yet.",
    ourApproach: [
      "Audience research: who your ideal customer is, what they care about, how to reach them",
      "Creative strategy: what format (image/video/carousel) and message will stop the scroll",
      "Campaign build: awareness, lead gen, and retargeting layers",
      "Creative direction and ad copy writing (you supply photos, we make them work)",
      "Daily monitoring and optimisation: budget reallocation based on performance",
      "Monthly report with audience insights, creative performance, and next month's plan",
    ],
    whyItWorks: "The businesses that win on Meta aren't the ones with the biggest budgets — they're the ones with the best understanding of their audience and the most compelling creative. We handle both. Most local business ads on Meta are forgettable. Ours are built to stop the scroll.",
    features: [
      { title: "Layered audience strategy", detail: "Cold audiences (new people), warm audiences (website visitors, video viewers), and retargeting — each with different messaging." },
      { title: "Facebook + Instagram placements", detail: "Automatic placement testing to find where your audience responds best — feed, stories, reels, or all three." },
      { title: "Ad creative direction", detail: "We tell you exactly what photos/videos to capture and write the copy that converts. Simple for you, effective for customers." },
      { title: "Lead form ads", detail: "Capture name, phone, and service interest directly within Facebook — no need to leave the app. Lower friction = more leads." },
      { title: "Retargeting campaigns", detail: "People who visited your website or watched your video get a follow-up ad. These convert at 3–5x the rate of cold audiences." },
      { title: "Audience refinement over time", detail: "The longer we run, the smarter your targeting gets. Meta's algorithm learns who your best leads are and finds more of them." },
    ],
  },
  WHATSAPP_MARKETING: {
    problem: "WhatsApp has a 90%+ open rate in India — no other channel comes close. Every business has customers on WhatsApp. Most businesses aren't using it to nurture leads or retain clients. That's a massive missed opportunity.",
    ourApproach: [
      "WhatsApp Business API setup and Meta verification (so you can send broadcast messages legally)",
      "Build your approved message template library — promotional, transactional, and follow-up",
      "Set up automated sequences: new lead follow-up, appointment reminders, re-engagement",
      "Monthly broadcast campaign to your customer list with performance tracking",
      "Integrate with your lead sources so new enquiries get an instant WhatsApp response",
      "Monthly report: delivery rate, open rate, response rate, unsubscribes",
    ],
    whyItWorks: "Speed is the biggest driver of lead conversion. A lead that gets a WhatsApp response within 5 minutes is 9x more likely to convert than one that waits an hour. We set up automation that responds instantly — 24/7 — without you lifting a finger.",
    features: [
      { title: "WhatsApp Business API", detail: "The official API — lets you send broadcasts to unlimited contacts, set up automation, and use approved templates." },
      { title: "Meta-approved templates", detail: "Template approval means your messages are delivered reliably, not marked as spam. We write and submit templates for you." },
      { title: "Automated lead follow-up", detail: "New enquiry comes in → instant WhatsApp response → follow-up sequence runs automatically over the next 7 days." },
      { title: "Monthly broadcast campaigns", detail: "Stay top of mind with your existing customers: offers, updates, seasonal messages — all sent in one click." },
      { title: "Appointment reminders", detail: "Automated reminders 24 hours and 1 hour before appointments — reduces no-shows significantly." },
      { title: "Contact list management", detail: "Clean, segmented contact list with opt-in tracking so your broadcasts are always compliant." },
    ],
  },
  AI_AUTOMATIONS: {
    problem: "Every business has repetitive tasks that eat time — enquiry follow-ups, appointment confirmations, report generation, data entry, internal workflows. AI can handle most of these automatically, 24/7, without errors. The business owners who automate now will have a permanent operational advantage.",
    ourApproach: [
      "Discovery session with Jabeer: we map your top 5 most time-consuming repetitive tasks",
      "Identify the highest-ROI automation opportunities — what gives you the most time back first",
      "Build the automation using AI tools (n8n, Make, or custom) connected to your existing systems",
      "Test thoroughly with real scenarios before going live",
      "Train you or your team on how it works (with documentation)",
      "Ongoing maintenance: updates, monitoring, and improvements included in retainer",
    ],
    whyItWorks: "Most automation projects fail because they try to automate everything at once. We start with one high-impact automation, get it working perfectly, then expand. Every automation we build is connected to your actual workflow — not a generic template that needs constant manual fixes.",
    features: [
      { title: "Workflow discovery session", detail: "30-minute walkthrough with Jabeer to map your current workflow and identify automation opportunities." },
      { title: "Custom-built automations", detail: "Built specifically for your workflow — not a generic template. If your process is unique, the automation reflects that." },
      { title: "Integration with existing tools", detail: "Works with WhatsApp, Google Sheets, your CRM, email, and most tools your business already uses." },
      { title: "Full documentation", detail: "Every automation comes with a plain-English doc your team can follow. No dependency on us to understand how it works." },
      { title: "24/7 operation", detail: "Automations run around the clock — enquiries get responses at 2am, reports generate themselves on Monday morning." },
      { title: "Maintenance + updates included", detail: "When your process changes or an integration breaks, we fix it — no extra charge." },
    ],
  },
};

// ─── Lead-type content ────────────────────────────────────────────────────────
const LEAD_TYPE_COPY: Record<string, {
  headline: string; situation: string; consequence: string; urgency: string;
}> = {
  A: {
    headline: "You're Already Ahead — Let's Make It a Permanent Lead",
    situation: `${"{company}"} already ranks on Google — that puts you in the top tier of your market. Most local businesses in your niche haven't achieved this yet.`,
    consequence: "The risk is that this position is not permanent. Competitors are investing in their digital presence every month. Without active protection and growth, rankings slip — and once a competitor overtakes you in Google, it takes months to recover.",
    urgency: "The window to extend your lead and make it unassailable is right now — before your competitors start treating their digital presence as seriously as you have.",
  },
  B: {
    headline: "You Have a Website. Now Let's Make It Work",
    situation: `${"{company}"} has a website — but it's not ranking on Google yet. Every month, people in your area are actively searching for exactly what you offer, and they're finding your competitors instead.`,
    consequence: "Your website exists as a cost, not an asset. It's not generating leads, not building credibility, and not working for you while you sleep. That changes the moment it starts ranking.",
    urgency: "The sooner we start, the sooner the compounding effect kicks in. SEO takes 60–90 days to start moving — every month of delay is a month of leads going elsewhere.",
  },
  C: {
    headline: "First Mover Wins in Your Local Market",
    situation: `${"{company}"} doesn't have an online presence yet — and in today's market, that means a portion of your potential customers are going to competitors who do.`,
    consequence: "Before calling anyone, most people Google the business to see if it's legitimate. Without a website and Google presence, a significant percentage of potential customers are eliminating you before you even get a chance to talk to them.",
    urgency: "Most businesses in your niche and city haven't built their digital presence yet. That's your advantage — move now and you establish the strongest online position in your local market before anyone else does.",
  },
  D: {
    headline: "Own the Digital Space in Your Local Market",
    situation: `Direct search volume for your specific niche is limited — but the local demand for your service is very real. The customers exist. They're just not finding you through digital channels yet.`,
    consequence: "In a low-search-volume market, the business that is most visible across multiple digital touchpoints — Google, social media, WhatsApp, referrals — captures a disproportionate share of the available demand.",
    urgency: "Because few competitors have invested properly, the cost and effort to dominate your digital presence right now is lower than it will ever be again.",
  },
};

// ─── Differentiators ─────────────────────────────────────────────────────────
const DIFFERENTIATORS = [
  {
    icon: Lightbulb,
    title: "Strategy Before Execution",
    agency: "Most agencies immediately start running ads or building pages without understanding your business, your market, or what a 'lead' actually means to you.",
    us: "We spend the first week understanding your business deeply — your customers, competitors, and conversion path. Every action we take flows from a strategy built for your specific situation.",
  },
  {
    icon: Eye,
    title: "Full-Funnel Thinking",
    agency: "Most agencies manage one channel — your Google Ads person doesn't know what your SEO person is doing, and neither knows your conversion rate.",
    us: "We think in funnels. Every service we recommend connects to the others — traffic from ads lands on a site optimised to convert, leads get followed up on WhatsApp, and automations remove the manual work. Everything works together.",
  },
  {
    icon: Shield,
    title: "You Own Everything",
    agency: "Many agencies keep your ad accounts, website, and data in their own accounts. When you leave, you lose everything — sometimes even your own customer data.",
    us: "Your domain, hosting, Google Ads account, Analytics, and Search Console are all in your name. We get access to manage them. You own the asset we're building.",
  },
  {
    icon: TrendingUp,
    title: "Transparent Reporting",
    agency: "Vague monthly reports with screenshots and no explanation. You never really know if it's working or what the money is doing.",
    us: "Monthly reports that show exactly what we did, what moved, what didn't, and what we're doing next. You get access to every platform we manage — no black boxes.",
  },
  {
    icon: Users,
    title: "Direct Access to Jabeer",
    agency: "You onboard with a senior person and get handed to a junior account manager you've never met. Quality drops, response times slow.",
    us: "Jabeer is your point of contact from the first call to month 12. You get my direct WhatsApp number and you'll know exactly what's being done on your account, by whom.",
  },
  {
    icon: Heart,
    title: "No Lock-in Contracts",
    agency: "6 or 12-month minimum contracts that lock you in regardless of results. You're trapped even if the work isn't delivering.",
    us: "Month-to-month. Cancel anytime with 30 days notice, no penalties. We keep clients because results keep them — not because contracts do.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProposalCreator({ lead, proposalNumber, userId, existingProposal }: ProposalCreatorProps) {
  const router = useRouter();
  const isEdit = !!existingProposal;
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(existingProposal?.services ?? []);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(existingProposal?.start_date ?? "");
  const [validity, setValidity] = useState("7");
  const [customNote, setCustomNote] = useState("");
  const [step, setStep] = useState<"services" | "preview" | "done">("services");
  const [isPending, startTransition] = useTransition();
  const [savedProposalId, setSavedProposalId] = useState<string | null>(existingProposal?.id ?? null);
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const supabase = createClient();

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const totalSetup = selectedServices.reduce((s, svc) => s + svc.setupFee, 0);
  const totalMonthly = selectedServices.reduce((s, svc) => s + svc.monthlyRetainer, 0);

  const typeKey = (lead.lead_type || "A").toUpperCase() as keyof typeof LEAD_TYPE_COPY;
  const typeContent = {
    ...LEAD_TYPE_COPY[typeKey] || LEAD_TYPE_COPY.A,
    situation: (LEAD_TYPE_COPY[typeKey] || LEAD_TYPE_COPY.A).situation.replace("{company}", lead.company_name),
  };

  function toggleService(svc: { id: string; label: string }) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === svc.id);
      if (exists) return prev.filter(s => s.id !== svc.id);
      return [...prev, { id: svc.id, label: svc.label, setupFee: 0, monthlyRetainer: 0 }];
    });
  }
  function updateFee(id: string, field: "setupFee" | "monthlyRetainer", value: number) {
    setSelectedServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  async function saveProposal() {
    if (selectedServices.length === 0) return;
    startTransition(async () => {
      const payload = { services: selectedServices, total_setup: totalSetup, total_monthly: totalMonthly, start_date: startDate || null };
      let pid: string;
      if (isEdit && existingProposal) {
        const { error } = await supabase.from("proposals").update(payload as any).eq("id", existingProposal.id);
        if (error) {
          toast.error("Could not update proposal", error.message);
          return;
        }
        pid = existingProposal.id;
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert({ lead_id: lead.id, proposal_number: proposalNumber, ...payload, status: "draft", created_by: userId, created_at: new Date().toISOString(), sent_at: null } as any)
          .select("id").single();
        if (error || !data) {
          toast.error("Could not save proposal", error?.message ?? "No row returned");
          return;
        }
        pid = (data as any).id;
      }
      setSavedProposalId(pid);
      setDraftSaved(true);
      setStep("done");
      toast.success(isEdit ? "Proposal updated" : "Proposal saved", proposalNumber);
      logAudit({ action: isEdit ? "update" : "create", resourceType: "proposal", resourceId: pid, resourceLabel: `${proposalNumber} — ${lead.company_name}`, newValue: { services: selectedServices.map(s => s.label), total_monthly: totalMonthly, total_setup: totalSetup }, summary: `Proposal ${proposalNumber} ${isEdit ? "updated" : "created"} for ${lead.company_name}` });
    });
  }

  async function sendProposal() {
    if (!savedProposalId) return;
    startTransition(async () => {
      const { error: proposalError } = await supabase.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() } as any).eq("id", savedProposalId);
      if (proposalError) {
        toast.error("Could not mark proposal as sent", proposalError.message);
        return;
      }
      const { error: leadError } = await supabase.from("leads").update(leadStageUpdate("proposal_sent") as any).eq("id", lead.id);
      if (leadError) {
        toast.error("Proposal marked sent, but lead stage update failed", leadError.message);
        return;
      }
      void fireTrigger("proposal_sent", "lead", lead.id);
      toast.success("Proposal sent", `${lead.company_name} moved to Proposal Sent`);
      logAudit({ action: "proposal_sent", resourceType: "proposal", resourceId: savedProposalId, resourceLabel: `${proposalNumber} — ${lead.company_name}`, newValue: { status: "sent" }, summary: `Proposal ${proposalNumber} marked as sent to ${lead.company_name}` });
      const { data: adminProfile } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
      if (adminProfile) {
        await sendNotification({ userId: adminProfile.id, type: "system", title: "Proposal Sent", body: `Proposal ${proposalNumber} sent to ${lead.company_name}.`, link: `/admin/leads/${lead.id}`, entityType: "proposal", entityId: savedProposalId });
      }
      router.push(`/admin/leads/${lead.id}`);
    });
  }

  const waMessage = `Hi ${lead.contact_person || lead.company_name}! 😊

Really good speaking with you. As promised, I've put together the growth proposal for ${lead.company_name} —

📄 [Attach PDF]

It covers our full approach, what we're building for you, the exact deliverables, and the investment. Have a look when you get a chance and feel free to call or WhatsApp me if anything needs clarifying.

Looking forward to working together! 🙌

— Jabeer
FortuneMarq
+91 93530 82656`;

  function copyMessage() {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const servicesByLayer = LAYER_ORDER.map(layer => ({ layer, services: RAW_SERVICES.filter(s => s.layer === layer) }));
  const selectedIds = selectedServices.map(s => s.id);
  const selectedFullData = selectedServices.map(sel => ({ ...sel, raw: RAW_SERVICES.find(r => r.id === sel.id), deep: SERVICE_DEEP[sel.id] }));

  const STEPS = [{ key: "services", label: "Select Services" }, { key: "preview", label: "Preview" }, { key: "done", label: "Done" }];
  const stepIndex = STEPS.findIndex(s => s.key === step);

  // Funnel stages that have at least one selected service
  const activeFunnelStages = FUNNEL_STAGES.filter(fs => fs.services.some(sid => selectedIds.includes(sid)));

  return (
    <div className="min-h-full bg-slate-50">
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">New Proposal</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lead.company_name}{lead.city && ` · ${lead.city}`}{lead.industry && ` · ${lead.industry}`}
              <span className="ml-2 font-mono">{proposalNumber}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i <= stepIndex ? "opacity-100" : "opacity-40"}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${stepIndex > i ? "bg-emerald-500 text-white" : stepIndex === i ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {stepIndex > i ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${stepIndex === i ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${stepIndex > i ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1 — SERVICE SELECTION
        ════════════════════════════════════════════════════════════════════ */}
        {step === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {servicesByLayer.map(({ layer, services }) => {
                const meta = LAYER_META[layer];
                const Icon = meta.icon;
                const colorMap: Record<string, string> = { blue: "text-blue-600 bg-blue-50 border-blue-100", purple: "text-purple-600 bg-purple-50 border-purple-100", orange: "text-orange-600 bg-orange-50 border-orange-100" };
                const hdrColor: Record<string, string> = { blue: "text-blue-700", purple: "text-purple-700", orange: "text-orange-700" };
                return (
                  <div key={layer}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center border ${colorMap[meta.color]}`}><Icon className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${hdrColor[meta.color]}`}>{layer}</p>
                        <p className="text-[10px] text-slate-400">{meta.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {services.map(svc => {
                        const isSelected = selectedServices.some(s => s.id === svc.id);
                        const selected = selectedServices.find(s => s.id === svc.id);
                        const isExpanded = expandedService === svc.id;
                        return (
                          <div key={svc.id} className={`rounded-2xl border transition-all overflow-hidden ${isSelected ? "border-[#42CA80] shadow-sm shadow-emerald-100" : "border-slate-200 bg-white"}`}>
                            <div className={`flex items-start gap-3 p-4 ${isSelected ? "bg-emerald-50/50" : "bg-white"}`}>
                              <button onClick={() => toggleService(svc)} className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-[#42CA80] border-[#42CA80]" : "border-slate-300 bg-white hover:border-slate-400"}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{svc.label}</p>
                                    {svc.tagline && <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{svc.tagline.replace(/\{\{.*?\}\}/g, lead.city || "your city")}</p>}
                                  </div>
                                  <button onClick={() => setExpandedService(isExpanded ? null : svc.id)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </div>
                                {isExpanded && (
                                  <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                                    {SERVICE_DEEP[svc.id] && (
                                      <p className="text-xs text-slate-600 leading-relaxed">{SERVICE_DEEP[svc.id].problem}</p>
                                    )}
                                    {svc.deliverables && (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">What's included</p>
                                        <ul className="space-y-1">
                                          {svc.deliverables.map((d, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                              <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{d}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {svc.timeline && <div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5 text-slate-400" />{svc.timeline}</div>}
                                    {svc.importantNote && <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⚠️ {svc.importantNote}</p>}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && selected && (
                              <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-emerald-100 bg-emerald-50/30">
                                <div className="pt-3">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Setup Fee</label>
                                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input type="number" value={selected.setupFee || ""} onChange={e => updateFee(svc.id, "setupFee", Number(e.target.value))} className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]" placeholder="0" />
                                  </div>
                                </div>
                                <div className="pt-3">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5">Monthly Retainer</label>
                                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input type="number" value={selected.monthlyRetainer || ""} onChange={e => updateFee(svc.id, "monthlyRetainer", Number(e.target.value))} className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]" placeholder="0" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Proposal meta */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Proposal Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Proposed Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Valid For</label>
                    <select value={validity} onChange={e => setValidity(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80]">
                      {["3","5","7","14","30"].map(v => <option key={v} value={v}>{v} days</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Personal Note to Client (optional)</label>
                  <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} rows={2} placeholder="E.g. Great speaking with you today..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80] resize-none" />
                </div>
              </div>
            </div>

            {/* Sticky summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-slate-900 rounded-2xl p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Proposal Summary</p>
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Select services to see totals</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {selectedServices.map(svc => (
                          <div key={svc.id} className="flex items-center justify-between gap-2">
                            <p className="text-xs text-slate-300 truncate flex-1">{svc.label}</p>
                            <p className="text-xs font-mono text-slate-400 shrink-0">{svc.monthlyRetainer > 0 ? `${formatINR(svc.monthlyRetainer)}/mo` : "—"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-700 pt-3 space-y-2">
                        {totalSetup > 0 && <div className="flex items-center justify-between"><span className="text-xs text-slate-400">One-time Setup</span><span className="text-sm font-bold font-mono">{formatINR(totalSetup)}</span></div>}
                        <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Monthly Retainer</span><span className="text-lg font-bold font-mono text-[#42CA80]">{formatINR(totalMonthly)}<span className="text-sm">/mo</span></span></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Our Commitment</p>
                  {[{ icon: Shield, text: "No lock-in — cancel anytime" }, { icon: Clock, text: "Clear delivery timelines" }, { icon: Package, text: "Monthly reports, always" }].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Icon className="h-3.5 w-3.5 text-[#42CA80] shrink-0 mt-0.5" /><p className="text-xs text-slate-600">{text}</p></div>
                  ))}
                </div>
                <button onClick={() => setStep("preview")} disabled={selectedServices.length === 0} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2">
                  Preview Proposal <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2 — PROPOSAL PREVIEW
        ════════════════════════════════════════════════════════════════════ */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("services")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">← Back to edit</button>
                <p className="text-xs text-slate-400 hidden sm:block">Full proposal view — exactly how it reads to the client.</p>
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"><Printer className="h-4 w-4" /> Download PDF</button>
            </div>

            <div className="print-area bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">

              {/* ── 1. COVER ─────────────────────────────────────────────────── */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-12 text-white">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#42CA80]/10 blur-3xl" />
                <div className="absolute -left-8 -bottom-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#42CA80] mb-4">FortuneMarq Media & Marketing · Digital Growth Proposal</p>
                  <h1 className="text-3xl font-bold leading-tight">{typeContent.headline}</h1>
                  <p className="text-slate-300 text-base mt-3">Prepared exclusively for</p>
                  <p className="text-2xl font-bold text-white mt-1">{lead.company_name}</p>
                  {lead.city && <p className="text-slate-400 text-sm mt-0.5">{lead.city}{lead.industry ? ` · ${lead.industry}` : ""}</p>}
                  <div className="flex flex-wrap gap-5 mt-8 pt-8 border-t border-slate-700/50">
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Prepared For</p><p className="text-sm font-semibold text-white mt-0.5">{lead.contact_person || lead.company_name}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Prepared By</p><p className="text-sm font-semibold text-white mt-0.5">Jabeer · FortuneMarq</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Date</p><p className="text-sm font-semibold text-white mt-0.5">{today}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Valid Until</p><p className="text-sm font-semibold text-[#42CA80] mt-0.5">{addDays(parseInt(validity))}</p></div>
                    <div className="ml-auto"><p className="text-[10px] text-slate-500 uppercase tracking-wide">Ref</p><p className="text-sm font-mono font-bold text-slate-300 mt-0.5">{proposalNumber}</p></div>
                  </div>
                </div>
              </div>

              {/* Personal note */}
              {customNote && (
                <div className="px-10 py-6 bg-emerald-50 border-b border-emerald-100">
                  <p className="text-sm text-emerald-800 italic leading-relaxed">"{customNote}"</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-2">— Jabeer</p>
                </div>
              )}

              {/* ── 2. THE SITUATION ─────────────────────────────────────────── */}
              <div className="px-10 py-8 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-5">Understanding Your Situation</p>
                <div className="space-y-4">
                  {[
                    { label: "Where You Are Now", text: typeContent.situation, color: "blue" },
                    { label: "What This Is Costing You", text: typeContent.consequence, color: "red" },
                    { label: "Why Now Is the Right Time", text: typeContent.urgency, color: "emerald" },
                  ].map(({ label, text, color }, i) => {
                    const borderColors: Record<string, string> = { blue: "border-blue-400 bg-blue-50", red: "border-red-400 bg-red-50", emerald: "border-emerald-400 bg-emerald-50" };
                    const labelColors: Record<string, string> = { blue: "text-blue-700", red: "text-red-700", emerald: "text-emerald-700" };
                    return (
                      <div key={i} className={`avoid-break rounded-2xl border-l-4 p-5 ${borderColors[color]}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${labelColors[color]}`}>{label}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. THE GROWTH FUNNEL ─────────────────────────────────────── */}
              <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-2">Our Approach — The Growth Funnel</p>
                <p className="text-sm text-slate-500 mb-6">Every service we're proposing connects to a specific stage in your growth funnel. This is how we think — not individual services, but a coordinated system that moves a stranger into a paying client.</p>

                {/* Funnel visual */}
                <div className="flex flex-col items-center gap-0">
                  {FUNNEL_STAGES.map((fs, i) => {
                    const hasActive = fs.services.some(sid => selectedIds.includes(sid));
                    const activeInStage = fs.services.filter(sid => selectedIds.includes(sid));
                    const FIcon = fs.icon;
                    const widths = ["w-full", "w-11/12", "w-10/12", "w-9/12", "w-8/12"];
                    const funnelColors: Record<string, string> = {
                      blue:    hasActive ? "bg-blue-600 text-white"    : "bg-blue-100 text-blue-400",
                      indigo:  hasActive ? "bg-indigo-600 text-white"  : "bg-indigo-100 text-indigo-400",
                      purple:  hasActive ? "bg-purple-600 text-white"  : "bg-purple-100 text-purple-400",
                      emerald: hasActive ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-400",
                      orange:  hasActive ? "bg-orange-500 text-white"  : "bg-orange-100 text-orange-400",
                    };
                    const descColors: Record<string, string> = {
                      blue: "text-blue-100", indigo: "text-indigo-100", purple: "text-purple-100", emerald: "text-emerald-100", orange: "text-orange-100",
                    };
                    const tagBg: Record<string, string> = {
                      blue: "bg-blue-500/30", indigo: "bg-indigo-500/30", purple: "bg-purple-500/30", emerald: "bg-emerald-500/30", orange: "bg-orange-500/30",
                    };
                    return (
                      <div key={fs.key} className="avoid-break flex flex-col items-center w-full">
                        <div className={`${widths[i]} mx-auto rounded-2xl px-5 py-4 transition-all ${funnelColors[fs.color]} ${!hasActive ? "opacity-40" : ""}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <FIcon className="h-5 w-5 shrink-0" />
                              <div>
                                <p className="font-bold text-sm">{fs.label}</p>
                                <p className={`text-xs ${hasActive ? descColors[fs.color] : "opacity-60"}`}>{fs.desc}</p>
                              </div>
                            </div>
                            {hasActive && activeInStage.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {activeInStage.map(sid => {
                                  const svcName = RAW_SERVICES.find(r => r.id === sid)?.label || sid;
                                  return <span key={sid} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagBg[fs.color]}`}>{svcName}</span>;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        {i < FUNNEL_STAGES.length - 1 && (
                          <div className="flex flex-col items-center my-1">
                            <ArrowDown className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!activeFunnelStages.length && (
                  <p className="text-xs text-slate-400 text-center mt-4 italic">Select services to see how they map to your growth funnel</p>
                )}

                {/* Approach phases */}
                <div className="mt-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">How We Execute — Phase by Phase</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { phase: "01", title: "Discovery", duration: "Week 1", steps: ["Deep dive into your business, market, and customers", "Competitor analysis — what are they doing and where are the gaps", "Identify your highest-impact quick wins"] },
                      { phase: "02", title: "Strategy", duration: "Week 1–2", steps: ["Build your custom growth roadmap", "Define KPIs and success metrics for each service", "Agree on timelines and first deliverables"] },
                      { phase: "03", title: "Execution", duration: "Week 2 onwards", steps: ["Each service launched according to the roadmap", "You're updated at every milestone", "Nothing goes live without your approval"] },
                      { phase: "04", title: "Optimise & Scale", duration: "Monthly", steps: ["Monthly report: what worked, what didn't, what we're doing next", "Double down on what's generating leads", "Expand into the next phase of the funnel"] },
                    ].map(({ phase, title, duration, steps }) => (
                      <div key={phase} className="avoid-break bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl font-black text-slate-100">{phase}</span>
                          <div><p className="text-sm font-bold text-slate-900 leading-tight">{title}</p><p className="text-[10px] text-slate-400">{duration}</p></div>
                        </div>
                        <ul className="space-y-1.5">
                          {steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <div className="h-3 w-3 rounded-full bg-[#42CA80]/30 flex items-center justify-center shrink-0 mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-[#42CA80]" /></div>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 4. WHY WE'RE DIFFERENT ───────────────────────────────────── */}
              <div className="px-10 py-8 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-2">Why FortuneMarq — Not a Typical Agency</p>
                <p className="text-sm text-slate-500 mb-6">Most digital agencies share the same problems. Here's how we're built differently — and why that matters for your results.</p>
                <div className="space-y-3">
                  {DIFFERENTIATORS.map(({ icon: Icon, title, agency, us }, i) => (
                    <div key={i} className="avoid-break grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-slate-200">
                      <div className="bg-red-50 px-5 py-4 border-b sm:border-b-0 sm:border-r border-slate-200">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-2">Typical Agency</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{agency}</p>
                      </div>
                      <div className="bg-emerald-50 px-5 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 rounded-md bg-[#42CA80]/20 flex items-center justify-center"><Icon className="h-3 w-3 text-[#42CA80]" /></div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{title}</p>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{us}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 5. SERVICE DEEP-DIVES ────────────────────────────────────── */}
              <div className="px-10 py-8 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-2">What We're Building For You</p>
                <p className="text-sm text-slate-500 mb-6">Each service below comes with a detailed breakdown of what we do, how we do it, and what you get.</p>
                <div className="space-y-6">
                  {selectedFullData.map((svc, idx) => {
                    const SvcIcon = SERVICE_ICONS[svc.id] || FileText;
                    const deep = svc.deep;
                    return (
                      <div key={svc.id} className="rounded-3xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:overflow-visible">
                        {/* Service header */}
                        <div className="avoid-break keep-with-next bg-slate-900 px-6 py-5 text-white flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <SvcIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{svc.label}</p>
                              {svc.raw?.tagline && <p className="text-slate-400 text-sm mt-0.5">{svc.raw.tagline.replace(/\{\{.*?\}\}/g, lead.city || "your city")}</p>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {svc.setupFee > 0 && <p className="text-xs text-slate-400">{formatINR(svc.setupFee)} setup</p>}
                            {svc.monthlyRetainer > 0 && <p className="text-base font-bold text-[#42CA80]">{formatINR(svc.monthlyRetainer)}<span className="text-xs text-slate-400">/mo</span></p>}
                          </div>
                        </div>

                        <div className="p-6 space-y-5">
                          {/* The problem this solves */}
                          {deep && (
                            <div className="avoid-break bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Why You Need This</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{deep.problem}</p>
                            </div>
                          )}

                          {/* Our approach */}
                          {deep && (
                            <div className="avoid-break">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">Our Approach</p>
                              <div className="space-y-2">
                                {deep.ourApproach.map((step, si) => (
                                  <div key={si} className="flex items-start gap-3">
                                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                                    <p className="text-sm text-slate-700">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Features grid */}
                          {deep && (
                            <div>
                              <p className="keep-with-next text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">What You Get — In Detail</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {deep.features.map((feat, fi) => (
                                  <div key={fi} className="avoid-break bg-white rounded-xl border border-slate-100 p-4">
                                    <div className="flex items-start gap-2.5">
                                      <div className="h-5 w-5 rounded-lg bg-[#42CA80]/15 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="h-3 w-3 text-[#42CA80]" />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">{feat.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{feat.detail}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Why it works */}
                          {deep && (
                            <div className="avoid-break bg-[#42CA80]/5 border border-[#42CA80]/20 rounded-2xl p-4">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-[#42CA80] mb-2">Why This Works</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{deep.whyItWorks}</p>
                            </div>
                          )}

                          {/* Timeline + note — kept together so the card tail never strands */}
                          {(svc.raw?.timeline || svc.raw?.importantNote) && (
                            <div className="avoid-break space-y-4">
                              {svc.raw?.timeline && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-semibold text-slate-600">Timeline:</span> {svc.raw.timeline}
                                </div>
                              )}
                              {svc.raw?.importantNote && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">⚠️ {svc.raw.importantNote}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 6. INVESTMENT TABLE ──────────────────────────────────────── */}
              <div className="px-10 py-8 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-5">Your Investment</p>
                <div className="avoid-break rounded-2xl overflow-hidden border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wide">Service</th>
                        <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wide">One-time Setup</th>
                        <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wide">Monthly</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {selectedServices.map((svc, i) => (
                        <tr key={svc.id} className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                          <td className="px-5 py-3.5 font-medium text-slate-800">{svc.label}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-600">{svc.setupFee > 0 ? formatINR(svc.setupFee) : "—"}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-800 font-semibold">{svc.monthlyRetainer > 0 ? `${formatINR(svc.monthlyRetainer)}/mo` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white">
                        <td className="px-5 py-4 font-bold">Total</td>
                        <td className="px-5 py-4 text-right font-bold font-mono text-base">{totalSetup > 0 ? formatINR(totalSetup) : "—"}</td>
                        <td className="px-5 py-4 text-right font-bold font-mono text-lg text-[#42CA80]">{formatINR(totalMonthly)}/mo</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {selectedServices.some(s => s.id === "GOOGLE_ADS" || s.id === "META_ADS") && (
                  <p className="avoid-break text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mt-3">⚠️ Ad spend for Google Ads and Meta Ads is your own budget, billed directly to Google/Meta. The pricing above covers FortuneMarq management fees only.</p>
                )}
                {startDate && <p className="text-xs text-slate-500 mt-2">Proposed start date: {formatDate(startDate)}</p>}
              </div>

              {/* ── 7. HOW WE GET STARTED + footer (one print unit so the footer
                     never strands alone on a final page) ─────────────────────── */}
              <div className="avoid-break">
              <div className="px-10 py-8 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#42CA80] mb-5">How We Get Started</p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { n: "1", title: "Confirm", desc: "Reply 'Yes, confirmed' — that's all it takes to get started." },
                    { n: "2", title: "Agreement", desc: "Service agreement sent within 24 hours, for your records." },
                    { n: "3", title: "Invoice", desc: "Setup fee invoiced. Pay via bank transfer or UPI." },
                    { n: "4", title: "Onboarding", desc: "Payment confirmed → onboarding starts within 24 hours." },
                    { n: "5", title: "We Begin", desc: "First update from us within one week of starting." },
                  ].map(({ n, title, desc }, i, arr) => (
                    <div key={n} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 sm:text-center">
                      <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Footer ──────────────────────────────────────────────────── */}
              <div className="px-10 py-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Jabeer</p>
                  <p className="text-xs text-slate-400 mt-0.5">FortuneMarq Media & Marketing</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />+91 93530 82656</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />fortunemarq@gmail.com</span>
                  <span className="flex items-center gap-1.5"><ExternalLink className="h-3 w-3" />fortunemarq.com</span>
                </div>
              </div>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button onClick={() => setStep("services")} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-2xl transition-colors">Edit</button>
              <button onClick={saveProposal} disabled={isPending} className="flex-1 bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Save & Send to Client
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3 — DONE
        ════════════════════════════════════════════════════════════════════ */}
        {step === "done" && savedProposalId && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-10">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Proposal Ready</h2>
              <p className="text-slate-500 mt-1">{proposalNumber} · {lead.company_name} · Copy the message below and send via WhatsApp</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                {totalSetup > 0 && <><span className="text-slate-700 font-semibold">{formatINR(totalSetup)} setup</span><span className="text-slate-300">·</span></>}
                <span className="text-[#42CA80] font-bold text-lg">{formatINR(totalMonthly)}/mo</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-4">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-white" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Send via WhatsApp</p>
                  <p className="text-xs text-slate-400">Copy the message below, then attach the proposal PDF</p>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-[#075E54] rounded-2xl p-4 text-sm text-white font-mono leading-relaxed whitespace-pre-wrap">{waMessage}</div>
                <div className="flex gap-3 mt-4">
                  <button onClick={copyMessage} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${copied ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"}`}>
                    {copied ? <><CheckCheck className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Message</>}
                  </button>
                  <a href={`https://wa.me/91${lead.phone || ""}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 text-white transition-colors">
                    Open WhatsApp <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={sendProposal} disabled={isPending} className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Sent → Move Stage
              </button>
              <button onClick={() => router.push("/admin/proposals")} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold px-6 py-3.5 rounded-2xl transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
