"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSopAction } from "@/app/admin/team/actions";
import { toast } from "@/components/ui/toast";

export default function DeleteSopButton({ sopId, sopTitle }: { sopId: string; sopTitle?: string | null }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${sopTitle || "this SOP"}"? This can't be undone.`)) return;
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
