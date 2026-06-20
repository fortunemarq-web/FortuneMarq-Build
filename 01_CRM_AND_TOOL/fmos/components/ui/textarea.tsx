import * as React from "react";
import { cn } from "@/lib/cn";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-slate-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
