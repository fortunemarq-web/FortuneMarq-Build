"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Shield, KeyRound, Ban, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { updateMemberRole, resetMemberPassword, setMemberActive, removeMember } from "@/app/admin/team/user-actions";
import { promptModal } from "@/components/ui/prompt-modal";
import { toast } from "@/components/ui/toast";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "pm", label: "Project Manager" },
  { value: "strategist", label: "Strategist" },
  { value: "telecaller", label: "Telecaller" },
  { value: "staff", label: "Staff" },
];

export default function MemberMenu({ profile }: { profile: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = profile.is_active !== false;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.success) {
      toast.success(okMsg);
      router.refresh();
    } else {
      toast.error("Action failed", res.error);
    }
  };

  const handleChangeRole = async () => {
    setOpen(false);
    const role = await promptModal({
      title: `Change role — ${profile.full_name}`,
      type: "select",
      options: ROLE_OPTIONS,
      defaultValue: profile.role,
      confirmLabel: "Change Role",
    });
    if (!role || role === profile.role) return;
    await run(() => updateMemberRole(profile.id, role), `${profile.full_name} is now ${role}`);
  };

  const handleResetPassword = async () => {
    setOpen(false);
    const pw = await promptModal({
      title: `Reset password — ${profile.full_name}`,
      description: "Minimum 8 characters. Share it with them securely.",
      type: "text",
      placeholder: "New password",
      confirmLabel: "Reset",
    });
    if (!pw) return;
    if (pw.length < 8) {
      toast.error("Password too short", "Minimum 8 characters.");
      return;
    }
    await run(() => resetMemberPassword(profile.id, pw), "Password updated");
  };

  const handleToggleActive = async () => {
    setOpen(false);
    if (isActive) {
      const reason = await promptModal({
        title: `Deactivate ${profile.full_name}?`,
        description: "They will be blocked from signing in until reactivated. Type DEACTIVATE to confirm.",
        type: "text",
        placeholder: "DEACTIVATE",
        confirmLabel: "Deactivate",
        destructive: true,
      });
      if (reason !== "DEACTIVATE") return;
    }
    await run(
      () => setMemberActive(profile.id, !isActive),
      isActive ? `${profile.full_name} deactivated` : `${profile.full_name} reactivated`
    );
  };

  const handleRemove = async () => {
    setOpen(false);
    const confirmText = await promptModal({
      title: `Remove ${profile.full_name}?`,
      description: "Deletes their login permanently. Their past activity stays in the audit log. Type REMOVE to confirm.",
      type: "text",
      placeholder: "REMOVE",
      confirmLabel: "Remove Member",
      destructive: true,
    });
    if (confirmText !== "REMOVE") return;
    await run(() => removeMember(profile.id), `${profile.full_name} removed`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
        aria-label="Member actions"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-slate-200 bg-surface p-1.5 shadow-xl">
          <button onClick={handleChangeRole} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Shield className="h-4 w-4 text-slate-400" /> Change Role
          </button>
          <button onClick={handleResetPassword} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
            <KeyRound className="h-4 w-4 text-slate-400" /> Reset Password
          </button>
          <button onClick={handleToggleActive} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
            {isActive
              ? <><Ban className="h-4 w-4 text-amber-500" /> Deactivate</>
              : <><RotateCcw className="h-4 w-4 text-emerald-500" /> Reactivate</>}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={handleRemove} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Remove Member
          </button>
        </div>
      )}
    </div>
  );
}
