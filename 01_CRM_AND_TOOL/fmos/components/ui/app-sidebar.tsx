"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import NotificationBell from "@/components/ui/notification-bell";
import {
  LayoutDashboard,
  Phone,
  Target,
  FolderKanban,
  Users,
  ListTodo,
  LogOut,
  Menu,
  X,
  Loader2,
  DollarSign,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Command as CommandIcon,
  TrendingUp,
  BarChart2,
  UserCircle,
  GitBranch,
  FileText,
  CalendarCheck,
  FileSignature,
  MessageSquare,
  History,
  Database,
  Megaphone,
  Boxes,
} from "lucide-react";


interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Phase A: Cleaned nav config per role
// Admin: 9 nav items (Settings/Profile is the sticky footer)
// Telecaller: 2 items (My Calls + My Stats)
// Staff: 1 item (My Tasks)
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: Record<string, NavGroup[]> = {
  admin: [
    {
      label: "Sales",
      items: [
        { label: "Dashboard",  href: "/admin",           icon: LayoutDashboard },
        { label: "Leads",      href: "/sales",            icon: Phone },
        { label: "Outreach",   href: "/admin/outreach",   icon: GitBranch },
        { label: "Curiosity Blast", href: "/admin/curiosity-blast", icon: Megaphone },
        { label: "Meetings",   href: "/admin/meetings",   icon: CalendarCheck },
        { label: "Proposals",  href: "/admin/proposals",  icon: FileText },
        { label: "Agreements", href: "/admin/agreements", icon: FileSignature },
        { label: "Clients",    href: "/admin/clients",    icon: Users },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Tasks",         href: "/tasks",                icon: ListTodo },
        { label: "Projects",      href: "/projects",             icon: FolderKanban },
        { label: "Delivery Load", href: "/admin/delivery-load",  icon: Boxes },
        { label: "Team",          href: "/admin/team",           icon: Users },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Finance",       href: "/admin/finance",      icon: DollarSign },
        { label: "Marketing Hub", href: "/admin/marketing-hub", icon: Megaphone },
        { label: "Marketing",     href: "/admin/marketing",    icon: BarChart2 },
        { label: "Growth",        href: "/admin/growth",       icon: TrendingUp },
        { label: "Strategy",      href: "/admin/strategy",     icon: Target },
        { label: "Reports",       href: "/admin/reports",      icon: BarChart2 },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "WA Templates", href: "/admin/whatsapp-templates", icon: MessageSquare },
        { label: "Attendance",   href: "/admin/attendance",         icon: CalendarCheck },
        { label: "Audit Log",    href: "/admin/audit-log",          icon: History },
        { label: "Data Tools",   href: "/admin/data-management",    icon: Database },
      ],
    },
  ],
};

// Flat list fallback for non-admin roles
const NAV_CONFIG: Record<string, NavItem[]> = {

  telecaller: [
    { label: "My Calls",      href: "/sales",                icon: Phone },
    { label: "My Stats",      href: "/telecaller/my-stats",  icon: BarChart2 },
    { label: "My Attendance", href: "/attendance",           icon: CalendarCheck },
  ],

  strategist: [
    // Hidden from nav in Phase A — accessible via /strategist directly
    { label: "Strategy Board", href: "/strategist", icon: Target },
  ],
  pm: [
    { label: "Project Dashboard", href: "/projects", icon: FolderKanban },
  ],
  // Phase B3: Staff gets My Tasks + My Profile
  staff: [
    { label: "My Tasks",      href: "/tasks",      icon: ListTodo },
    { label: "My Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "My Profile",    href: "/profile",    icon: UserCircle },
  ],
  client: [
    { label: "My Project", href: "/client/dashboard", icon: FolderKanban },
  ],
};

export default function AppSidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Try to get role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .single();

        let userRole = (profile as any)?.role;
        // Bug Fix: Use full_name, then email prefix (e.g. jabeer@... → "jabeer"), then "User"
        const rawName = (profile as any)?.full_name;
        const emailPrefix = (user.email || "").split("@")[0];
        let name = rawName || emailPrefix || "User";
        let email = (profile as any)?.email || user.email || "";

        // If no role found in profiles, check if user is a client
        if (!userRole && user.email) {
          const { data: client } = await supabase
            .from("clients")
            .select("id, business_name, primary_email")
            .eq("primary_email", user.email)
            .single();

          if (client) {
            userRole = "client";
            name = (client as any).business_name || "Client";
            email = (client as any).primary_email || user.email;
          }
        }

        setRole(userRole || "staff");
        setUserName(name);
        setUserEmail(email);
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole("staff");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = role ? NAV_CONFIG[role] || NAV_CONFIG.staff : [];
  const navGroups = role === "admin" ? NAV_GROUPS.admin : null;

  const isActiveLink = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm md:hidden print:hidden">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 items-center">
          <img
            src="/Logo.png"
            alt="FortuneMarq"
            className="h-8 w-auto object-contain"
          />
        </div>
        <span className="text-base font-display font-bold text-slate-900">
          FortuneMarq
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );

  // Sidebar Content Component
  const SidebarContent = () => (
    <>
      {/* Sidebar Header / Logo */}
      <div className={clsx(
        "flex h-[56px] items-center justify-between border-b border-slate-700/40 px-4 transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "px-4"
      )}>
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 items-center flex-shrink-0">
            <img
              src="/Logo.png"
              alt="FortuneMarq"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
          </div>
          {!isCollapsed && (
            <span className="text-base font-display font-semibold text-white truncate animate-in fade-in duration-300">
              FortuneMarq
            </span>
          )}
        </Link>
        {/* Close button - Mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Global Search Trigger (Desktop only) */}
      {!isCollapsed && (
        <div className="px-3 mt-2 animate-in fade-in duration-300">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700/50 transition-all hover:bg-slate-800 hover:ring-slate-600"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Quick Search...</span>
            </div>
            <div className="flex items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold">
              <CommandIcon className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#42CA80]" />
          </div>
        ) : navGroups ? (
          <div className="space-y-3">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <div className="mb-0.5 px-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {group.label}
                    </span>
                  </div>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveLink(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={clsx(
                            "group flex items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                            isActive
                              ? "border-l-2 border-[#42CA80] bg-slate-800 pl-[8px] text-white"
                              : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
                            isCollapsed && "justify-center px-0 pl-0 py-2"
                          )}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon className={clsx("h-4 w-4 flex-shrink-0 transition-colors", !isCollapsed && "mr-2.5", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                        isActive
                          ? "border-l-2 border-[#42CA80] bg-slate-800 pl-[10px] text-white"
                          : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
                        isCollapsed && "justify-center px-0 pl-0"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={clsx("h-4 w-4 flex-shrink-0 transition-colors", !isCollapsed && "mr-2.5", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile & Sign Out */}
      <div className="border-t border-slate-700/40 bg-slate-900 px-3 py-2">
        <div className={clsx("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-300">{userName}</p>
              <p className="truncate text-[10px] text-slate-500">{role}</p>
            </div>
          )}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Link href="/admin/settings" className="text-slate-500 hover:text-slate-300 transition-colors p-1" title="Settings">
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Sign Out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {isCollapsed && (
            <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <div className="mt-2 hidden md:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/30 py-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : (
              <div className="flex items-center gap-1.5">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-700/40 transition-all duration-300 ease-in-out md:static md:translate-x-0 print:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
