import * as React from "react";
import { cn } from "@/lib/cn";

/** The five tones — the ONLY status colors in the app. Map every status here. */
export type Tone = "neutral" | "brand" | "info" | "warning" | "danger";

const SOFT: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-brand-soft text-brand-deep",
  info: "bg-info-soft text-info",
  warning: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

const OUTLINE: Record<Tone, string> = {
  neutral: "border border-line text-slate-600",
  brand: "border border-brand-line text-brand-deep",
  info: "border border-info-line text-info",
  warning: "border border-warn-line text-warn",
  danger: "border border-danger-line text-danger",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand",
  info: "bg-info",
  warning: "bg-warn",
  danger: "bg-danger",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: "soft" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  variant = "soft",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        variant === "soft" ? SOFT[tone] : OUTLINE[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}
