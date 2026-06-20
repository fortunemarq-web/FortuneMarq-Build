import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60 p-12 text-center",
                className
            )}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface">
                <Icon className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mt-4 font-display text-[15px] font-semibold text-slate-900">
                {title}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">{description}</p>
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={buttonVariants({ variant: "secondary", className: "mt-5" })}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
