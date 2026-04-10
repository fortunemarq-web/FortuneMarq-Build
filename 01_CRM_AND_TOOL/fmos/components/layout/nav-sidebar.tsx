"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Phone,
  Target,
  FolderKanban,
  ListTodo,
  X,
  BarChart3,
  DollarSign,
  Receipt,
  Wallet,
  TrendingUp,
  Users,
  BookOpen,
  Trophy
} from "lucide-react";
import clsx from "clsx";

interface NavSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales Pipeline", icon: Phone },
  { href: "/strategist", label: "Strategy Hub", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
];

const financeItems = [
  { href: "/admin/finance", label: "Finance Hub", icon: DollarSign },
  { href: "/admin/finance/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/finance/expenses", label: "Expense Log", icon: Wallet },
  { href: "/admin/finance/pnl", label: "P&L Statement", icon: TrendingUp },
];

const adminItems = [
  { href: "/admin", label: "Command Hub", icon: BarChart3 },
  { href: "/admin/niche-kits", label: "Niche Kits", icon: FolderKanban },
  { href: "/admin/whatsapp-templates", label: "Message Templates", icon: ListTodo },
  { href: "/admin/audit-log", label: "Audit Trait", icon: ListTodo },
  { href: "/admin/users", label: "User Access", icon: ListTodo },
];

const teamItems = [
  { href: "/admin/team", label: "Team Overview", icon: Users },
  { href: "/admin/team/sops", label: "SOP Library", icon: BookOpen },
  { href: "/admin/team/scorecards", label: "Scorecards", icon: Trophy },
];

export default function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-slate-50 border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 items-center">
              <img
                src="/Logo.png"
                alt="FortuneMarq"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">FortuneMarq</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-8 overflow-y-auto h-[calc(100%-12rem)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-3">Workspace</p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                        isActive
                          ? "bg-[#42CA80]/10 text-[#42CA80] shadow-sm shadow-[#42CA80]/5"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-3">Financials</p>
            <ul className="space-y-1">
              {financeItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                        isActive
                          ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-500/5"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-3">Team</p>
            <ul className="space-y-1">
              {teamItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                        isActive
                          ? "bg-amber-50 text-amber-600 shadow-sm shadow-amber-500/5"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-3">Admin Center</p>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                        isActive
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <p className="text-xs text-slate-600">FortuneMarq v1.0</p>
        </div>
      </aside>
    </>
  );
}
