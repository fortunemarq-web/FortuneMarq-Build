"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";

// Zero-dependency toast store. `toast.success(...)` works from any
// client component; <Toaster /> (mounted once in the root layout)
// renders the queue.

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((l) => l(toasts));
}

function push(kind: ToastKind, title: string, body?: string) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, title, body }];
  emit();
  // Errors stay longer so users can actually read what went wrong
  const ttl = kind === "error" ? 8000 : 4000;
  setTimeout(() => dismiss(id), ttl);
  return id;
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, body?: string) => push("success", title, body),
  error: (title: string, body?: string) => push("error", title, body),
  info: (title: string, body?: string) => push("info", title, body),
};

const KIND_STYLES: Record<ToastKind, { wrap: string; icon: typeof Info }> = {
  success: { wrap: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CheckCircle2 },
  error: { wrap: "border-red-200 bg-red-50 text-red-900", icon: AlertTriangle },
  info: { wrap: "border-slate-200 bg-white text-slate-900", icon: Info },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setItems(next);
    listeners.push(listener);
    listener(toasts);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 print:hidden">
      {items.map((t) => {
        const { wrap, icon: Icon } = KIND_STYLES[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={clsx(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in",
              wrap
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs opacity-80 break-words">{t.body}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
