"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Ban, Loader2, FileSignature, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";
import { promptModal } from "@/components/ui/prompt-modal";
import { sendAgreementWA } from "@/actions/send-agreement-wa";
import { issueInvoice } from "@/actions/issue-invoice";

interface ProposalRowActionsProps {
  proposalId: string;
  proposalNumber: string | null;
  status: string | null;
  leadId: string | null;
  companyName: string | null;
  totalAmount?: number;
}

/**
 * Edit / delete / void actions for a proposal row.
 * - draft: edit + hard delete
 * - sent: edit + void (status → rejected, kept for records)
 * - confirmed: no destructive actions
 */
export default function ProposalRowActions({ proposalId, proposalNumber, status, leadId, companyName, totalAmount }: ProposalRowActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [agrBusy, setAgrBusy] = useState(false);
  const [invBusy, setInvBusy] = useState(false);
  const st = status || "draft";

  async function handleSendAgreement() {
    setAgrBusy(true);
    const result = await sendAgreementWA(proposalId);
    setAgrBusy(false);
    if (result.ok) {
      toast.success("Agreement sent", `WhatsApp sent to ${companyName}`);
      logAudit({ action: "update", resourceType: "proposal", resourceId: proposalId, resourceLabel: `${proposalNumber} — ${companyName}`, summary: `Agreement sent via WhatsApp` });
      router.refresh();
    } else {
      toast.error("Agreement send failed", result.error || "Unknown error");
    }
  }

  async function handleIssueInvoice() {
    const amtStr = await promptModal({
      title: "Issue Advance Invoice",
      description: `Enter the invoice amount (INR, excl. GST). GST 18% will be added automatically. Suggested: ₹${(totalAmount ?? 0).toLocaleString("en-IN")} setup fee`,
      confirmLabel: "Create & Send",
      type: "text",
      defaultValue: String(totalAmount ?? ""),
    });
    if (!amtStr) return;
    const subtotal = Number(String(amtStr).replace(/[^0-9.]/g, ""));
    if (!subtotal || subtotal <= 0) { toast.error("Invalid amount", "Enter a positive number"); return; }

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    setInvBusy(true);
    const result = await issueInvoice({ leadId: leadId || undefined, subtotal, notes: `Advance Payment — ${proposalNumber || "Proposal"}`, dueDate, revenueType: "advance", sendWA: true });
    setInvBusy(false);
    if (result.ok) {
      toast.success("Invoice issued", `${result.invoiceNumber} sent via WhatsApp`);
      logAudit({ action: "create", resourceType: "invoice", resourceId: result.invoiceId || "", resourceLabel: result.invoiceNumber || "", summary: `Advance invoice ${result.invoiceNumber} issued for ${companyName}` });
    } else {
      toast.error("Invoice creation failed", result.error || "Unknown error");
    }
  }

  async function handleDelete() {
    const ok = await promptModal({ title: `Delete ${proposalNumber || "this proposal"}?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete permanently" }] });
    if (!ok) return;
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
    const ok = await promptModal({ title: `Void ${proposalNumber || "this proposal"}?`, description: "It stays in the list as rejected for your records.", confirmLabel: "Void", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, void it" }] });
    if (!ok) return;
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

  return (
    <div className="flex items-center gap-1">
      {/* Send Agreement — available on sent proposals */}
      {st === "sent" && (
        agrBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : (
          <button
            onClick={handleSendAgreement}
            title="Send Agreement via WhatsApp"
            className="p-1.5 text-[#1E7A4F] hover:bg-green-50 rounded-lg transition-colors"
          >
            <FileSignature className="h-3.5 w-3.5" />
          </button>
        )
      )}

      {/* Issue Invoice — available on sent proposals with no confirmed agreement yet */}
      {st === "sent" && (
        invBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : (
          <button
            onClick={handleIssueInvoice}
            title="Issue Advance Invoice"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
          </button>
        )
      )}

      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : (
        <>
          {leadId && st !== "confirmed" && (
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
