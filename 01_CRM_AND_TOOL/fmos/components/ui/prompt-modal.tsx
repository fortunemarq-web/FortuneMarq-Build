"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

// Zero-dependency modal store, same pattern as toast.tsx.
// `await promptModal({...})` works from any client component and
// resolves to the entered value, or null if the user cancels.
// <PromptHost /> (mounted once in the root layout) renders the modal.

export interface PromptConfig {
  title: string;
  description?: string;
  type?: "text" | "select" | "date" | "textarea";
  options?: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface ActivePrompt extends PromptConfig {
  resolve: (value: string | null) => void;
}

type Listener = (active: ActivePrompt | null) => void;

let active: ActivePrompt | null = null;
let listeners: Listener[] = [];

function emit() {
  listeners.forEach((l) => l(active));
}

export function promptModal(config: PromptConfig): Promise<string | null> {
  return new Promise((resolve) => {
    // If a prompt is already open, cancel it first
    if (active) active.resolve(null);
    active = { ...config, resolve };
    emit();
  });
}

function settle(value: string | null) {
  if (!active) return;
  const { resolve } = active;
  active = null;
  emit();
  resolve(value);
}

export function PromptHost() {
  const [current, setCurrent] = useState<ActivePrompt | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const listener: Listener = (next) => {
      setCurrent(next);
      setValue(next?.defaultValue ?? (next?.type === "select" ? next.options?.[0]?.value ?? "" : ""));
    };
    listeners.push(listener);
    listener(active);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  if (!current) return null;

  const type = current.type ?? "text";
  const canConfirm = value.trim().length > 0;

  const confirm = () => {
    if (!canConfirm) return;
    settle(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) settle(null);
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{current.title}</h3>
            {current.description && (
              <p className="mt-1 text-sm text-slate-500">{current.description}</p>
            )}
          </div>
          <button
            onClick={() => settle(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
        >
          {type === "select" ? (
            <select
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            >
              {(current.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current.placeholder}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
          ) : (
            <input
              autoFocus
              type={type === "date" ? "date" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current.placeholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => settle(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
                current.destructive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-brand-deep hover:bg-brand-deep/90"
              )}
            >
              {current.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
