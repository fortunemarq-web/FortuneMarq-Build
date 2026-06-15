"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Ban, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";
import { promptModal } from "@/components/ui/prompt-modal";

interface AgreementRowActionsProps {
  agreementId: string;
  agreementNumber: string | null;
  status: string | null;
  companyName: string | null;
}

/**
 * Void / delete actions for an agreement row.
 * - pending: void (status → rejected) or hard delete
 * - rejected/expired: hard delete
 * - confirmed: no destructive actions (it created a client)
 */
export default function AgreementRowActions({ agreementId, agreementNumber, status, companyName }: AgreementRowActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const st = status || "pending";

  async function handleVoid() {
    const ok = await promptModal({ title: `Void ${agreementNumber || "this agreement"}?`, description: "It stays listed as rejected for your records.", confirmLabel: "Void", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, void it" }] });
    if (!ok) return;
    setBusy(true);
    const { error } = await (supabase as any).from("agreements").update({ status: "rejected" }).eq("id", agreementId);
    setBusy(false);
    if (error) {
      toast.error("Could not void agreement", error.message);
      return;
    }
    toast.success("Agreement voided", agreementNumber || "");
    logAudit({ action: "update", resourceType: "agreement", resourceId: agreementId, resourceLabel: `${agreementNumber} — ${companyName}`, newValue: { status: "rejected" }, summary: `Agreement ${agreementNumber} voided` });
    router.refresh();
  }

  async function handleDelete() {
    const ok = await promptModal({ title: `Delete ${agreementNumber || "this agreement"}?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete permanently" }] });
    if (!ok) return;
    setBusy(true);
    const { error } = await (supabase as any).from("agreements").delete().eq("id", agreementId);
    setBusy(false);
    if (error) {
      toast.error("Could not delete agreement", error.message);
      return;
    }
    toast.success("Agreement deleted", agreementNumber || "");
    logAudit({ action: "delete", resourceType: "agreement", resourceId: agreementId, resourceLabel: `${agreementNumber} — ${companyName}`, summary: `Agreement ${agreementNumber} deleted` });
    router.refresh();
  }

  if (st === "confirmed") return null;

  return (
    <div className="flex items-center gap-1">
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : (
        <>
          {st === "pending" && (
            <button
              onClick={handleVoid}
              title="Void agreement"
              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Delete agreement"
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
