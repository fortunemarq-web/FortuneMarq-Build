import React from "react";
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    category?: "revenue" | "volume" | "pipeline" | "performance" | "warning" | "default";
    delta?: {
        value: string | number;
        isPositive: boolean;
        label?: string;
    };
    className?: string;
}

export function KpiCard({
    title,
    value,
    icon: Icon,
    subtitle,
    category = "default",
    delta,
    className,
}: KpiCardProps) {
    const borderColors = {
        revenue: "border-[#42CA80]",
        volume: "border-blue-400",
        pipeline: "border-amber-400",
        performance: "border-purple-400",
        warning: "border-red-400",
        default: "border-slate-300",
    };

    const iconColors = {
        revenue: "bg-emerald-50 text-emerald-600",
        volume: "bg-blue-50 text-blue-600",
        pipeline: "bg-amber-50 text-amber-600",
        performance: "bg-purple-50 text-purple-600",
        warning: "bg-red-50 text-red-600",
        default: "bg-slate-50 text-slate-600",
    };

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-default border-t-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
            borderColors[category],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        {title}
                    </p>
                    <div className="mt-2 flex flex-col">
                        <h3 className="text-4xl font-mono font-bold tabular-nums tracking-tight text-slate-900">
                            {value}
                        </h3>

                        {/* Delta Indicator */}
                        <div className="mt-1 flex items-center gap-1">
                            {delta ? (
                                <>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        delta.isPositive ? "text-emerald-600" : "text-red-500"
                                    )}>
                                        {delta.isPositive ? "↑" : "↓"} {delta.value}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {delta.label || "vs last period"}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs font-medium text-slate-400">
                                    ↑ — vs last period
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                    iconColors[category]
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {subtitle && (
                <p className="mt-4 text-xs font-medium text-slate-400 italic">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
