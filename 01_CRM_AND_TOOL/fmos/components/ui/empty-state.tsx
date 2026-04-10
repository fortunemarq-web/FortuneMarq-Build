import React from "react";
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110">
                <Icon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-500">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 hover:shadow active:bg-slate-100"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
