"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Shield,
  FolderKanban,
  Receipt,
  MessageCircle,
  Target,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  { id: "assets", label: "Asset Vault", icon: Shield },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "finance", label: "Finance", icon: Receipt },
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "communications", label: "Comms", icon: MessageCircle },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const VALID_TABS = TABS.map((t) => t.id) as string[];

export default function ClientProfileTabs({
  children,
  defaultTab = "overview",
}: {
  children: Record<TabId, ReactNode>;
  defaultTab?: TabId;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabFromUrl = searchParams.get("tab");
  const initialTab: TabId =
    tabFromUrl && VALID_TABS.includes(tabFromUrl)
      ? (tabFromUrl as TabId)
      : defaultTab;

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  function handleTabChange(id: TabId) {
    setActiveTab(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      {/* Tab Bar */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
                  isActive
                    ? "border-[#42CA80] text-[#42CA80]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>{children[activeTab]}</div>
    </div>
  );
}
