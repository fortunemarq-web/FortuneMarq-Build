"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Building2,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Files
} from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase";
import { uploadLeads } from "@/actions/upload-leads"; // Server Action
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// Types
import type { UploadLeadParams } from "@/actions/upload-leads";

interface CsvRow {
  "Business Name": string;
  "Phone No"?: string;
  "Phone"?: string;
  "Has Website"?: string;
  "Website Link"?: string;
  "Google Maps Link"?: string;
  "SERP_Ranked"?: string;
  "SERP Ranked"?: string;
  "SERP_Source"?: string;
  "SERP Source"?: string;
  [key: string]: any;
}

// Config
const INDUSTRIES = [
  "Dental Clinics",
  "Physiotherapy Clinics",
  "Skin Clinics",
  "IVF Fertility Clinics",
  "Diagnostics Labs",
  "NEET / Medical Entrance Coaching",
  "JEE / Engineering Entrance Coaching",
  "School Tuition / Academic Coaching",
  "Computer / IT Training Institutes",
  "IELTS / Spoken English / Study Abroad",
  "Real Estate",
  "Modular Kitchen",
  "Interior Designers",
  "Car Rental and Taxi Services"
];
const CITIES = [
  "Hubli",
  "Dharwad",
  "Belagavi",
  "Kalaburgi",
  "Mangaluru",
  "Davangere",
  "Ballari",
  "Vijayapura",
  "Mysuru"
];

