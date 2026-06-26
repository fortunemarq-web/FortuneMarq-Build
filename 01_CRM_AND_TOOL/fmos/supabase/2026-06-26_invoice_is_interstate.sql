-- Inter-state GST (IGST) support on invoices.
-- Intra-state (Karnataka) invoices keep CGST+SGST; inter-state invoices show IGST.
-- The total GST is unchanged (same rate) — this only drives the split/labels + the GST report.
-- Run in the Supabase SQL editor before merging the place-of-supply change.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS is_interstate boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN invoices.is_interstate IS
  'true = inter-state supply (IGST); false = intra-state (CGST+SGST). Place of supply for GST.';
