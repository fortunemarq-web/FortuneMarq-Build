"use client";

import { useState, useTransition, useRef } from "react";
import { addModule } from "@/app/admin/build-tracker/actions";
import { X, Plus, Loader2 } from "lucide-react";

interface AddModuleModalProps {
  systemId: number;
  systemName: string;
}

export default function AddModuleModal({
  systemId,
  systemName,
}: AddModuleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("system_id", String(systemId));
    formData.set("system_name", systemName);

    startTransition(async () => {
      const result = await addModule(formData);
      if (result.success) {
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 800);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-[#42CA80] hover:bg-emerald-50 hover:text-[#42CA80]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Module
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Module
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{systemName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Module Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="module_name"
                  type="text"
                  required
                  placeholder="e.g. Client Invoice Page"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Any context or blockers..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400 resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#42CA80] py-2.5 text-sm font-bold text-white hover:bg-[#38b571] transition-colors disabled:opacity-70"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    "✓ Added!"
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Module
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
