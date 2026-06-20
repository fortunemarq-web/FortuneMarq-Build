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
    Calendar
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ROLES = [
    { value: "admin", label: "Admin", desc: "Full system access" },
    { value: "manager", label: "Manager", desc: "Project & Team control" },
    { value: "strategist", label: "Strategist", desc: "Strategy & Performance" },
    { value: "sales", label: "Sales", desc: "Pipeline & Deals" },
    { value: "telecaller", label: "Telecaller", desc: "Calling & Follow-ups" },
    { value: "client", label: "Client", desc: "Portal access only" },
    { value: "guest", label: "Guest", desc: "Read-only access" },
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
        <div className="min-h-full bg-canvas p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <Link href="/admin" className="mb-4 flex items-center gap-2 text-slate-400 transition-colors hover:text-brand-deep">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Admin Hub</span>
                        </Link>
                        <h1 className="flex items-center gap-3 font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                            <Users className="h-7 w-7 text-brand-deep" />
                            User Access
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">Manage team roles and system access permissions.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse space-y-4 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 rounded bg-slate-100" />
                                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                                    </div>
                                </div>
                                <div className="h-10 w-full rounded-lg bg-slate-50" />
                            </Card>
                        ))
                    ) : filteredProfiles.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-dashed border-line bg-slate-50/60 py-20 text-center">
                            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">No users found</p>
                        </div>
                    ) : (
                        filteredProfiles.map((profile) => (
                            <Card key={profile.id} className="group p-6 transition-all hover:border-line-strong hover:shadow-md">
                                <div className="mb-6 flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 text-xl font-semibold text-white">
                                            {profile.full_name?.charAt(0) || <Users className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-display text-lg font-semibold leading-tight text-slate-900">{profile.full_name || 'Anonymous'}</h3>
                                            <div className="mt-1 flex items-center gap-1.5 text-slate-400">
                                                <Mail className="h-3 w-3" />
                                                <span className="text-[11px] font-medium">{profile.email?.split('@')[0] || 'no-email'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        <Shield className="h-3 w-3" /> System Role
                                    </div>

                                    <div className="relative">
                                        <Select
                                            value={profile.role || 'guest'}
                                            disabled={updatingId === profile.id}
                                            onChange={(e) => updateRole(profile.id, e.target.value, profile.role, profile.full_name)}
                                            className={clsx(
                                                "h-11 font-semibold",
                                                updatingId === profile.id && "opacity-50"
                                            )}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </Select>
                                        {updatingId === profile.id && (
                                            <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="rounded-lg border border-line bg-slate-50 p-3">
                                            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Created</p>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                <span className="tabular-nums">{new Date(profile.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-line bg-slate-50 p-3">
                                            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Status</p>
                                            {profile.is_active === false ? (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-danger">
                                                    <XCircle className="h-3 w-3" /> Inactive
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-brand-deep">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Legend */}
                <Card className="mt-12 p-8">
                    <h4 className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <ShieldAlert className="h-4 w-4" /> Role Reference Guide
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {ROLES.map(r => (
                            <div key={r.value} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-brand" />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-900">{r.label}</span>
                                </div>
                                <p className="pl-4 text-[11px] font-medium text-slate-500">{r.desc}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
