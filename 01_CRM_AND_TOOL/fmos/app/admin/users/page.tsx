"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    Users,
    Shield,
    Search,
    ArrowLeft,
    ShieldAlert,
    Loader2,
    CheckCircle2,
    XCircle,
    Mail,
    Calendar,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";

const ROLES = [
    { value: "admin", label: "Admin", color: "bg-red-500", desc: "Full system access" },
    { value: "manager", label: "Manager", color: "bg-indigo-500", desc: "Project & Team control" },
    { value: "strategist", label: "Strategist", color: "bg-purple-500", desc: "Strategy & Performance" },
    { value: "sales", label: "Sales", color: "bg-blue-500", desc: "Pipeline & Deals" },
    { value: "telecaller", label: "Telecaller", color: "bg-emerald-500", desc: "Calling & Follow-ups" },
    { value: "client", label: "Client", color: "bg-amber-500", desc: "Portal access only" },
    { value: "guest", label: "Guest", color: "bg-slate-500", desc: "Read-only access" },
];

export default function UserManagementPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchProfiles();
    }, []);

    async function fetchProfiles() {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error(error);
        else setProfiles(data || []);
        setLoading(false);
    }

    async function updateRole(userId: string, newRole: string, oldRole: string, fullName: string) {
        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole as any })
                .eq("id", userId);

            if (error) throw error;

            // Log Audit
            await logAudit({
                action: 'update',
                resourceType: 'profile',
                resourceId: userId,
                resourceLabel: `Changed role for ${fullName}`,
                oldValue: { role: oldRole },
                newValue: { role: newRole }
            });

            // Update local state
            setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update role");
        } finally {
            setUpdatingId(null);
        }
    }

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-1">
                        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Admin Hub</span>
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                            <Users className="h-10 w-10 text-[#42CA80]" />
                            User Access
                        </h1>
                        <p className="text-slate-500 font-medium">Manage team roles and system access permissions.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                                    </div>
                                </div>
                                <div className="h-10 w-full bg-slate-50 rounded-xl" />
                            </div>
                        ))
                    ) : filteredProfiles.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <ShieldAlert className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest">No users found</p>
                        </div>
                    ) : (
                        filteredProfiles.map((profile) => (
                            <div key={profile.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
                                {/* Role Background Glow */}
                                <div className={clsx(
                                    "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity rounded-full",
                                    ROLES.find(r => r.value === profile.role)?.color || "bg-slate-500"
                                )} />

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-black/10 border-2 border-white">
                                            {profile.full_name?.charAt(0) || <Users className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg leading-tight">{profile.full_name || 'Anonymous'}</h3>
                                            <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                                <Mail className="h-3 w-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{profile.email?.split('@')[0] || 'no-email'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                        <Shield className="h-3 w-3" /> System Role
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={profile.role || 'guest'}
                                            disabled={updatingId === profile.id}
                                            onChange={(e) => updateRole(profile.id, e.target.value, profile.role, profile.full_name)}
                                            className={clsx(
                                                "w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black appearance-none outline-none focus:ring-4 transition-all cursor-pointer",
                                                updatingId === profile.id ? "opacity-50" : "hover:bg-white hover:border-slate-200 focus:bg-white"
                                            )}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {updatingId === profile.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            ) : (
                                                <ArrowRight className="h-4 w-4 text-slate-300" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Created</p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                {new Date(profile.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Status</p>
                                            {profile.is_active === false ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                                                    <XCircle className="h-3 w-3" /> Inactive
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Legend */}
                <div className="mt-12 p-8 bg-white rounded-[3rem] border border-slate-200">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Role Reference Guide
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ROLES.map(r => (
                            <div key={r.value} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className={clsx("w-2 h-2 rounded-full", r.color)} />
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{r.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium pl-4">{r.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
