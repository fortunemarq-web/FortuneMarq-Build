"use client";

import React, { useState } from "react";
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    TrendingUp,
    Megaphone,
    CalendarDays,
    ChevronDown
} from "lucide-react";
import OverviewTab from "./tabs/overview-tab";
import OrganicSeoTab from "./tabs/organic-seo-tab";
import PaidCampaignsTab from "./tabs/paid-campaigns-tab";
import ContentCalendarTab from "./tabs/content-calendar-tab";

type TabType = "overview" | "organic" | "paid" | "content";

export default function MarketingDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "organic", label: "Organic & SEO", icon: TrendingUp },
        { id: "paid", label: "Paid Campaigns", icon: Megaphone },
        { id: "content", label: "Content Calendar", icon: CalendarDays },
    ];

    return (
        <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">
                        Agency Marketing
                    </h1>
                    <p className="text-[#a1a1aa] text-sm mt-1">
                        Track your agency's own growth engine
                    </p>
                </div>

                <div className="flex items-center gap-2 border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-colors w-fit">
                    <span className="font-medium">This Month</span>
                    <ChevronDown className="h-4 w-4 text-[#a1a1aa]" />
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-[#1f1f1f] mt-8 flex overflow-x-auto no-scrollbar scrollbar-hide">
                <div className="inline-flex gap-1 md:gap-4 px-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-300 whitespace-nowrap relative
                                    ${isActive
                                        ? "text-[#42CA80]"
                                        : "text-[#666] hover:text-[#a1a1aa]"
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs sm:text-sm font-semibold tracking-tight">{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#42CA80] rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="mt-8">
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "organic" && <OrganicSeoTab />}
                {activeTab === "paid" && <PaidCampaignsTab />}
                {activeTab === "content" && <ContentCalendarTab />}
            </div>
        </div>
    );
}
