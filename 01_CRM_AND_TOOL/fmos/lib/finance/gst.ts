// Single source of truth for GST math + display.
// Pure functions only (no server/client deps) so both the invoice modal and the
// server actions / PDF can share them.

export const GST_FALLBACK_RATE = 18;

/** Resolve a GST rate (percent) from settings, falling back to 18 if missing/invalid. */
export function resolveGstRate(rate?: number | null): number {
  const r = Number(rate);
  return Number.isFinite(r) && r > 0 ? r : GST_FALLBACK_RATE;
}

/** GST amount in whole rupees for a subtotal at the given rate (percent). */
export function computeGstAmount(subtotal: number, ratePercent?: number | null): number {
  return Math.round((Number(subtotal) || 0) * (resolveGstRate(ratePercent) / 100));
}

export interface GstLine {
  label: string;
  amount: number;
}

/**
 * Breakdown lines for display:
 * - intra-state  → CGST (rate/2%) + SGST (rate/2%)
 * - inter-state  → IGST (rate%)
 * The total GST amount is identical either way — only the split/labels differ.
 */
export function gstBreakdown(
  gstAmount: number,
  ratePercent: number | null | undefined,
  interstate: boolean
): GstLine[] {
  const rate = resolveGstRate(ratePercent);
  const amt = Number(gstAmount) || 0;
  if (interstate) {
    return [{ label: `IGST (${rate}%)`, amount: amt }];
  }
  const halfRate = rate / 2;
  // Split so CGST + SGST always sum to the exact GST total (one side absorbs the
  // rounding rupee for odd amounts), keeping the invoice internally consistent.
  const cgst = Math.round(amt / 2);
  const sgst = amt - cgst;
  return [
    { label: `CGST (${halfRate}%)`, amount: cgst },
    { label: `SGST (${halfRate}%)`, amount: sgst },
  ];
}
