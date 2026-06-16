"use server";

import fs from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase-admin";
import { parseReportFilename } from "@/lib/whatsapp/report-lookup";

/**
 * One-time (idempotent) seeder for the market-intel report library.
 *
 * Uploads the 75 PDFs from 07_DATA_AND_RESEARCH/PDF_Generator/output/<City>/ to a
 * public Supabase Storage bucket, then registers each in report_assets keyed by
 * (city, niche_slug, lead_type, lang) → public_url. The Curiosity Batch-Send resolves
 * the matching PDF from this table and attaches it as the template's document header.
 *
 * Run locally (the PDFs live in the repo, not on Vercel). Override the source dir with
 * REPORT_PDF_SOURCE_DIR. Re-runnable: storage upserts, registry upserts on the unique key.
 */

const BUCKET = "market-reports";

export interface SeedReportResult {
  success: boolean;
  uploaded: number;
  registered: number;
  skipped: number;
  errors: string[];
}

export async function seedReportAssets(): Promise<SeedReportResult> {
  const supabase = createAdminClient() as any;
  const errors: string[] = [];
  let uploaded = 0;
  let registered = 0;
  let skipped = 0;

  // Ensure the public bucket exists.
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === BUCKET)) {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (error && !/already exists/i.test(error.message)) errors.push(`bucket: ${error.message}`);
    }
  } catch (e: any) {
    errors.push(`bucket: ${e?.message || e}`);
  }

  const baseDir =
    process.env.REPORT_PDF_SOURCE_DIR ||
    path.resolve(process.cwd(), "../../07_DATA_AND_RESEARCH/PDF_Generator/output");

  let cityDirs: string[];
  try {
    cityDirs = (await fs.readdir(baseDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch (e: any) {
    return { success: false, uploaded, registered, skipped, errors: [`read base dir (${baseDir}) failed: ${e?.message || e}`] };
  }

  for (const cityDir of cityDirs) {
    const dir = path.join(baseDir, cityDir);
    let files: string[];
    try {
      files = (await fs.readdir(dir)).filter((f) => /\.pdf$/i.test(f));
    } catch {
      continue;
    }
    for (const filename of files) {
      const parsed = parseReportFilename(filename);
      if (!parsed) {
        skipped++;
        continue;
      }
      const storagePath = `${cityDir}/${filename}`;
      try {
        const buf = await fs.readFile(path.join(dir, filename));
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });
        if (upErr) {
          errors.push(`${filename}: upload ${upErr.message}`);
          continue;
        }
        uploaded++;

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const public_url: string = pub?.publicUrl;

        const { error: insErr } = await supabase.from("report_assets").upsert(
          {
            city: parsed.city,
            niche_slug: parsed.niche_slug,
            lead_type: parsed.lead_type,
            lang: parsed.lang,
            filename,
            public_url,
          },
          { onConflict: "city,niche_slug,lead_type,lang" }
        );
        if (insErr) {
          errors.push(`${filename}: register ${insErr.message}`);
          continue;
        }
        registered++;
      } catch (e: any) {
        errors.push(`${filename}: ${e?.message || e}`);
      }
    }
  }

  return { success: errors.length === 0, uploaded, registered, skipped, errors: errors.slice(0, 25) };
}
