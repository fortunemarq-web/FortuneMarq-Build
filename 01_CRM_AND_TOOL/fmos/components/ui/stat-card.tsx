import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Small line under the value. Plain text or a delta via `delta`. */
  hint?: React.ReactNode;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  className?: string;
}

const DELTA_COLOR = {
  up: "text-brand-deep",
  down: "text-danger",
  neutral: "text-slate-500",
} as const;

const DELTA_ARROW = { up: "▲", down: "▼", neutral: "•" } as const;

/**
 * KPI card. One accent only — colour appears on the delta, never as a per-card
 * top border. Numbers are tabular DM Sans.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
      </div>
      <div
        className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-slate-900"
        data-numeric
      >
        {value}
      </div>
      {(delta || hint) && (
        <div className="mt-1 text-xs text-slate-500">
          {delta && (
            <span className={cn("font-semibold", DELTA_COLOR[delta.direction])}>
              {DELTA_ARROW[delta.direction]} {delta.value}
            </span>
          )}
          {delta && hint ? " " : null}
          {hint}
        </div>
      )}
    </div>
  );
}
