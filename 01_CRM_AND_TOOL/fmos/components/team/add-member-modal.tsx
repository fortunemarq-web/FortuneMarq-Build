"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { inviteTeamMember } from "@/app/admin/team/user-actions";
import { toast } from "@/components/ui/toast";

const ROLES = [
  { value: "telecaller", label: "Telecaller" },
  { value: "strategist", label: "Strategist" },
  { value: "pm", label: "Project Manager" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export default function AddMemberModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "telecaller",
    password: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || form.password.length < 8) return;
    setIsSaving(true);
    const res = await inviteTeamMember(form);
    setIsSaving(false);
    if (res.success) {
      toast.success("Member added", `${form.full_name} can now sign in.`);
      onClose();
      router.refresh();
    } else {
      toast.error("Could not add member", res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Add Team Member</h2>
              <p className="text-xs font-medium text-slate-400">Creates their login instantly — no email invite needed.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              autoFocus
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Afifa"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@fmos.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Temp Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:border-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.full_name || !form.email || form.password.length < 8}
              className="flex items-center gap-2 rounded-xl bg-brand-deep px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
