"use client";

import { useEffect } from "react";
import { recoverFromStaleAssets } from "@/lib/stale-asset-recovery";

// Catches errors thrown in the root layout itself (where app/error.tsx cannot
// render). Must provide its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Post-deploy skew: hard-reload once on a stale-asset error to pull the new build.
    recoverFromStaleAssets(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0e100f" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem", background: "#0e100f" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#f4f5f0" }}>Something went wrong</h1>
          <p style={{ marginTop: 8, fontSize: "0.875rem", color: "#a4a69d", maxWidth: 380 }}>
            The app hit an unexpected error while loading. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 24, borderRadius: 8, background: "#1aa867", color: "#fff", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
          {error?.digest && <p style={{ marginTop: 16, fontSize: 11, color: "#8b8d85" }}>Ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
