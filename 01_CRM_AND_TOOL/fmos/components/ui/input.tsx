import * as React from "react";
import { cn } from "@/lib/cn";

export const inputClasses =
  "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-slate-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClasses, className)} {...props} />
));
Input.displayName = "Input";
