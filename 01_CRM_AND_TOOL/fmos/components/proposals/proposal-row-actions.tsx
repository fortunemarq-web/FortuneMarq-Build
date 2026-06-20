"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Ban, Loader2, FileSignature, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSendAgreement}
            title="Send Agreement via WhatsApp"
            className="h-7 w-7 text-brand-deep hover:bg-brand-soft hover:text-brand-deep"
          >
            <FileSignature className="h-3.5 w-3.5" />
          </Button>
        )
      )}

      {/* Issue Invoice — available on sent proposals with no confirmed agreement yet */}
      {st === "sent" && (
        invBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleIssueInvoice}
            title="Issue Advance Invoice"
            className="h-7 w-7 text-info hover:bg-info-soft hover:text-info"
          >
            <Receipt className="h-3.5 w-3.5" />
          </Button>
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
              className={buttonVariants({ variant: "ghost", size: "icon", className: "h-7 w-7 text-slate-400 hover:text-slate-700" })}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          )}
          {st === "sent" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoid}
              title="Void proposal"
              className="h-7 w-7 text-warn hover:bg-warn-soft hover:text-warn"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
          {(st === "draft" || st === "rejected") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Delete proposal"
              className="h-7 w-7 text-slate-300 hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
