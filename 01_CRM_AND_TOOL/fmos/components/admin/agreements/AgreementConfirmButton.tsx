"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { useRouter } from "next/navigation";

export default function AgreementConfirmButton({ agreementId, clientName }: { agreementId: string; clientName: string }) {
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  const handleConfirm = async () => {
    const ok = await promptModal({
      title: "Confirm Agreement",
      description: `Mark this agreement as confirmed by ${clientName}? This records the agreement as signed and agreed.`,
      confirmLabel: "Mark as Confirmed",
      type: "select",
      options: [{ value: "confirm", label: `Yes, ${clientName} has confirmed` }],
    });
    if (!ok) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("agreements")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", agreementId);

      if (error) {
        toast.error("Failed to confirm agreement", error.message);
      } else {
        toast.success("Agreement confirmed", `${clientName} — status updated.`);
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-deep hover:bg-brand-active text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
      Mark as Confirmed
    </button>
  );
}
