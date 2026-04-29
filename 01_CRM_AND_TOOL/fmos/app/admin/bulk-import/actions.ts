"use server";

import * as fs from "fs";
import * as path from "path";
import { uploadLeads, type UploadLeadParams } from "@/actions/upload-leads";

const LEAD_DB_PATH = "/Users/fortunemarq/Desktop/FortuneMarq-Build/07_DATA_AND_RESEARCH/Lead_Database";

// Files / folders to skip
const SKIP_FILES = new Set([
  "CONTEXT.md",
  "analyze_leads.py",
  "process_hubli_leads_v2.py",
  "website_phone_scraper.py",
  "No_Phone_Has_Website_Leads.csv",
  "Website_Rescrape_Queue.csv",
  "Hubli_All_Leads_Clean.csv", // already covered by Hubli_Final
]);

// Folders to skip (older unprocessed versions superseded by _Final or other cleaned versions)
const SKIP_FOLDERS = new Set([
  "Hubli_cleaned_leads", // superseded by Hubli_Final
]);

function normBool(val: string | undefined): boolean | null {
  if (!val) return null;
  return ["y", "yes", "true", "1"].includes(val.toLowerCase().trim());
}

function normPhone(val: string | undefined): string | null {
  if (!val) return null;
  const digits = val.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function buildTags(hasWebsite: boolean | null, serpRanked: boolean | null): string[] {
  const tags: string[] = [];
  if (hasWebsite === true) tags.push("Has Website");
  if (hasWebsite === false) tags.push("No Website");
  if (serpRanked === true) tags.push("SERP Ranked");
  if (serpRanked === false) tags.push("Not SERP Ranked");
  return tags;
}

function parseCSV(filepath: string): Record<string, string>[] {
  const content = fs.readFileSync(filepath, "utf-8").replace(/^﻿/, ""); // strip BOM
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    cols.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim(); });
    rows.push(row);
  }
  return rows;
}

function mapRow(row: Record<string, string>, batchId: string): UploadLeadParams | null {
  // Business Name is required
  const companyName = row["Business Name"] || row["company_name"] || "";
  if (!companyName.trim()) return null;

  // Phone — both "Phone" and "Phone No" column names
  const rawPhone = row["Phone"] || row["Phone No"] || row["phone"] || "";
  const phone = normPhone(rawPhone);

  const city = row["City"] || row["city"] || "";
  const industry = row["Niche"] || row["Industry"] || row["industry"] || "";

  // Has Website
  const rawHasWebsite = row["Has Website"] || row["has_website"] || "";
  const rawWebsiteLink = row["Website Link"] || row["website_link"] || "";
  // If there's a website link that's a real URL, treat as has_website=true
  const hasWebsiteFromLink = rawWebsiteLink && rawWebsiteLink !== "nil" && rawWebsiteLink.startsWith("http");
  const hasWebsite = normBool(rawHasWebsite) ?? (hasWebsiteFromLink ? true : null);

  const websiteLink = hasWebsiteFromLink ? rawWebsiteLink : null;
  const gmbLink = row["Google Maps Link"] || row["gmb_link"] || null;

  const rawSerpRanked = row["SERP Ranked"] || row["serp_ranked"] || "";
  const serpRanked = rawSerpRanked ? normBool(rawSerpRanked) : null;
  const serpSource = row["SERP Source"] || row["serp_source"] || null;

  const contactPerson = row["Owner Name"] || row["contact_person"] || null;

  const tags = buildTags(hasWebsite, serpRanked);

  return {
    company_name: companyName,
    phone: phone,
    has_website: hasWebsite ?? false,
    website_link: websiteLink || null,
    gmb_link: gmbLink || null,
    industry: industry || "Unknown",
    city: city || "Unknown",
    source: "bulk_import",
    import_batch_id: batchId,
    lead_type: "outbound",
    serp_ranked: serpRanked,
    serp_source: serpSource || null,
    tags,
    // contact_person isn't in UploadLeadParams — we'll handle via direct DB if needed
  };
}

export type BulkImportResult = {
  totalFiles: number;
  totalLeads: number;
  totalAdded: number;
  totalSkipped: number;
  errors: string[];
  fileResults: { file: string; added: number; skipped: number }[];
};

export async function runBulkImport(): Promise<BulkImportResult> {
  const batchId = `bulk_${Date.now()}`;
  const result: BulkImportResult = {
    totalFiles: 0,
    totalLeads: 0,
    totalAdded: 0,
    totalSkipped: 0,
    errors: [],
    fileResults: [],
  };

  // Collect all CSV files
  const allFiles: string[] = [];

  function walkDir(dir: string) {
    const folderName = path.basename(dir);
    if (SKIP_FOLDERS.has(folderName)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".csv") && !SKIP_FILES.has(entry.name)) {
        allFiles.push(fullPath);
      }
    }
  }

  try {
    walkDir(LEAD_DB_PATH);
  } catch (e: any) {
    result.errors.push(`Failed to read lead database folder: ${e.message}`);
    return result;
  }

  result.totalFiles = allFiles.length;

  // Process each file
  for (const filepath of allFiles) {
    const filename = path.relative(LEAD_DB_PATH, filepath);
    try {
      const rows = parseCSV(filepath);
      const leads: UploadLeadParams[] = [];

      for (const row of rows) {
        const lead = mapRow(row, batchId);
        if (lead) leads.push(lead);
      }

      result.totalLeads += leads.length;

      if (leads.length === 0) continue;

      // Upload in chunks of 200 per file to avoid memory issues
      let fileAdded = 0;
      let fileSkipped = 0;

      for (let i = 0; i < leads.length; i += 200) {
        const chunk = leads.slice(i, i + 200);
        const uploadResult = await uploadLeads(chunk);
        fileAdded += uploadResult.addedCount || 0;
        fileSkipped += uploadResult.skippedCount || 0;
        if (!uploadResult.success && uploadResult.message) {
          result.errors.push(`${filename}: ${uploadResult.message}`);
        }
      }

      result.totalAdded += fileAdded;
      result.totalSkipped += fileSkipped;
      result.fileResults.push({ file: filename, added: fileAdded, skipped: fileSkipped });

    } catch (e: any) {
      result.errors.push(`${filename}: ${e.message}`);
    }
  }

  return result;
}
