"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    LayoutDashboard,
    Phone,
    FolderKanban,
    DollarSign,
    Target,
    Users,
    Command as CommandIcon,
    X,
    ClipboardList,
    Building2,
    MessageSquare,
    Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/lib/supabase";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    category: "Leads" | "Clients" | "Tasks" | "Projects" | "WhatsApp" | "Navigation";
    href: string;
    icon: any;
    badge?: string;
}

// icon is a component (function) — it does NOT survive JSON.stringify into
// localStorage, so recent searches load back with icon=undefined. Re-hydrate
// from the category and always fall back, or <Icon/> crashes the whole app.
const CATEGORY_ICONS: Record<SearchResult["category"], any> = {
    Leads: Users,
    Clients: Building2,
    Tasks: ClipboardList,
    Projects: FolderKanban,
    WhatsApp: MessageSquare,
    Navigation: Target,
};

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<{ id: string; role: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Mirrors the sidebar nav — keep in sync with app-sidebar.tsx
    const commonActions: SearchResult[] = [
        { id: "nav-dashboard", title: "Dashboard", icon: LayoutDashboard, href: "/admin", category: "Navigation" },
        { id: "nav-leads", title: "Leads", icon: Phone, href: "/sales", category: "Navigation" },
        { id: "nav-outreach", title: "Outreach Board", icon: Target, href: "/admin/outreach", category: "Navigation" },
        { id: "nav-meetings", title: "Meetings", icon: ClipboardList, href: "/admin/meetings", category: "Navigation" },
        { id: "nav-proposals", title: "Proposals", icon: ClipboardList, href: "/admin/proposals", category: "Navigation" },
        { id: "nav-agreements", title: "Agreements", icon: ClipboardList, href: "/admin/agreements", category: "Navigation" },
        { id: "nav-clients", title: "Clients", icon: Building2, href: "/admin/clients", category: "Navigation" },
        { id: "nav-tasks", title: "Tasks", icon: ClipboardList, href: "/tasks", category: "Navigation" },
        { id: "nav-projects", title: "Projects", icon: FolderKanban, href: "/projects", category: "Navigation" },
        { id: "nav-team", title: "Team", icon: Users, href: "/admin/team", category: "Navigation" },
        { id: "nav-finance", title: "Finance", icon: DollarSign, href: "/admin/finance", category: "Navigation" },
        { id: "nav-growth", title: "Growth", icon: Target, href: "/admin/growth", category: "Navigation" },
        { id: "nav-strategy", title: "Strategy", icon: Target, href: "/admin/strategy", category: "Navigation" },
        { id: "nav-reports", title: "Reports (AI Weekly)", icon: ClipboardList, href: "/admin/reports", category: "Navigation" },
        { id: "nav-wa-templates", title: "WhatsApp Templates", icon: MessageSquare, href: "/admin/whatsapp-templates", category: "Navigation" },
        { id: "nav-attendance", title: "Attendance Overview", icon: ClipboardList, href: "/admin/attendance", category: "Navigation" },
        { id: "nav-work-hours", title: "Work Hours", icon: ClipboardList, href: "/admin/work-hours", category: "Navigation" },
        { id: "nav-audit", title: "Audit Log", icon: ClipboardList, href: "/admin/audit-log", category: "Navigation" },
        { id: "nav-data-mgmt", title: "Data Management", icon: ClipboardList, href: "/admin/data-management", category: "Navigation" },
        { id: "nav-duplicates", title: "Data Quality (Duplicates)", icon: ClipboardList, href: "/admin/duplicates", category: "Navigation" },
        { id: "nav-automations", title: "Automations", icon: Target, href: "/admin/automations", category: "Navigation" },
        { id: "nav-niche-kits", title: "Niche Kits", icon: ClipboardList, href: "/admin/niche-kits", category: "Navigation" },
        { id: "nav-scorecards", title: "Team Scorecards", icon: Users, href: "/admin/team/scorecards", category: "Navigation" },
        { id: "nav-sops", title: "SOPs Library", icon: ClipboardList, href: "/admin/team/sops", category: "Navigation" },
        { id: "nav-sessions", title: "Active Sessions", icon: Users, href: "/admin/sessions", category: "Navigation" },
        { id: "nav-settings", title: "Settings", icon: ClipboardList, href: "/admin/settings", category: "Navigation" },
        { id: "nav-upload", title: "Upload Leads (CSV)", icon: ClipboardList, href: "/admin/upload", category: "Navigation" },
        { id: "nav-manager-pipeline", title: "Manager Pipeline", icon: Target, href: "/manager/pipeline", category: "Navigation" },
        { id: "nav-manager-perf", title: "Sales Performance", icon: Target, href: "/manager/performance", category: "Navigation" },
    ];

    // Telecallers only work leads — search should just find a lead by name or
    // number, not surface the whole app menu they can't use anyway.
    const isTelecaller = userProfile?.role === "telecaller";
    const navActions = isTelecaller ? [] : commonActions;

    // Initialize Recent Searches
    useEffect(() => {
        const stored = localStorage.getItem("recent_searches");
        if (stored) {
            try {
                setRecentSearches(
                    (JSON.parse(stored) as SearchResult[]).map((r) => ({
                        ...r,
                        icon: CATEGORY_ICONS[r.category] || Search,
                    }))
                );
            } catch (e) {
                localStorage.removeItem("recent_searches");
            }
        }

        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
                if (profile) setUserProfile(profile as any);
            }
        }
        fetchUser();
    }, []);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // ilike on guaranteed columns — fts_tokens migration may not be applied,
        // and a failed textSearch silently returns nothing.
        // Strip PostgREST or()-grammar metacharacters (, ( )) so typed search text
        // cannot inject extra filter clauses (e.g. "x,role.eq.admin").
        const safe = query.trim().replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
        if (!safe) { setResults([]); setLoading(false); return; }
        const pattern = `%${safe}%`;
        const fullResults: SearchResult[] = [];

        try {
            // 1. Search Leads — by name / contact / number / city, across ALL
            // leads. RLS already lets staff read leads, and a telecaller must be
            // able to find any lead by number (e.g. an inbound caller), not only
            // the handful assigned to them.
            const { data: leads } = await supabase.from("leads")
                .select("id, company_name, industry, city, outreach_stage, phone")
                .or(`company_name.ilike.${pattern},contact_person.ilike.${pattern},phone.ilike.${pattern},city.ilike.${pattern}`)
                .limit(5);
            if (leads) {
                leads.forEach((l: any) => {
                    fullResults.push({
                        id: `lead-${l.id}`,
                        title: l.company_name,
                        subtitle: [l.industry, l.city].filter(Boolean).join(" · ") || "Lead",
                        category: "Leads",
                        href: `/admin/leads/${l.id}`,
                        icon: Users,
                        badge: (l.outreach_stage || "").replace(/_/g, ' ')
                    });
                });
            }

            // 2. Search Clients (Managers/Admins only)
            if (userProfile?.role !== 'telecaller') {
                const { data: clients } = await (supabase.from("clients") as any)
                    .select("id, business_name, owner_name, city")
                    .or(`business_name.ilike.${pattern},owner_name.ilike.${pattern},city.ilike.${pattern}`)
                    .limit(5);

                if (clients) {
                    clients.forEach((c: any) => {
                        fullResults.push({
                            id: `client-${c.id}`,
                            title: c.business_name,
                            subtitle: [c.owner_name, c.city].filter(Boolean).join(" · ") || "Client",
                            category: "Clients",
                            href: `/admin/clients/${c.id}`,
                            icon: Building2
                        });
                    });
                }
            }

            // 3. Search Tasks (skip for telecallers — they only search leads)
            const { data: tasks } = userProfile?.role === 'telecaller'
                ? { data: null }
                : await (supabase.from("tasks") as any)
                    .select("id, title, project_id, status")
                    .ilike("title", pattern)
                    .limit(5);

            if (tasks) {
                tasks.forEach((t: any) => {
                    fullResults.push({
                        id: `task-${t.id}`,
                        title: t.title,
                        subtitle: `Status: ${(t.status || "open").replace(/_/g, ' ')}`,
                        category: "Tasks",
                        href: t.project_id ? `/projects/${t.project_id}` : "/tasks",
                        icon: ClipboardList
                    });
                });
            }

            setResults(fullResults);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, userProfile]);

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (search) {
            setLoading(true);
            searchTimeout.current = setTimeout(() => {
                performSearch(search);
            }, 300);
        } else {
            setResults([]);
            setLoading(false);
        }

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [search, performSearch]);

    const handleSelect = useCallback((result: SearchResult) => {
        // Save to recent
        const newRecent = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem("recent_searches", JSON.stringify(newRecent));

        setIsOpen(false);
        setSearch("");
        router.push(result.href);
    }, [router, recentSearches]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((open) => !open);
            }

            if (isOpen) {
                const currentList = search ? results : [...recentSearches, ...navActions];
                if (e.key === "Escape") {
                    setIsOpen(false);
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((i) => (i + 1) % currentList.length);
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((i) => (i - 1 + currentList.length) % currentList.length);
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    const item = currentList[selectedIndex];
                    if (item) handleSelect(item);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex, handleSelect, search, recentSearches, navActions]);

    if (!isOpen) return null;

    const displayResults = search ? results : [...recentSearches, ...navActions];

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="fixed inset-0 z-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 fill-mode-both">
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl">
                    <div className="flex items-center border-b border-slate-100 px-4">
                        <Search className={cn("h-5 w-5", loading ? "text-brand-deep animate-pulse" : "text-slate-400")} />
                        <input
                            autoFocus
                            className="flex h-14 w-full border-0 bg-transparent px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
                            placeholder={isTelecaller ? "Search leads by name or number..." : "Find clients, leads, tasks or projects..."}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setSelectedIndex(0);
                            }}
                        />
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />}
                        <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <CommandIcon className="h-3 w-3" />
                            <span>K</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="ml-4 text-slate-400 hover:text-slate-600 p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        {displayResults.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <Search className="mx-auto h-8 w-8 text-slate-800 mb-4" />
                                {search ? (
                                    <>
                                        <p className="text-sm text-slate-500 font-medium tracking-tight">No results found for "{search}"</p>
                                        <p className="text-xs text-slate-400 mt-1">Check spelling or try a broader search term.</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 font-medium tracking-tight">
                                        {isTelecaller ? "Start typing a lead's name or number" : "Start typing to search"}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="px-2 space-y-1">
                                {displayResults.map((item, index) => {
                                    const Icon = item.icon || CATEGORY_ICONS[item.category] || Search;
                                    const isSelected = index === selectedIndex;

                                    // Header for first item in category
                                    const showHeader = index === 0 || displayResults[index - 1].category !== item.category;

                                    return (
                                        <React.Fragment key={item.id}>
                                            {showHeader && (
                                                <div className="px-3 pt-3 pb-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                                                        {item.category}
                                                        <span className="h-[1px] flex-1 bg-slate-100"></span>
                                                    </p>
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "group flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 transition-all",
                                                    isSelected ? "bg-brand-soft text-brand-deep translate-x-1" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                )}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                onClick={() => handleSelect(item)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn(
                                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors",
                                                        isSelected ? "bg-white border-brand-line text-brand-deep" : "bg-white border-slate-200 text-slate-400"
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold truncate">{item.title}</p>
                                                            {item.badge && (
                                                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 opacity-80 truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-deep uppercase tracking-wider bg-white rounded-md px-2 py-1 shadow-sm">
                                                        <span>Select</span>
                                                        <kbd className="font-sans">↵</kbd>
                                                    </div>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[10px] font-medium text-slate-400">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><kbd className="rounded bg-white border border-slate-200 px-1 py-0.5 font-sans">↑↓</kbd> navigate</span>
                            <span className="flex items-center gap-1.5"><kbd className="rounded bg-white border border-slate-200 px-1 py-0.5 font-sans">↵</kbd> open</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><kbd className="rounded bg-white border border-slate-200 px-1 py-0.5 font-sans">Esc</kbd> close</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
