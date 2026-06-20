"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Flame, RefreshCw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export type LeadType = "outbound" | "inbound";

export const LeadTypeContext = createContext<{
  activeLeadType: LeadType;
  setActiveLeadType: (type: LeadType) => void;
}>({
  activeLeadType: "outbound",
  setActiveLeadType: () => {},
});

export const useLeadType = () => useContext(LeadTypeContext);

interface SalesLeadTypeSwitcherProps {
  newInboundCount: number;
  activeLeadType: LeadType;
  setActiveLeadType: (type: LeadType) => void;
}

export default function SalesLeadTypeSwitcher({
  newInboundCount,
  activeLeadType,
  setActiveLeadType,
}: SalesLeadTypeSwitcherProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="border-b border-line bg-slate-50">
      {/* Tab Switcher */}
      <div className="px-4 pt-3 pb-2 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveLeadType("outbound")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              activeLeadType === "outbound"
                ? "bg-surface text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Zap className="h-4 w-4" />
            <span>Outbound / Cold</span>
          </button>
          <button
            onClick={() => setActiveLeadType("inbound")}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              activeLeadType === "inbound"
                ? "bg-surface text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Flame className="h-4 w-4" />
            <span>Inbound / Hot</span>
            {newInboundCount > 0 && (
              <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white tabular-nums">
                {newInboundCount > 99 ? "99+" : newInboundCount}
              </span>
              )}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-brand-line hover:text-brand-deep"
            title="Refresh leads"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-deep lg:hidden"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft border border-brand-line">
              <Zap className="h-5 w-5 text-brand-deep" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">Sales Intelligence</h1>
              <p className="text-xs text-slate-600">Data-Driven Selling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
