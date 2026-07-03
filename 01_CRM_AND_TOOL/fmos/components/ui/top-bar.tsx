"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Command as CommandIcon } from "lucide-react";
import NotificationBell from "./notification-bell";

// Friendly labels for known path segments. Unknown segments fall back to
// title-case; UUID-ish segments render as "Details".
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  sales: "Leads",
  outreach: "Outreach",
  meetings: "Meetings",
  proposals: "Proposals",
  agreements: "Agreements",
  clients: "Clients",
  leads: "Leads",
  tasks: "Tasks",
  projects: "Projects",
  team: "Team",
  finance: "Finance",
  invoices: "Invoices",
  expenses: "Expenses",
  growth: "Growth",
  strategy: "Strategy",
  settings: "Settings",
  users: "Users",
  reports: "Reports",
  renewals: "Renewals",
  new: "New",
  edit: "Edit",
  manager: "Manager",
  pipeline: "Pipeline",
  strategist: "Strategist",
  telecaller: "Telecaller",
  "my-stats": "My Stats",
  "whatsapp-templates": "WhatsApp Templates",
  "data-management": "Data Management",
  "bulk-import": "Bulk Import",
  "audit-log": "Audit Log",
  "build-tracker": "Build Tracker",
  "niche-kits": "Niche Kits",
  attendance: "Attendance",
  briefing: "Briefing",
  marketing: "Marketing",
  operations: "Operations",
  financials: "Financials",
  duplicates: "Duplicates",
  automations: "Automations",
  alerts: "Alerts",
  proposal: "Proposal",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string {
  if (UUID_RE.test(segment)) return "Details";
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Slim PM-tool style top bar: breadcrumbs on the left, global search
 * trigger + notifications on the right. Desktop only — mobile keeps the
 * existing mobile header from app-sidebar.
 */
export default function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
  // Collapse "/admin" prefix duplication: "/admin" alone reads "Dashboard"
  const visibleCrumbs = crumbs.filter((c, i) => !(i === 0 && c.label === "Dashboard" && crumbs.length > 1));

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <header className="hidden md:flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#0e100f]/70 px-4 backdrop-blur-xl print:hidden">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
        {visibleCrumbs.length === 0 ? (
          <span className="font-semibold text-slate-900">Home</span>
        ) : (
          visibleCrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
              {crumb.isLast ? (
                <span className="font-semibold text-slate-900 truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-400 hover:text-slate-700 transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))
        )}
      </nav>

      {/* Right: search + notifications */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={openPalette}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-600"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Search anything…</span>
          <span className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-bold text-slate-400">
            <CommandIcon className="h-2.5 w-2.5" />K
          </span>
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