export default function CsvUploader() {
  const router = useRouter();

  // Form State
  const [files, setFiles] = useState<File[]>([]);
  const [parsedLeads, setParsedLeads] = useState<UploadLeadParams[]>([]);

  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");

  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");

  const [leadType, setLeadType] = useState<"outbound" | "inbound">("outbound");
  const [leadSource, setLeadSource] = useState("manual_upload");

  // Market Intelligence State (Preserved)
  const [showMarketIntelligence, setShowMarketIntelligence] = useState(false);
  const [marketData, setMarketData] = useState({
    monthlySearchDemand: "",
    topKeywords: "",
    localSeoVisibility: "",
    websiteAuditSnapshot: "",
    competitorTraffic: "",
    competitorKeywords: "",
    googleAdsActivity: "",
    competitorReputation: ""
  });

  // Upload State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    added?: number;
    skipped?: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndParse(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) validateAndParse(selectedFiles);
  };

  const validateAndParse = (fileList: File[]) => {
    const validFiles = fileList.filter(f => f.name.endsWith(".csv"));

    if (validFiles.length === 0) {
      setError("Please upload valid CSV files.");
      return;
    }

    setFiles(validFiles);
    setError(null);
    setUploadResult(null);
    setProgress(0);
    setParsedLeads([]); // Reset before parsing new batch

    let completedParses = 0;
    const allLeads: UploadLeadParams[] = [];
    let hasError = false;

    validFiles.forEach(file => {
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (hasError) return;

          if (results.meta.fields && !results.meta.fields.includes("Business Name")) {
            setError(`File "${file.name}" missing 'Business Name' header.`);
            hasError = true;
            setFiles([]);
            setParsedLeads([]);
            return;
          }

          // Transform Data immediately to preview/ready state
          const leads: UploadLeadParams[] = results.data
            .filter(row => row["Business Name"] && row["Business Name"].trim() !== "")
            .map(row => {
              // Logic: Handle Website Link and Has Website inference
              const websiteLinkRaw = row["Website Link"]?.trim();
              let hasWebsite = false;
              let websiteLink: string | null = null;

              // 1. Clean up website link (handle "nil" specifically)
              if (websiteLinkRaw && websiteLinkRaw.toLowerCase() !== "nil" && websiteLinkRaw !== "") {
                websiteLink = websiteLinkRaw;
              }

              // 2. Determine hasWebsite status
              if (row["Has Website"]) {
                // Explicit column exists
                const hw = row["Has Website"].toString().toLowerCase().trim();
                hasWebsite = ["yes", "true", "1", "available", "y"].includes(hw);

                // If explicitly said NO, ensure link is null
                if (!hasWebsite) websiteLink = null;
              } else {
                // Infer from link existence
                hasWebsite = !!websiteLink;
              }

              const gmbLinkRaw = row["Google Maps Link"]?.trim();
              const gmbLink = gmbLinkRaw && gmbLinkRaw !== "" ? gmbLinkRaw : null;

              const serpRankedRaw = (row["SERP_Ranked"] || row["SERP Ranked"] || "").trim().toUpperCase();
              const serp_ranked = serpRankedRaw ? ["Y", "YES", "TRUE", "1"].includes(serpRankedRaw) : null;
              const serp_source = (row["SERP_Source"] || row["SERP Source"] || "").trim() || null;

              const tags: string[] = [];
              if (serp_ranked === true) tags.push("SERP Ranked");
              if (serp_ranked === false) tags.push("Not SERP Ranked");

              return {
                company_name: row["Business Name"].trim(),
                phone: (row["Phone No"] || row["Phone"])?.toString().trim() || null,
                has_website: hasWebsite,
                website_link: websiteLink,
                gmb_link: gmbLink,
                // Placeholders - will be filled on submit
                industry: "",
                city: "",
                source: "",
                lead_type: "",
                import_batch_id: "",
                serp_ranked,
                serp_source,
                tags
              };
            });

          allLeads.push(...leads);
          completedParses++;

          if (completedParses === validFiles.length && !hasError) {
            if (allLeads.length === 0) {
              setError("No valid leads found in uploaded files. Check 'Business Name' column.");
              setFiles([]);
            } else {
              setParsedLeads(allLeads);
            }
          }
        },
        error: (err) => {
          setError(`Parse Error in ${file.name}: ${err.message}`);
          hasError = true;
        }
      });
    });
  };

  const processUpload = async () => {
    // Resolve final values
    const finalIndustry = industry === "Other" ? customIndustry.trim() : industry;
    const finalCity = city === "Other" ? customCity.trim() : city;

    if (!finalIndustry || !finalCity) {
      setError("Please select (or enter) both Industry and City.");
      return;
    }
    if (parsedLeads.length === 0) return;

    setIsProcessing(true);
    setError(null);

    setProgress(30);

    try {
      const supabase = createClient();
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 1. Save Market Intelligence (Client Side - pure Supabase)
      // Only if data is entered
      const hasMarketData = Object.values(marketData).some(v => v.trim() !== "");
      if (hasMarketData) {
        // Upsert logic similar to before
        const insightPayload = {
          industry: finalIndustry,
          city: finalCity,
          general_insights: {
            monthlySearchDemand: marketData.monthlySearchDemand,
            topKeywords: marketData.topKeywords,
            localSeoVisibility: marketData.localSeoVisibility,
            websiteAuditSnapshot: marketData.websiteAuditSnapshot
          },
          competitor_insights: {
            competitorTraffic: marketData.competitorTraffic,
            competitorKeywords: marketData.competitorKeywords,
            googleAdsActivity: marketData.googleAdsActivity,
            competitorReputation: marketData.competitorReputation
          }
        };

        // Try to find existing
        const { data: existing } = await (supabase.from("market_insights") as any)
          .select("id")
          .eq("industry", finalIndustry)
          .eq("city", finalCity)
          .single();

        if (existing) {
          await (supabase.from("market_insights") as any).update(insightPayload).eq("id", existing.id);
        } else {
          await (supabase.from("market_insights") as any).insert(insightPayload);
        }
      }

      // 2. Prepare Leads for Server Action
      const finalLeads = parsedLeads.map(l => ({
        ...l,
        industry: finalIndustry,
        city: finalCity,
        lead_type: leadType,
        source: leadType === "inbound" ? leadSource : "manual_upload",
        import_batch_id: batchId
      }));

      setProgress(70);

      // Call Server Action
      const result = await uploadLeads(finalLeads);

      setProgress(100);

      if (result.success) {
        setUploadResult({
          success: true,
          added: result.addedCount,
          skipped: result.skippedCount,
          message: result.message
        });

        // Log to csv_uploads table (optional for history)
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase.from("csv_uploads") as any).insert({
          filename: files.map(f => f.name).join(", "),
          uploaded_by: user?.id,
          leads_count: result.addedCount,
          industry: finalIndustry,
          city: finalCity,
          lead_type: leadType,
          source: leadType === "inbound" ? leadSource : "manual_upload",
          has_market_data: hasMarketData,
          import_batch_id: batchId
        });

        setFiles([]);
        setParsedLeads([]);
        setCustomIndustry("");
        setCustomCity("");

        router.refresh();

      } else {
        setError(result.message || "Upload failed.");
        setUploadResult({ success: false, message: result.message });
      }

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-4xl space-y-6"
    >

      {/* 1. Market Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-line bg-slate-50 p-5">
        <div className="md:col-span-2 flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-brand-deep" />
          <h3 className="font-display text-sm font-semibold text-slate-900 uppercase tracking-wide">Target Market</h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-medium ml-1">Industry</label>
          <div className="relative">
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full appearance-none rounded-lg bg-surface border border-line px-3 py-2.5 text-sm text-slate-900 focus:border-brand-line focus:ring-1 focus:ring-brand-line outline-none transition-colors"
            >
              <option value="">Select Industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              <option value="Other">+ Create New Industry</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
          {industry === "Other" && (
            <input
              type="text"
              placeholder="Enter Custom Industry Name"
              value={customIndustry}
              onChange={e => setCustomIndustry(e.target.value)}
              className="mt-2 w-full appearance-none rounded-lg bg-surface border border-line px-3 py-2.5 text-sm text-brand-deep focus:border-brand-line outline-none transition-colors animate-in fade-in"
              autoFocus
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-medium ml-1">City</label>
          <div className="relative">
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full appearance-none rounded-lg bg-surface border border-line px-3 py-2.5 text-sm text-slate-900 focus:border-brand-line focus:ring-1 focus:ring-brand-line outline-none transition-colors"
            >
              <option value="">Select City...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Other">+ Create New City</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
          {city === "Other" && (
            <input
              type="text"
              placeholder="Enter Custom City Name"
              value={customCity}
              onChange={e => setCustomCity(e.target.value)}
              className="mt-2 w-full appearance-none rounded-lg bg-surface border border-line px-3 py-2.5 text-sm text-brand-deep focus:border-brand-line outline-none transition-colors animate-in fade-in"
              autoFocus
            />
          )}
        </div>
      </div>

      {/* 2. Drag & Drop Zone */}
      <motion.div
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "#42CA80" : "#e2e8f0",
          backgroundColor: isDragging ? "rgba(66, 202, 128, 0.05)" : "#f8fafc",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center group",
          files.length === 0 ? "cursor-pointer hover:border-line-strong" : "border-brand-line bg-brand-soft/40"
        )}
        onClick={() => files.length === 0 && document.getElementById("hidden-file-input")?.click()}
      >
        <input
          type="file"
          id="hidden-file-input"
          hidden
          accept=".csv"
          multiple
          onChange={handleFileSelect}
          disabled={files.length > 0}
        />

        {files.length === 0 ? (
          <>
            <div className="h-16 w-16 mb-4 rounded-full bg-surface flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-7 w-7 text-slate-500 group-hover:text-slate-900 transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">Drag &amp; Drop CSV File(s)</h3>
            <p className="text-sm text-slate-600 mb-4">or click to browse multiple files</p>
            <div className="flex gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-line">
              <span>Required: Business Name</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 self-center"></span>
              <span>Phone No</span>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
            {files.length === 1 ? (
              <FileSpreadsheet className="h-12 w-12 text-brand-deep mb-3" />
            ) : (
              <Files className="h-12 w-12 text-brand-deep mb-3" />
            )}

            <p className="text-slate-900 font-medium text-lg">
              {files.length === 1 ? files[0].name : `${files.length} Files Selected`}
            </p>
            {files.length > 1 && (
              <p className="text-xs text-slate-600 mt-1 max-w-md truncate">
                {files.map(f => f.name).join(", ")}
              </p>
            )}
            <p className="text-brand-deep text-sm mt-3 font-semibold bg-brand-soft px-3 py-1 rounded-full tabular-nums">{parsedLeads.length} Potential Leads Found Total</p>

            <button
              onClick={(e) => { e.stopPropagation(); setFiles([]); setParsedLeads([]); setUploadResult(null); error && setError(null); }}
              className="mt-4 text-xs text-danger hover:underline"
            >
              Remove Files &amp; Reset
            </button>
          </div>
        )}
      </motion.div>

      {/* 3. Action Panel & Progress */}
      {files.length > 0 && parsedLeads.length > 0 && !uploadResult && (
        <div className="bg-slate-50 border border-line rounded-xl p-6 animate-in slide-in-from-top-4">

          {/* Lead Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-2 block">Lead Type</label>
              <div className="flex bg-surface border border-line p-1 rounded-lg">
                {(["outbound", "inbound"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setLeadType(t); if (t === "outbound") setLeadSource("manual_upload"); else setLeadSource("Facebook Ads"); }}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-lg transition-colors",
                      leadType === t ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {leadType === "inbound" && (
              <div className="animate-in fade-in">
                <label className="text-xs text-slate-500 font-medium mb-2 block">Source Channel</label>
                <select
                  value={leadSource}
                  onChange={e => setLeadSource(e.target.value)}
                  className="w-full bg-surface border border-line text-slate-900 text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-line"
                >
                  <option value="Facebook Ads">Facebook Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Website Form">Website Form</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </div>

          {/* Market Intel Toggle */}
          <div className="mb-6 border-t border-line pt-4">
            <button
              onClick={() => setShowMarketIntelligence(!showMarketIntelligence)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <BarChart3 className="h-3 w-3" />
              {showMarketIntelligence ? "Hide Market Research Data" : "Add Market Research Data (Optional)"}
            </button>

            {showMarketIntelligence && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <input placeholder="Monthly Search Demand (e.g. 1.5k)" className="bg-surface border border-line text-xs text-slate-900 p-2.5 rounded-lg outline-none focus:border-brand-line"
                  value={marketData.monthlySearchDemand} onChange={e => setMarketData({ ...marketData, monthlySearchDemand: e.target.value })} />
                <input placeholder="Competitor Traffic (e.g. 5k visits)" className="bg-surface border border-line text-xs text-slate-900 p-2.5 rounded-lg outline-none focus:border-brand-line"
                  value={marketData.competitorTraffic} onChange={e => setMarketData({ ...marketData, competitorTraffic: e.target.value })} />
                {/* Simplified inputs for brevity/UI cleaniness, user can expand if needed */}
                <textarea placeholder="Top Keywords..." rows={2} className="md:col-span-2 bg-surface border border-line text-xs text-slate-900 p-2.5 rounded-lg outline-none focus:border-brand-line resize-none"
                  value={marketData.topKeywords} onChange={e => setMarketData({ ...marketData, topKeywords: e.target.value })} />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="relative">
            {/* Progress Bar Background */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-200 rounded-lg overflow-hidden h-[44px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full bg-brand"
                ></motion.div>
              </div>
            )}

            <button
              onClick={processUpload}
              disabled={isProcessing}
              className={clsx(
                "relative w-full h-[44px] flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide rounded-lg transition-colors",
                isProcessing ? "text-slate-900 cursor-wait" : "bg-brand-deep text-white hover:bg-brand-deeper"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing {parsedLeads.length} Leads...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Import {parsedLeads.length} Leads
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-danger text-xs bg-danger-soft p-3 rounded-lg border border-danger-line">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* 4. Success State */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center p-8 bg-surface border border-line rounded-2xl shadow-lg"
          >
            <div className="h-16 w-16 mb-4 rounded-full bg-brand text-white flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-slate-900 mb-2">Import Successful!</h2>
            <p className="text-slate-500 mb-6 text-center max-w-sm">{uploadResult.message}</p>

            <div className="flex gap-4 w-full">
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-line text-center">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">{uploadResult.added}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">Added</p>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-line text-center">
                <p className="text-2xl font-semibold tabular-nums text-slate-500">{uploadResult.skipped}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">Skipped (Dupes)</p>
              </div>
            </div>

            <button
              onClick={() => { setFiles([]); setParsedLeads([]); setUploadResult(null); }}
              className="mt-8 text-sm text-brand-deep hover:text-brand-deeper font-medium hover:underline"
            >
              Upload More Files
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
