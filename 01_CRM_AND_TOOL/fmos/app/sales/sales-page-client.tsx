"use client";

import { useState } from "react";
import Link from "next/link";
import SalesIntelligenceCockpit, {
  type Lead,
  type MarketInsight,
} from "@/components/sales/sales-intelligence-cockpit";
import SalesLeadTypeSwitcher, {
  LeadTypeContext,
  type LeadType,
} from "@/components/sales/sales-lead-type-switcher";
import { Phone, ArrowRight, Clock, CalendarDays, GitBranch } from "lucide-react";

interface SalesPageClientProps {
  initialLeads: Lead[];
  initialMarketInsights: MarketInsight[];
  userId: string | null;
  userName: string;
  newInboundCount: number;
  priorityQueue?: any[];
  briefStats: {
    followUpCount: number;
    freshLeadCount: number;
    warmLeads: { name: string; niche: string }[];
    callsYesterday: number;
    bestNiche: string;
  };
}

export default function SalesPageClient({
  initialLeads,
  initialMarketInsights,
  userId,
  userName,
  newInboundCount,
  priorityQueue = [],
  briefStats
}: SalesPageClientProps) {
  const [activeLeadType, setActiveLeadType] = useState<LeadType>("outbound");

  return (
    <LeadTypeContext.Provider value={{ activeLeadType, setActiveLeadType }}>
      <div className="min-h-screen bg-slate-50">
        {/* Header with Lead Type Switcher */}
        <SalesLeadTypeSwitcher
          newInboundCount={newInboundCount}
          activeLeadType={activeLeadType}
          setActiveLeadType={setActiveLeadType}
        />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ── PRIORITY QUEUE ───────────────────────────────── */}
          {priorityQueue.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-amber-900">Priority Queue — Act Now</h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white">
                    {priorityQueue.length}
                  </span>
                </div>
                <Link
                  href="/sales/outreach"
                  className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Outreach Board
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4">
                {priorityQueue.slice(0, 10).map((seq: any) => {
                  const lead = seq.lead;
                  const isFollowup = seq.stage === "followup_due";
                  return (
                    <div
                      key={seq.id}
                      className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isFollowup
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {isFollowup ? (
                            <><Clock className="h-2.5 w-2.5" /> Follow-up</>
                          ) : (
                            <><CalendarDays className="h-2.5 w-2.5" /> Meeting</>
                          )}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {lead?.company_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {lead?.contact_person}{lead?.city ? ` · ${lead.city}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        {lead?.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </a>
                        )}
                        <Link
                          href={`/sales/leads/${lead?.id}`}
                          className="ml-auto text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sales Intelligence Cockpit */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <SalesIntelligenceCockpit
              initialLeads={initialLeads}
              initialMarketInsights={initialMarketInsights}
              userId={userId}
            />
          </div>
        </div>
      </div>
    </LeadTypeContext.Provider>
  );
}

