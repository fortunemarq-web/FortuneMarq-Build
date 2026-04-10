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

    const commonActions: SearchResult[] = [
        { id: "nav-dashboard", title: "Command Hub", icon: LayoutDashboard, href: "/admin", category: "Navigation" },
        { id: "nav-sales", title: "Sales Force", icon: Phone, href: "/admin/sales", category: "Navigation" },
        { id: "nav-operations", title: "Operations Center", icon: FolderKanban, href: "/admin/operations", category: "Navigation" },
        { id: "nav-financials", title: "Financials Hub", icon: DollarSign, href: "/admin/financials", category: "Navigation" },
        { id: "nav-strategy", title: "Strategy Engine", icon: Target, href: "/admin/strategy", category: "Navigation" },
        { id: "nav-leads", title: "Leads Management", icon: Users, href: "/admin/sales/leads", category: "Navigation" },
    ];

    // Initialize Recent Searches
    useEffect(() => {
        const stored = localStorage.getItem("recent_searches");
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
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
        const searchTerms = query.trim().split(" ").join(" & "); // for fts
        const fullResults: SearchResult[] = [];

        try {
            // 1. Search Leads (Scoped by role)
            let leadsQuery = supabase.from("leads").select("id, company_name, industry, status, assigned_sales_exec");

            // Apply Telecaller restriction
            if (userProfile?.role === 'telecaller') {
                leadsQuery = leadsQuery.eq('assigned_sales_exec', userProfile.id);
            }

            const { data: leads } = await leadsQuery.textSearch('fts_tokens', searchTerms).limit(5);
            if (leads) {
                leads.forEach((l: any) => {
                    fullResults.push({
                        id: `lead-${l.id}`,
                        title: l.company_name,
                        subtitle: l.industry || "General Lead",
                        category: "Leads",
                        href: `/admin/sales/leads?id=${l.id}`,
                        icon: Users,
                        badge: l.status.replace(/_/g, ' ')
                    });
                });
            }

            // 2. Search Clients (Managers/Admins only)
            if (userProfile?.role !== 'telecaller') {
                const { data: clients } = await supabase.from("clients" as any)
                    .select("id, business_name, contact_name")
                    .textSearch('fts_tokens', searchTerms)
                    .limit(5);

                if (clients) {
                    clients.forEach((c: any) => {
                        fullResults.push({
                            id: `client-${c.id}`,
                            title: c.business_name,
                            subtitle: c.contact_name || "Enterprise Client",
                            category: "Clients",
                            href: `/admin/clients/${c.id}`,
                            icon: Building2
                        });
                    });
                }
            }

            // 3. Search Projects (Managers/Admins only)
            if (userProfile?.role !== 'telecaller') {
                const { data: projects } = await supabase.from("projects" as any)
                    .select("id, service_type, status")
                    .textSearch('fts_tokens', searchTerms)
                    .limit(5);

                if (projects) {
                    projects.forEach((p: any) => {
                        fullResults.push({
                            id: `project-${p.id}`,
                            title: p.service_type?.replace(/_/g, ' ') || "Project",
                            subtitle: `Status: ${p.status?.replace(/_/g, ' ')}`,
                            category: "Projects",
                            href: `/projects/${p.id}`,
                            icon: FolderKanban
                        });
                    });
                }
            }

            // 4. Search Tasks
            const { data: tasks } = await supabase.from("tasks" as any)
                .select("id, title, project_id, assigned_to")
                .textSearch('fts_tokens', searchTerms)
                .limit(5);

            if (tasks) {
                tasks.forEach((t: any) => {
                    fullResults.push({
                        id: `task-${t.id}`,
                        title: t.title,
                        subtitle: `Assigned to: ${t.assigned_to || 'Unassigned'}`,
                        category: "Tasks",
                        href: `/projects/${t.project_id}`,
                        icon: ClipboardList
                    });
                });
            }

            // 5. Search WhatsApp Logs (Admin only)
            if (userProfile?.role === 'admin') {
                const { data: logs } = await supabase.from("whatsapp_logs" as any)
                    .select("id, lead_id, message_sent")
                    .textSearch('fts_tokens', searchTerms)
                    .limit(3);

                if (logs) {
                    logs.forEach((log: any) => {
                        fullResults.push({
                            id: `wa-${log.id}`,
                            title: "WhatsApp Audit Item",
                            subtitle: log.message_sent.slice(0, 60) + "...",
                            category: "WhatsApp",
                            href: `/admin/sales/leads?id=${log.lead_id}`,
                            icon: MessageSquare
                        });
                    });
                }
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
                const currentList = search ? results : [...recentSearches, ...commonActions];
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
    }, [isOpen, results, selectedIndex, handleSelect, search, recentSearches, commonActions]);

    if (!isOpen) return null;

    const displayResults = search ? results : [...recentSearches, ...commonActions];

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 fill-mode-both">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
                    <div className="flex items-center border-b border-slate-100 px-4">
                        <Search className={cn("h-5 w-5", loading ? "text-indigo-500 animate-pulse" : "text-slate-400")} />
                        <input
                            autoFocus
                            className="flex h-14 w-full border-0 bg-transparent px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
                            placeholder="Find clients, leads, tasks or projects..."
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
                                <Search className="mx-auto h-8 w-8 text-slate-200 mb-4" />
                                <p className="text-sm text-slate-500 font-medium tracking-tight">No results found for "{search}"</p>
                                <p className="text-xs text-slate-400 mt-1">Check spelling or try a broader search term.</p>
                            </div>
                        ) : (
                            <div className="px-2 space-y-1">
                                {displayResults.map((item, index) => {
                                    const Icon = item.icon;
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
                                                    isSelected ? "bg-indigo-50 text-indigo-900 translate-x-1" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                )}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                onClick={() => handleSelect(item)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn(
                                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors",
                                                        isSelected ? "bg-white border-indigo-200 text-indigo-500" : "bg-white border-slate-200 text-slate-400"
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
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-white rounded-md px-2 py-1 shadow-sm">
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
