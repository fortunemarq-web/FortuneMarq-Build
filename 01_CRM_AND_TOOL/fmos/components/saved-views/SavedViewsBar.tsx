"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    ListFilter,
    Save,
    Trash2,
    Check,
    Plus,
    Settings,
    MoreVertical,
    Undo2,
    Copy,
    LayoutTemplate,
} from "lucide-react";
import type { SavedView, EntityType, FilterConfig, SortConfig } from "@/types/view";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";

interface SavedViewsBarProps {
    entityType: EntityType;
    currentFilters: FilterConfig;
    currentSort: SortConfig;
    onViewSelect: (view: SavedView) => void;
    onReset: () => void;
    className?: string;
    userId?: string; // Optional: used to check ownership
}

export default function SavedViewsBar({
    entityType,
    currentFilters,
    currentSort,
    onViewSelect,
    onReset,
    className,
    userId,
}: SavedViewsBarProps) {
    const [views, setViews] = useState<SavedView[]>([]);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newViewName, setNewViewName] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch views
    useEffect(() => {
        fetchViews();
    }, [entityType]);

    const fetchViews = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("saved_views")
            .select("*")
            .eq("entity_type", entityType)
            .order("name");

        if (!error && data) {
            setViews(data as unknown as SavedView[]);

            // Load default view if no view is active? 
            // This logic might conflict with url params, so let parent handle defaults mostly.
            const defaultView = data.find((v: any) => v.is_default && (v.owner_id === userId || v.visibility === 'global'));
            if (defaultView && !activeViewId) {
                // Optionally set default here, but beware of loops
            }
        }
        setIsLoading(false);
    };

    const handleSelectView = (view: SavedView) => {
        setActiveViewId(view.id);
        onViewSelect(view);
        setShowDropdown(false);
    };

    const handleCreateView = async () => {
        if (!newViewName.trim()) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const newView = {
            name: newViewName,
            entity_type: entityType,
            owner_id: user.id,
            visibility: 'private', // Default to private
            filters: currentFilters,
            sort: currentSort,
            columns: {}, // Add columns support later if needed
        };

        const { data, error } = await supabase
            .from("saved_views")
            // filters/sort are typed configs (JSON-serializable) that don't satisfy
            // the generated Json index-signature; cast the payload narrowly.
            .insert(newView as any)
            .select()
            .single();

        if (error) {
            toast.error("Error saving view");
            console.error(error);
        } else {
            const savedData = data as any;
            setViews([...views, savedData as SavedView]);
            setActiveViewId(savedData.id);
            setShowSaveModal(false);
            setNewViewName("");
        }
    };

    const handleUpdateView = async () => {
        if (!activeViewId) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("saved_views")
            .update({
                filters: currentFilters,
                sort: currentSort,
                updated_at: new Date().toISOString(),
            } as any)
            .eq("id", activeViewId);

        if (error) {
            toast.error("Error updating view", "You may not have permission.");
        } else {
            // Update local state
            setViews(views.map(v => v.id === activeViewId ? { ...v, filters: currentFilters, sort: currentSort } : v));
            toast.success("View updated");
        }
    };

    const handleDeleteView = async (id: string) => {
        const ok = await promptModal({ title: "Delete this view?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
        if (!ok) return;

        const supabase = createClient();
        const { error } = await supabase.from("saved_views").delete().eq("id", id);

        if (error) {
            toast.error("Error deleting view");
        } else {
            setViews(views.filter(v => v.id !== id));
            if (activeViewId === id) {
                setActiveViewId(null);
                onReset();
            }
        }
    };

    const activeViewObj = views.find(v => v.id === activeViewId);
    const canModify = activeViewObj ? (activeViewObj.owner_id === userId || (activeViewObj.visibility === 'global' /* && isAdmin */)) : false;

    return (
        <div className={clsx("flex items-center gap-2 mb-4 flex-wrap", className)}>
            {/* Views Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                    <ListFilter className="h-4 w-4 text-slate-500" />
                    <span className="max-w-[150px] truncate">
                        {activeViewObj ? activeViewObj.name : "All Records"}
                    </span>
                    <Plus className="h-3 w-3 text-slate-500" />
                </button>

                {showDropdown && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-line bg-surface py-1 shadow-md">
                        <button
                            onClick={() => {
                                setActiveViewId(null);
                                onReset();
                                setShowDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        >
                            All Records (Reset)
                        </button>
                        <div className="my-1 border-t border-line" />
                        {isLoading ? (
                            <div className="px-4 py-2 text-xs text-slate-500">Loading...</div>
                        ) : views.length > 0 ? (
                            views.map((view) => (
                                <div key={view.id} className="group flex items-center justify-between hover:bg-slate-50 pr-2">
                                    <button
                                        onClick={() => handleSelectView(view)}
                                        className={clsx(
                                            "flex-1 px-4 py-2 text-left text-sm",
                                            view.id === activeViewId ? "text-brand-deep font-medium" : "text-slate-900"
                                        )}
                                    >
                                        {view.name}
                                        {view.visibility === "global" && <span className="ml-2 text-[11px] bg-info-soft text-info px-1 rounded">Global</span>}
                                    </button>
                                    {/* View Actions: only show if owner */}
                                    {view.owner_id === userId && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteView(view.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-danger"
                                            title="Delete view"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-xs text-slate-500">No saved views</div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Actions */}
            <div className="flex items-center gap-1">
                {activeViewId && canModify ? (
                    <button
                        onClick={handleUpdateView}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        title="Save changes to current view"
                    >
                        <Save className="h-4 w-4" />
                    </button>
                ) : null}

                <button
                    onClick={() => {
                        setShowDropdown(false);
                        setShowSaveModal(true);
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    title="Save as new view"
                >
                    {activeViewId ? <Copy className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </button>
            </div>

            {/* Save As Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4 shadow-lg">
                        <h3 className="mb-4 font-display font-semibold text-slate-900">Save View</h3>
                        <input
                            type="text"
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="View Name (e.g. 'Hot Leads Today')"
                            className="w-full rounded-lg border border-line bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-line focus:outline-none"
                            autoFocus
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateView}
                                disabled={!newViewName.trim()}
                                className="rounded-lg bg-brand-deep px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-deeper disabled:opacity-50"
                            >
                                Save View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
