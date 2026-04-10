"use client";

import { useState } from "react";
import { resetDatabase } from "@/actions/reset-database";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function DataResetButton() {
    const [status, setStatus] = useState<"idle" | "confirming" | "resetting" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        setStatus("resetting");
        const result = await resetDatabase();
        if (result.success) {
            setStatus("success");
            setMessage(result.message);
        } else {
            setStatus("error");
            setMessage(result.message);
        }
    };

    if (status === "confirming") {
        return (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 animate-in fade-in zoom-in duration-200">
                <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" /> Are you absolutely sure?
                </h3>
                <p className="text-xs text-red-300 mb-4">
                    This will permanently delete ALL leads, market insights, and upload history. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        Yes, Wipe Everything
                    </button>
                    <button
                        onClick={() => setStatus("idle")}
                        className="px-4 py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (status === "resetting") {
        return (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-sm font-bold cursor-wait">
                <Loader2 className="h-4 w-4 animate-spin" />
                Wiping Data...
            </button>
        );
    }

    if (status === "success") {
        return (
            <div className="flex items-center gap-2 text-green-400 font-bold text-sm bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                <span>✓ {message}</span>
                <button onClick={() => setStatus("idle")} className="ml-2 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => setStatus("confirming")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-900/30 text-red-500 hover:bg-red-950/30 hover:border-red-500/50 rounded-lg text-sm font-bold transition-all"
            >
                <Trash2 className="h-4 w-4" />
                Reset / Wipe All Data
            </button>
            {status === "error" && <p className="mt-2 text-xs text-red-400">Error: {message}</p>}
        </div>
    );
}
