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
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase";
import servicesData from "@/lib/data/services_data.json";

// Proposal document fonts — scoped to this route via next/font.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-plus-jakarta", display: "swap" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });
import { sendNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { leadStageUpdate } from "@/lib/pipeline";
import { fireTrigger } from "@/actions/automations";
import { sendProposalWA } from "@/actions/send-proposal-wa";

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
  const [waSent, setWaSent] = useState(false);
  const [waSending, setWaSending] = useState(false);
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
    <div className="min-h-full bg-canvas">
      {/* Topbar */}
      <div className="bg-surface border-b border-line px-6 py-4 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-900">New Proposal</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lead.company_name}{lead.city && ` · ${lead.city}`}{lead.industry && ` · ${lead.industry}`}
              <span className="ml-2 tabular-nums">{proposalNumber}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i <= stepIndex ? "opacity-100" : "opacity-40"}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${stepIndex > i ? "bg-brand text-white" : stepIndex === i ? "bg-brand-deep text-white" : "bg-white/[0.06] text-slate-500"}`}>
                    {stepIndex > i ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${stepIndex === i ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${stepIndex > i ? "bg-brand-line" : "bg-line"}`} />}
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
                return (
                  <div key={layer}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center border border-brand-line bg-brand-soft text-brand-deep"><Icon className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{layer}</p>
                        <p className="text-[11px] text-slate-400">{meta.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {services.map(svc => {
                        const isSelected = selectedServices.some(s => s.id === svc.id);
                        const selected = selectedServices.find(s => s.id === svc.id);
                        const isExpanded = expandedService === svc.id;
                        return (
                          <div key={svc.id} className={`rounded-xl border transition-colors overflow-hidden ${isSelected ? "border-brand-line shadow-sm" : "border-line bg-surface"}`}>
                            <div className={`flex items-start gap-3 p-4 ${isSelected ? "bg-brand-soft/50" : "bg-surface"}`}>
                              <button onClick={() => toggleService(svc)} className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-brand border-brand" : "border-slate-300 bg-surface hover:border-slate-400"}`}>
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
                                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                                    {SERVICE_DEEP[svc.id] && (
                                      <p className="text-xs text-slate-600 leading-relaxed">{SERVICE_DEEP[svc.id].problem}</p>
                                    )}
                                    {svc.deliverables && (
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">What's included</p>
                                        <ul className="space-y-1">
                                          {svc.deliverables.map((d, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                              <Check className="h-3 w-3 text-brand-deep shrink-0 mt-0.5" />{d}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {svc.timeline && <div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5 text-slate-400" />{svc.timeline}</div>}
                                    {svc.importantNote && <p className="text-[11px] text-warn bg-warn-soft border border-warn-line rounded-lg px-3 py-2">⚠️ {svc.importantNote}</p>}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSelected && selected && (
                              <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-brand-line bg-brand-soft/30">
                                <div className="pt-3">
                                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Setup Fee</label>
                                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input type="number" value={selected.setupFee || ""} onChange={e => updateFee(svc.id, "setupFee", Number(e.target.value))} className="w-full pl-7 pr-3 py-2.5 text-sm border border-line rounded-lg bg-surface tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-line" placeholder="0" />
                                  </div>
                                </div>
                                <div className="pt-3">
                                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Monthly Retainer</label>
                                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input type="number" value={selected.monthlyRetainer || ""} onChange={e => updateFee(svc.id, "monthlyRetainer", Number(e.target.value))} className="w-full pl-7 pr-3 py-2.5 text-sm border border-line rounded-lg bg-surface tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-line" placeholder="0" />
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
              <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Proposal Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Proposed Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-line" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Valid For</label>
                    <select value={validity} onChange={e => setValidity(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-line">
                      {["3","5","7","14","30"].map(v => <option key={v} value={v}>{v} days</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Personal Note to Client (optional)</label>
                  <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} rows={2} placeholder="E.g. Great speaking with you today..." className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-line resize-none" />
                </div>
              </div>
            </div>

            {/* Sticky summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-surface rounded-2xl p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-4">Proposal Summary</p>
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Select services to see totals</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {selectedServices.map(svc => (
                          <div key={svc.id} className="flex items-center justify-between gap-2">
                            <p className="text-xs text-slate-700 truncate flex-1">{svc.label}</p>
                            <p className="text-xs tabular-nums text-slate-400 shrink-0">{svc.monthlyRetainer > 0 ? `${formatINR(svc.monthlyRetainer)}/mo` : "—"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-line pt-3 space-y-2">
                        {totalSetup > 0 && <div className="flex items-center justify-between"><span className="text-xs text-slate-400">One-time Setup</span><span className="text-sm font-semibold tabular-nums">{formatINR(totalSetup)}</span></div>}
                        <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Monthly Retainer</span><span className="text-lg font-semibold tabular-nums text-brand">{formatINR(totalMonthly)}<span className="text-sm">/mo</span></span></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Our Commitment</p>
                  {[{ icon: Shield, text: "No lock-in — cancel anytime" }, { icon: Clock, text: "Clear delivery timelines" }, { icon: Package, text: "Monthly reports, always" }].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Icon className="h-3.5 w-3.5 text-brand-deep shrink-0 mt-0.5" /><p className="text-xs text-slate-600">{text}</p></div>
                  ))}
                </div>
                <button onClick={() => setStep("preview")} disabled={selectedServices.length === 0} className="w-full bg-brand-deep hover:bg-brand-deeper disabled:opacity-40 text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
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
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"><Printer className="h-4 w-4" /> Download PDF</button>
            </div>

            <div className={`${jakarta.variable} ${jbmono.variable} print-area overflow-hidden rounded-2xl bg-[#0e0e0e] text-white shadow-lg`}>

              {/* ── COVER ────────────────────────────────────────────────────── */}
              <div className="relative overflow-hidden px-10 py-14 sm:px-14 sm:py-20">
                <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-jbmono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    <span>FortuneMarq Media &amp; Marketing</span>
                    <span>Confidential · {today}</span>
                  </div>
                  <p className="mt-16 font-jbmono text-[11px] uppercase tracking-[0.22em] text-brand">Digital Growth Proposal · {proposalNumber}</p>
                  <h1 className="mt-5 font-jakarta text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
                    Growing<br /><span className="italic text-brand">{lead.company_name}</span><br />Online.
                  </h1>
                  <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/55">{typeContent.headline} A full-funnel plan{lead.city ? ` for ${lead.city}` : ""} — what we&apos;ll build, how it works, and the investment.</p>

                  {/* Chapter TOC */}
                  <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/10 pt-8 sm:grid-cols-4">
                    {[["01", "The Opportunity"], ["02", "Your Growth Plan"], ["03", "The Investment"], ["04", "Next Steps"]].map(([n, t]) => (
                      <div key={n}>
                        <p className="font-jbmono text-[10px] tracking-[0.18em] text-brand">CHAPTER {n}</p>
                        <p className="mt-1.5 font-jakarta text-sm font-semibold text-white">{t}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer meta */}
                  <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-6">
                    <p className="font-jakarta text-lg font-bold">Fortune<span className="text-brand">Marq</span></p>
                    <div className="flex flex-wrap gap-x-8 gap-y-1 font-jbmono text-[11px] text-white/50">
                      <span>Prepared for {lead.contact_person || lead.company_name}{lead.city ? ` · ${lead.city}` : ""}</span>
                      <span>Valid until {addDays(parseInt(validity))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal note */}
              {customNote && (
                <div className="border-t border-white/10 bg-brand/5 px-10 py-7 sm:px-14">
                  <p className="max-w-2xl text-[15px] italic leading-relaxed text-white/80">&ldquo;{customNote}&rdquo;</p>
                  <p className="mt-3 font-jbmono text-[11px] uppercase tracking-[0.18em] text-brand">— Jabeer, FortuneMarq</p>
                </div>
              )}

              {/* ── CHAPTER 01 — THE OPPORTUNITY ─────────────────────────────── */}
              <div className="relative border-t border-white/10 px-10 py-14 sm:px-14 sm:py-16">
                <p className="pointer-events-none absolute right-8 top-6 select-none font-jakarta text-[120px] font-extrabold leading-none text-white/[0.03]">01</p>
                <div className="relative">
                  <p className="font-jbmono text-[11px] uppercase tracking-[0.22em] text-brand">Chapter One</p>
                  <h2 className="mt-3 max-w-2xl font-jakarta text-4xl font-bold leading-[1.05] tracking-tight">The opportunity in front of you</h2>
                  <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
                    {[
                      { label: "Where you are now", text: typeContent.situation },
                      { label: "What it is costing you", text: typeContent.consequence },
                      { label: "Why now", text: typeContent.urgency, accent: true },
                    ].map(({ label, text, accent }, i) => (
                      <div key={i} className={`avoid-break p-6 ${accent ? "bg-brand text-[#0b3d26]" : "bg-[#141414]"}`}>
                        <p className={`font-jbmono text-[10px] uppercase tracking-[0.18em] ${accent ? "text-[#0b3d26]/70" : "text-white/40"}`}>{label}</p>
                        <p className={`mt-3 text-[13px] leading-relaxed ${accent ? "text-[#0b3d26]" : "text-white/65"}`}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CHAPTER 02 — YOUR GROWTH PLAN (condensed services) ───────── */}
              <div className="relative border-t border-white/10 px-10 py-14 sm:px-14 sm:py-16">
                <p className="pointer-events-none absolute right-8 top-6 select-none font-jakarta text-[120px] font-extrabold leading-none text-white/[0.03]">02</p>
                <div className="relative">
                  <p className="font-jbmono text-[11px] uppercase tracking-[0.22em] text-brand">Chapter Two</p>
                  <h2 className="mt-3 max-w-2xl font-jakarta text-4xl font-bold leading-[1.05] tracking-tight">What we&apos;ll build for you</h2>
                  <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/55">A coordinated system — not one-off services. Here&apos;s each piece, why it matters, and what you get.</p>

                  <div className="mt-10 space-y-5">
                    {selectedFullData.map((svc) => {
                      const SvcIcon = SERVICE_ICONS[svc.id] || FileText;
                      const deep = svc.deep;
                      const features = deep?.features?.slice(0, 4) ?? [];
                      return (
                        <div key={svc.id} className="avoid-break overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
                          {/* Service header */}
                          <div className="keep-with-next flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15">
                                <SvcIcon className="h-5 w-5 text-brand" />
                              </div>
                              <div>
                                <p className="font-jakarta text-lg font-bold">{svc.label}</p>
                                {svc.raw?.tagline && <p className="mt-0.5 text-[13px] text-white/45">{svc.raw.tagline.replace(/\{\{.*?\}\}/g, lead.city || "your city")}</p>}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {svc.setupFee > 0 && <p className="font-jbmono text-[11px] text-white/40">{formatINR(svc.setupFee)} setup</p>}
                              {svc.monthlyRetainer > 0 && <p className="font-jakarta text-xl font-bold text-[#d4a843]">{formatINR(svc.monthlyRetainer)}<span className="text-[11px] font-medium text-white/40">/mo</span></p>}
                            </div>
                          </div>

                          <div className="px-6 py-5">
                            {deep?.problem && <p className="text-[13px] leading-relaxed text-white/60">{deep.problem}</p>}
                            {features.length > 0 && (
                              <div className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                                {features.map((feat, fi) => (
                                  <div key={fi} className="avoid-break flex items-start gap-2.5">
                                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                                    <p className="text-[12px] leading-snug text-white/70"><span className="font-semibold text-white">{feat.title}.</span> {feat.detail}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {svc.raw?.timeline && <p className="mt-5 font-jbmono text-[10px] uppercase tracking-[0.16em] text-white/35">Timeline · {svc.raw.timeline}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── CHAPTER 03 — THE INVESTMENT ──────────────────────────────── */}
              <div className="relative border-t border-white/10 px-10 py-14 sm:px-14 sm:py-16">
                <p className="pointer-events-none absolute right-8 top-6 select-none font-jakarta text-[120px] font-extrabold leading-none text-white/[0.03]">03</p>
                <div className="relative">
                  <p className="font-jbmono text-[11px] uppercase tracking-[0.22em] text-brand">Chapter Three</p>
                  <h2 className="mt-3 font-jakarta text-4xl font-bold leading-[1.05] tracking-tight">The investment</h2>

                  {/* Headline totals */}
                  <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
                    <div className="avoid-break bg-[#141414] p-6">
                      <p className="font-jbmono text-[10px] uppercase tracking-[0.18em] text-white/40">One-time setup</p>
                      <p className="mt-2 font-jakarta text-3xl font-extrabold tabular-nums text-[#d4a843]">{totalSetup > 0 ? formatINR(totalSetup) : "—"}</p>
                    </div>
                    <div className="avoid-break bg-brand p-6 text-[#0b3d26]">
                      <p className="font-jbmono text-[10px] uppercase tracking-[0.18em] text-[#0b3d26]/70">Monthly retainer</p>
                      <p className="mt-2 font-jakarta text-3xl font-extrabold tabular-nums">{formatINR(totalMonthly)}<span className="text-base font-semibold">/mo</span></p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="avoid-break mt-5 overflow-hidden rounded-2xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#141414] text-left font-jbmono text-[10px] uppercase tracking-[0.16em] text-white/40">
                          <th className="px-5 py-3 font-medium">Service</th>
                          <th className="px-5 py-3 text-right font-medium">Setup</th>
                          <th className="px-5 py-3 text-right font-medium">Monthly</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedServices.map((svc) => (
                          <tr key={svc.id} className="border-b border-white/5">
                            <td className="px-5 py-3.5 font-medium text-white/85">{svc.label}</td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-white/50">{svc.setupFee > 0 ? formatINR(svc.setupFee) : "—"}</td>
                            <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-white/85">{svc.monthlyRetainer > 0 ? `${formatINR(svc.monthlyRetainer)}/mo` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#141414]">
                          <td className="px-5 py-4 font-jakarta font-bold">Total</td>
                          <td className="px-5 py-4 text-right font-bold tabular-nums text-[#d4a843]">{totalSetup > 0 ? formatINR(totalSetup) : "—"}</td>
                          <td className="px-5 py-4 text-right font-jakarta text-lg font-bold tabular-nums text-[#d4a843]">{formatINR(totalMonthly)}/mo</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {selectedServices.some(s => s.id === "GOOGLE_ADS" || s.id === "META_ADS") && (
                    <p className="avoid-break mt-4 rounded-lg border border-[#d4a843]/30 bg-[#d4a843]/10 px-4 py-2.5 text-[12px] text-[#e8c87a]">Ad spend for Google Ads and Meta Ads is your own budget, billed directly to Google/Meta. The pricing above covers FortuneMarq management fees only.</p>
                  )}
                  {startDate && <p className="mt-3 font-jbmono text-[11px] uppercase tracking-[0.16em] text-white/40">Proposed start · {formatDate(startDate)}</p>}
                </div>
              </div>

              {/* ── CHAPTER 04 — NEXT STEPS + footer (one print unit) ────────── */}
              <div className="avoid-break">
                <div className="relative border-t border-white/10 px-10 py-14 sm:px-14 sm:py-16">
                  <p className="pointer-events-none absolute right-8 top-6 select-none font-jakarta text-[120px] font-extrabold leading-none text-white/[0.03]">04</p>
                  <div className="relative">
                    <p className="font-jbmono text-[11px] uppercase tracking-[0.22em] text-brand">Chapter Four</p>
                    <h2 className="mt-3 font-jakarta text-4xl font-bold leading-[1.05] tracking-tight">How we get started</h2>
                    <div className="mt-10 grid gap-4 sm:grid-cols-5">
                      {[
                        { n: "1", title: "Confirm", desc: "Reply “Yes, confirmed” — that’s all it takes." },
                        { n: "2", title: "Agreement", desc: "Service agreement sent within 24 hours." },
                        { n: "3", title: "Invoice", desc: "Setup fee invoiced — pay via bank transfer or UPI." },
                        { n: "4", title: "Onboarding", desc: "Payment confirmed → onboarding starts in 24 hours." },
                        { n: "5", title: "We begin", desc: "First update from us within one week." },
                      ].map(({ n, title, desc }) => (
                        <div key={n} className="flex items-start gap-3 sm:flex-col">
                          <span className="font-jakarta text-2xl font-extrabold tabular-nums text-brand">{n}</span>
                          <div>
                            <p className="font-jakarta text-sm font-bold text-white">{title}</p>
                            <p className="mt-1 text-[12px] leading-snug text-white/50">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 bg-[#080808] px-10 py-8 sm:flex-row sm:items-center sm:px-14">
                  <div>
                    <p className="font-jakarta text-lg font-bold">Fortune<span className="text-brand">Marq</span></p>
                    <p className="mt-0.5 font-jbmono text-[11px] uppercase tracking-[0.16em] text-white/40">Jabeer · Media &amp; Marketing</p>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 font-jbmono text-[11px] text-white/50">
                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-brand" />+91 93530 82656</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-brand" />fortunemarq@gmail.com</span>
                    <span className="flex items-center gap-1.5"><ExternalLink className="h-3 w-3 text-brand" />fortunemarq.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button onClick={() => setStep("services")} className="border border-line bg-surface hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors">Edit</button>
              <button onClick={saveProposal} disabled={isPending} className="flex-1 bg-brand-deep hover:bg-brand-deeper disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Save &amp; Send to Client
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
              <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-brand-deep" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Proposal Ready</h2>
              <p className="text-slate-500 mt-1">{proposalNumber} · {lead.company_name} · Copy the message below and send via WhatsApp</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                {totalSetup > 0 && <><span className="text-slate-700 font-semibold tabular-nums">{formatINR(totalSetup)} setup</span><span className="text-slate-300">·</span></>}
                <span className="text-brand-deep font-semibold tabular-nums text-lg">{formatINR(totalMonthly)}/mo</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm mb-4">
              <div className="px-6 py-4 border-b border-line flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-white" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Send Proposal via WhatsApp</p>
                  <p className="text-xs text-slate-400">Sends the approved template + schedules a 48h follow-up automatically</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {waSent ? (
                  <div className="flex items-center gap-2 text-sm text-brand-deep bg-brand-soft border border-brand-line rounded-lg px-4 py-3">
                    <CheckCheck className="h-4 w-4 shrink-0" />
                    Proposal sent via WhatsApp. 48h follow-up scheduled.
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!savedProposalId) return;
                      setWaSending(true);
                      const result = await sendProposalWA(savedProposalId);
                      setWaSending(false);
                      if (result.ok) {
                        setWaSent(true);
                        toast.success("Proposal sent", `WhatsApp sent to ${lead.company_name}`);
                        logAudit({ action: "proposal_sent", resourceType: "proposal", resourceId: savedProposalId, resourceLabel: `${proposalNumber} — ${lead.company_name}`, newValue: { status: "sent", channel: "whatsapp" }, summary: `Proposal ${proposalNumber} sent via WhatsApp to ${lead.company_name}` });
                      } else {
                        toast.error("WhatsApp send failed", result.error || "Unknown error");
                      }
                    }}
                    disabled={waSending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
                  >
                    {waSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Send via FMOS WhatsApp
                  </button>
                )}
                <p className="text-xs text-slate-400 text-center">
                  or{" "}
                  <a href={`https://wa.me/91${lead.phone || ""}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer" className="underline">
                    open WhatsApp manually
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={sendProposal} disabled={isPending || waSent} className="flex-1 bg-brand-deep hover:bg-brand-deeper disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {waSent ? "Stage Updated" : "Mark Sent (no WA)"}
              </button>
              <button onClick={() => router.push("/admin/proposals")} className="border border-line bg-surface hover:bg-slate-50 text-slate-600 font-semibold px-6 py-3.5 rounded-lg transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
