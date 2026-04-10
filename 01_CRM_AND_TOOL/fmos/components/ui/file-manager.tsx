"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    FileImage,
    FileSpreadsheet,
    FileVideo,
    FileAudio,
    File as FileIcon,
    Download,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FolderOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { uploadFile, type UploadedFile } from "@/lib/file-service";
import { formatDistanceToNow } from "date-fns";

// ─── Props ──────────────────────────────────────────────────────────
interface FileManagerProps {
    bucket: "agency-internal" | "project-assets" | "client-deliverables";
    projectId?: string;
    leadId?: string;
    isClientVisible?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Return a Lucide icon component based on the file extension / MIME type. */
function getFileIcon(name: string, type: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";

    if (["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(ext) || type.startsWith("text/"))
        return <FileText className="h-5 w-5 text-red-400" />;
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext) || type.startsWith("image/"))
        return <FileImage className="h-5 w-5 text-purple-400" />;
    if (["xls", "xlsx", "csv"].includes(ext) || type.includes("spreadsheet"))
        return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext) || type.startsWith("video/"))
        return <FileVideo className="h-5 w-5 text-sky-400" />;
    if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext) || type.startsWith("audio/"))
        return <FileAudio className="h-5 w-5 text-amber-400" />;

    return <FileIcon className="h-5 w-5 text-slate-600" />;
}

/** Format bytes into a human-readable string (e.g. 2.5 MB). */
function formatSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

// ─── Component ──────────────────────────────────────────────────────
export default function FileManager({
    bucket,
    projectId,
    leadId,
    isClientVisible = false,
}: FileManagerProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100 synthetic progress
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Toast helper ────────────────────────────────────────────────
    const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ── Fetch file list ─────────────────────────────────────────────
    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            let query = (supabase.from("files") as any)
                .select("*")
                .eq("bucket", bucket)
                .order("uploaded_at", { ascending: false });

            if (projectId) query = query.eq("project_id", projectId);
            if (leadId) query = query.eq("lead_id", leadId);

            const { data, error } = await query;

            if (error) {
                console.error("Failed to fetch files:", error);
                showToast("Could not load files", "error");
            } else {
                setFiles((data as UploadedFile[]) ?? []);
            }
        } catch {
            showToast("Something went wrong loading files", "error");
        } finally {
            setIsLoading(false);
        }
    }, [bucket, projectId, leadId, showToast]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // ── Upload handler ──────────────────────────────────────────────
    const handleUpload = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;
            setIsUploading(true);
            setUploadProgress(0);

            // Synthetic progress ticker (bumps up every 150ms until upload finishes)
            const tick = setInterval(() => {
                setUploadProgress((p) => (p < 90 ? p + Math.random() * 12 : p));
            }, 150);

            let successCount = 0;
            let errorCount = 0;

            for (const file of acceptedFiles) {
                try {
                    await uploadFile({
                        file,
                        bucket,
                        projectId,
                        leadId,
                        isClientVisible,
                    });
                    successCount++;
                } catch (err) {
                    console.error("Upload error:", err);
                    errorCount++;
                }
            }

            clearInterval(tick);
            setUploadProgress(100);

            // Brief pause at 100% for polish
            await new Promise((r) => setTimeout(r, 400));

            setIsUploading(false);
            setUploadProgress(0);

            if (successCount > 0) {
                showToast(
                    `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`,
                    "success",
                );
                fetchFiles(); // auto-refresh
            }
            if (errorCount > 0) {
                showToast(
                    `${errorCount} file${errorCount > 1 ? "s" : ""} failed to upload`,
                    "error",
                );
            }
        },
        [bucket, projectId, leadId, isClientVisible, fetchFiles, showToast],
    );

    // ── Dropzone ────────────────────────────────────────────────────
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleUpload,
        disabled: isUploading,
        multiple: true,
    });

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="relative w-full">
            {/* ── Toast notification ────────────────────────────────── */}
            {toast && (
                <div
                    className={`fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xl transition-all ${toast.type === "success"
                            ? "bg-[#42CA80] text-slate-900 shadow-[#42CA80]/30"
                            : "bg-red-500 text-slate-900 shadow-red-500/30"
                        }`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* ── Drop zone ─────────────────────────────────────────── */}
            <div
                {...getRootProps()}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragActive
                        ? "border-[#42CA80] bg-[#42CA80]/10 shadow-lg shadow-[#42CA80]/10"
                        : "border-slate-200 bg-slate-50 hover:border-[#42CA80]/40 hover:bg-[#141414]"
                    } ${isUploading ? "pointer-events-none" : ""}`}
            >
                <input {...getInputProps()} />

                {/* Upload progress overlay */}
                {isUploading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50/80 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-[#42CA80]" />
                        <div className="w-48">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#42CA80] to-[#3ab872] transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-center text-xs text-slate-500">
                                Uploading… {Math.round(uploadProgress)}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Idle / drag-active content */}
                <div className="flex flex-col items-center justify-center px-6 py-10">
                    <div
                        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${isDragActive
                                ? "scale-110 bg-[#42CA80]/20"
                                : "bg-white group-hover:bg-[#42CA80]/10"
                            }`}
                    >
                        <Upload
                            className={`h-6 w-6 transition-colors duration-300 ${isDragActive ? "text-[#42CA80]" : "text-slate-600 group-hover:text-[#42CA80]"
                                }`}
                        />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                        {isDragActive ? "Drop files here" : "Drag & drop files here"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">or click to browse</p>
                </div>
            </div>

            {/* ── File list ─────────────────────────────────────────── */}
            <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Files ({files.length})
                </h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-[#42CA80]" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                        <FileIcon className="mx-auto h-8 w-8 text-[#333]" />
                        <p className="mt-2 text-sm text-slate-600">No files yet</p>
                    </div>
                ) : (
                    <ul className="space-y-1.5">
                        {files.map((f) => (
                            <li
                                key={f.id}
                                className="group/row flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-slate-200 hover:bg-[#141414]"
                            >
                                {/* Icon */}
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                                    {getFileIcon(f.name, f.type)}
                                </div>

                                {/* Name + meta */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                                        <span>{formatSize(f.size)}</span>
                                        <span className="text-[#333]">·</span>
                                        <span>
                                            {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                {/* Download */}
                                <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 opacity-0 transition-all hover:bg-white hover:text-[#42CA80] group-hover/row:opacity-100"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
