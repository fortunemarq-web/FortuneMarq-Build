import * as React from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md";
}

/** Segmented control. One look for every in-page tab switch. */
export function Tabs({ tabs, value, onValueChange, className, size = "md" }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1", className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3 py-1.5 text-sm",
              active
                ? "bg-surface text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-slate-100 text-slate-600" : "bg-slate-200/70 text-slate-500"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
