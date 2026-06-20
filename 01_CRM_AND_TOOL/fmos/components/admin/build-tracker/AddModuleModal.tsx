"use client";

import { useState, useTransition, useRef } from "react";
import { addModule } from "@/app/admin/build-tracker/actions";
import { X, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-brand-line hover:bg-brand-soft hover:text-brand-deep"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Module
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
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
                <Label htmlFor="module_name">
                  Module Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="module_name"
                  name="module_name"
                  type="text"
                  required
                  placeholder="e.g. Client Invoice Page"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" defaultValue="medium">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">
                  Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Any context or blockers..."
                />
              </div>

              {error && (
                <p className="text-xs text-danger font-medium">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Module
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
