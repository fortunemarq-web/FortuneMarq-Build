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
    // Single brand accent — KPI cards never use colored top-borders or a rainbow per-category palette.
    const iconClass = category === "warning"
        ? "bg-danger-soft text-danger"
        : "bg-brand-soft text-brand-deep";

    return (
        <div className={cn(
            "group rounded-xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-line-strong cursor-default",
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {title}
                    </p>
                    <div className="mt-2 flex flex-col">
                        <h3 className="text-4xl font-display font-semibold tabular-nums tracking-tight text-slate-900">
                            {value}
                        </h3>

                        {/* Delta Indicator */}
                        <div className="mt-1 flex items-center gap-1">
                            {delta ? (
                                <>
                                    <span className={cn(
                                        "text-xs font-medium tabular-nums",
                                        delta.isPositive ? "text-brand-deep" : "text-danger"
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
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    iconClass
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
