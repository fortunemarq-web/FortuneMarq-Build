"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Ban, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";

interface ProposalRowActionsProps {
  proposalId: string;
  proposalNumber: string | null;
  status: string | null;
  leadId: string | null;
  companyName: string | null;
}

/**
 * Edit / delete / void actions for a proposal row.
 * - draft: edit + hard delete
 * - sent: edit + void (status → rejected, kept for records)
 * - confirmed: no destructive actions
 */
export default function ProposalRowActions({ proposalId, proposalNumber, status, leadId, companyName }: ProposalRowActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const st = status || "draft";

  async function handleDelete() {
    if (!confirm(`Permanently delete ${proposalNumber || "this proposal"}? This can't be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("proposals").delete().eq("id", proposalId);
    setBusy(false);
    if (error) {
      toast.error("Could not delete proposal", error.message);
      return;
    }
    toast.success("Proposal deleted", proposalNumber || "");
    logAudit({ action: "delete", resourceType: "proposal", resourceId: proposalId, resourceLabel: `${proposalNumber} — ${companyName}`, summary: `Proposal ${proposalNumber} deleted` });
    router.refresh();
  }

  async function handleVoid() {
    if (!confirm(`Void ${proposalNumber || "this proposal"}? It stays in the list as rejected for your records.`)) return;
    setBusy(true);
    const { error } = await supabase.from("proposals").update({ status: "rejected" } as any).eq("id", proposalId);
    setBusy(false);
    if (error) {
      toast.error("Could not void proposal", error.message);
      return;
    }
    toast.success("Proposal voided", proposalNumber || "");
    logAudit({ action: "update", resourceType: "proposal", resourceId: proposalId, resourceLabel: `${proposalNumber} — ${companyName}`, newValue: { status: "rejected" }, summary: `Proposal ${proposalNumber} voided` });
    router.refresh();
  }

  if (st === "confirmed") return null;

  return (
    <div className="flex items-center gap-1">
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : (
        <>
          {leadId && (
            <Link
              href={`/admin/leads/${leadId}/proposal/new?edit=${proposalId}`}
              title="Edit proposal"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          )}
          {st === "sent" && (
            <button
              onClick={handleVoid}
              title="Void proposal"
              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          )}
          {(st === "draft" || st === "rejected") && (
            <button
              onClick={handleDelete}
              title="Delete proposal"
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
