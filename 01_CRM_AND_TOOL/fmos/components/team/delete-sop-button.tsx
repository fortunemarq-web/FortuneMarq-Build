"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSopAction } from "@/app/admin/team/actions";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";

export default function DeleteSopButton({ sopId, sopTitle }: { sopId: string; sopTitle?: string | null }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const ok = await promptModal({ title: `Delete "${sopTitle || "this SOP"}"?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteSopAction(sopId); // redirects on success
    } catch (e: any) {
      setBusy(false);
      // redirect() throws NEXT_REDIRECT — only surface real errors
      if (e?.message !== "NEXT_REDIRECT" && !String(e?.digest || "").startsWith("NEXT_REDIRECT")) {
        toast.error("Could not delete SOP", e?.message ?? "");
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Delete SOP"
      className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
    </button>
  );
}
