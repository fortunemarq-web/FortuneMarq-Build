"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { createLead, createTask } from "@/app/admin/actions";
import {
  UserPlus,
  CheckSquare,
  BarChart2,
  X,
  Loader2,
  Check,
} from "lucide-react";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-red-600 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ── Add Lead Modal ─────────────────────────────────────────────────────────
function AddLeadModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLead(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(onClose, 900);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Add New Lead</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              name="company_name"
              type="text"
              required
              placeholder="e.g. Sharma Dental Clinic"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="9XXXXXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Industry
              </label>
              <input
                name="industry"
                type="text"
                placeholder="e.g. Dental"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                name="city"
                type="text"
                placeholder="e.g. Hubli"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type
              </label>
              <select
                name="lead_type"
                defaultValue="outbound"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white"
              >
                <option value="outbound">⚡ Outbound</option>
                <option value="inbound">🔥 Inbound</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
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
                "✓ Lead Added!"
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Task Modal ──────────────────────────────────────────────────────
function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTask(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(onClose, 900);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Create Task</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Follow up with Sharma Dental"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Any details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white focus:ring-2 focus:ring-[#42CA80]/20 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                name="due_date"
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#42CA80] focus:bg-white"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
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
                "✓ Task Created!"
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Quick Actions Panel ────────────────────────────────────────────────────
export default function QuickActions() {
  const [activeModal, setActiveModal] = useState<
    "lead" | "task" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const buttonClass =
    "flex w-full min-h-[44px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm active:scale-[0.99]";

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => setActiveModal("lead")}
            className={buttonClass}
          >
            <UserPlus className="h-4 w-4 text-[#42CA80] flex-shrink-0" />
            Add New Lead
          </button>
          <button
            onClick={() => setActiveModal("task")}
            className={buttonClass}
          >
            <CheckSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
            Create Task
          </button>
          <Link
            href="/admin/build-tracker"
            className={`${buttonClass} no-underline`}
          >
            <BarChart2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
            View Build Tracker
          </Link>
          <Link
            href="/admin/finance/invoices/new"
            className={`${buttonClass} no-underline`}
          >
            <span className="text-base leading-none flex-shrink-0">🧾</span>
            Create Invoice
            <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-semibold">
              Phase 5
            </span>
          </Link>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "lead" && (
        <AddLeadModal
          onClose={() => {
            setActiveModal(null);
            showToast("Lead added successfully!", "success");
          }}
        />
      )}
      {activeModal === "task" && (
        <CreateTaskModal
          onClose={() => {
            setActiveModal(null);
            showToast("Task created successfully!", "success");
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
