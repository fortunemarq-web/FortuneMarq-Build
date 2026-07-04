// Post-deploy skew self-heal (the free stand-in for Vercel Skew Protection,
// which is Pro-only). A browser tab left open across a deploy can try to load a
// JS/CSS chunk or RSC payload from the OLD build that no longer exists →
// ChunkLoadError / "dynamically imported module" failure → the error boundary.
// A hard reload fetches the current build and fixes it. Call from an error
// boundary's effect. Guarded (at most once / 30s per tab) so a PERSISTENT error
// (a real bug, not skew) can't loop-reload the page.

const KEY = "fmq_stale_reload_at";

/** Returns true if it triggered a reload. */
export function recoverFromStaleAssets(error: unknown): boolean {
  const msg = (
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "")
  ).toLowerCase();

  const isStaleAsset =
    msg.includes("chunkloaderror") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("dynamically imported module") ||
    msg.includes("failed to fetch dynamically imported");

  if (!isStaleAsset) return false;

  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 30_000) {
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
      return true;
    }
  } catch {
    /* sessionStorage/window unavailable — skip auto-recovery, show the boundary */
  }
  return false;
}
